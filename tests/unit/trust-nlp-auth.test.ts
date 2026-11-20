// Unit tests: grounding verifier edge cases, Bayesian trust, fare sanity, pools,
// Banglish parser, conversation engine, server auth helpers.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { AlertStatus, HubId, ScenarioPreset, TransportMode, ValidationStatus } from "../../src/contracts/schema";
import { CANONICAL_GRAPH_G0 } from "../../src/contracts/canonicalGraph";
import { executeParetoSearch } from "../../src/engine/paretoRouter";
import { verifySubgraphTrajectory } from "../../src/features/feature-1-commute/subgraphVerifier";
import { computePosteriorConfidence, evaluateDecayedAlert } from "../../src/features/feature-3-trust-cms/bayesianTruth";
import { validateFareSubmission, createUncorroboratedShahbaghAlert } from "../../src/features/feature-3-trust-cms/sanityFilter";
import { computePoolSplit, getJoinedPoolSizes, mutateRideSharePool } from "../../src/features/feature-3-trust-cms/rideSharePool";
import { parseBanglishQueryDeterministic } from "../../src/features/feature-1-commute/banglishParser";
import { processConversationTurn } from "../../src/features/feature-1-commute/conversationEngine";
import { findHubMentions } from "../../src/features/feature-1-commute/hubMatching";
import { CANONICAL_HUBS } from "../../src/contracts/canonicalGraph";
import {
  clientKey, createAdminCookie, rateLimit, resolveSession, verifyAdminPasscode, ADMIN_COOKIE, isAdminRequest,
} from "../../src/lib/serverAuth";

const baseRoute = () => executeParetoSearch({
  action_id: "t", raw_query_text: "", origin_hub_id: HubId.H_MIRPUR10, dest_hub_id: HubId.H_MOTIJHEEL,
  is_student: false, max_budget_bdt: 0, avoid_hub_ids: [], timestamp_ms: 0,
}, ScenarioPreset.NORMAL_BASELINE).routes[0];

// ---------------- grounding verifier ----------------
test("verifier: tampered leg fare is rejected", () => {
  const r = baseRoute();
  const t = { ...r, legs: r.legs.map((l, i) => i === 0 ? { ...l, effective_fare_bdt: l.effective_fare_bdt + 7 } : l) };
  assert.equal(verifySubgraphTrajectory(t, false).isValid, false);
});

test("verifier: hallucinated edge_id should not be grounded via hub-pair fallback", () => {
  const r = baseRoute();
  const fake = { ...r, legs: [{ ...r.legs[0], edge_id: "E_HALLUCINATED" }, ...r.legs.slice(1)] };
  assert.equal(verifySubgraphTrajectory(fake, false).isValid, false);
});

test("verifier: route totals must match the sum of leg fares", () => {
  const r = baseRoute();
  assert.equal(verifySubgraphTrajectory({ ...r, total_effective_fare_bdt: 1 }, false).isValid, false);
});

test("verifier: leg duration far below canonical edge duration is rejected", () => {
  const r = baseRoute();
  const fast = { ...r, legs: r.legs.map((l) => ({ ...l, effective_duration_ms: 1 })), total_duration_ms: r.legs.length };
  assert.equal(verifySubgraphTrajectory(fast, false).isValid, false);
});

test("verifier: rickshaw fare with client-claimed pool/surge cannot undercut the solo fare", () => {
  const rick = CANONICAL_GRAPH_G0.find((e) => e.mode === TransportMode.RICKSHAW)!;
  const leg = {
    edge_id: rick.edge_id, origin_hub_id: rick.origin_hub_id, dest_hub_id: rick.dest_hub_id, mode: rick.mode,
    route_name: rick.route_name, regular_fare_bdt: rick.base_fare_bdt, effective_fare_bdt: Math.ceil(rick.base_fare_bdt / 4),
    surge_multiplier: 1, pool_size_count: 4, effective_duration_ms: rick.base_duration_ms, boarding_landmark: "",
  };
  const route = { route_id: "x", legs: [leg], total_regular_fare_bdt: leg.regular_fare_bdt, total_effective_fare_bdt: leg.effective_fare_bdt,
    total_duration_ms: leg.effective_duration_ms, transfers_count: 0, generalized_cost_score: 0, grounding_status: ValidationStatus.GRAPH_GROUNDED };
  // A 4-way pooled fare is only grounded when the server says the rider holds a seat in that pool.
  assert.equal(verifySubgraphTrajectory(route, false).isValid, false);
  assert.equal(verifySubgraphTrajectory(route, false, { poolSizes: { [rick.edge_id]: 4 } }).isValid, true);
  // Solo fare is always valid; a claimed surge of 1 under a 1.8 scenario is not.
  const solo = { ...route, legs: [{ ...leg, effective_fare_bdt: rick.base_fare_bdt }], total_effective_fare_bdt: rick.base_fare_bdt };
  assert.equal(verifySubgraphTrajectory(solo, false).isValid, true);
  assert.equal(verifySubgraphTrajectory(solo, false, { surgeMultiplier: 1.8 }).isValid, false);
});

test("verifier: edge_id pointing at a different hub pair is rejected", () => {
  const r = baseRoute();
  const other = CANONICAL_GRAPH_G0.find((e) => e.mode === r.legs[1].mode && e.edge_id !== r.legs[1].edge_id)!;
  const swapped = { ...r, legs: [r.legs[0], { ...r.legs[1], edge_id: other.edge_id }] };
  assert.equal(verifySubgraphTrajectory(swapped, false).isValid, false);
});

test("verifier: discontinuous route rejected", () => {
  const r = baseRoute();
  const broken = { ...r, legs: [...r.legs].reverse() };
  assert.equal(verifySubgraphTrajectory(broken, false).isValid, false);
});

// ---------------- Bayesian ----------------
test("bayesian: one vote's weight halves after 30 minutes (log-odds)", () => {
  const logit = (p: number) => Math.log(p / (1 - p));
  const prior = 0.15, t0 = 1_000_000;
  const vote = { direction: 1 as const, reliability_weight: 1, timestamp_ms: t0 };
  const d0 = logit(computePosteriorConfidence(prior, [vote], t0)) - logit(prior);
  const d30 = logit(computePosteriorConfidence(prior, [vote], t0 + 30 * 60_000)) - logit(prior);
  assert.ok(Math.abs(d30 - d0 / 2) < 1e-3, `${d0} ${d30}`);
});

test("bayesian: future-dated vote must not get more than full weight", () => {
  const now = 1_000_000;
  const p = computePosteriorConfidence(0.15, [{ direction: 1, reliability_weight: 1, timestamp_ms: now + 3_600_000 }], now);
  const pNow = computePosteriorConfidence(0.15, [{ direction: 1, reliability_weight: 1, timestamp_ms: now }], now);
  assert.ok(p <= pNow + 1e-12);
});

test("bayesian: posterior bounded in (0,1) under extreme inputs", () => {
  const votes = Array.from({ length: 500 }, () => ({ direction: 1 as const, reliability_weight: 1, timestamp_ms: 0 }));
  for (const prior of [0, 1, -5, 5, NaN]) {
    const p = computePosteriorConfidence(prior, votes, 0);
    assert.ok(Number.isFinite(p) && p > 0 && p < 1, `prior ${prior} -> ${p}`);
  }
});

test("single uncorroborated report stays PENDING and decays to EXPIRED", () => {
  const a = createUncorroboratedShahbaghAlert(0);
  assert.equal(a.status, AlertStatus.PENDING_CORROBORATION);
  assert.equal(evaluateDecayedAlert(a, 3 * 3_600_000).status, AlertStatus.EXPIRED);
});

// ---------------- fare sanity ----------------
test("fare sanity: legit fare for every motorized edge accepted, 9 and 3x rejected", () => {
  const fails: string[] = [];
  for (const e of CANONICAL_GRAPH_G0) {
    if (e.mode === TransportMode.WALK) continue;
    const ok = validateFareSubmission(e.edge_id, Math.max(10, validateFareSubmission(e.edge_id, 10).baseFareBdt));
    if (!ok.isValid) fails.push(`${e.edge_id} base rejected`);
    if (validateFareSubmission(e.edge_id, 9).isValid) fails.push(`${e.edge_id} 9 accepted`);
    if (validateFareSubmission(e.edge_id, ok.baseFareBdt * 3 + 1).isValid) fails.push(`${e.edge_id} 3x accepted`);
  }
  assert.deepEqual(fails, []);
});

test("fare sanity: legitimately surged rickshaw fare (ADVERSARIAL preset 2.4x) is accepted", () => {
  const rick = CANONICAL_GRAPH_G0.find((e) => e.mode === TransportMode.RICKSHAW)!;
  assert.equal(validateFareSubmission(rick.edge_id, Math.ceil(rick.base_fare_bdt * 2.4)).isValid, true);
});

// ---------------- pools ----------------
test("pool split: math and clamps", () => {
  assert.deepEqual(
    [computePoolSplit(50, 1.8, 3).perPersonFareBdt, computePoolSplit(50, 1.8, 3).savingsBdt],
    [30, 60]);
  assert.equal(computePoolSplit(50, 99, 99).poolSizeCount, 4);
  assert.equal(computePoolSplit(NaN, NaN, NaN).perPersonFareBdt, 0);
});

test("pool: capacity 4, idempotent replay, leave works", () => {
  const edge = "E_UNIT_POOL_" + Date.now();
  const s1 = mutateRideSharePool("a1", edge, "u1", "JOIN", 40, 1.5, "H_MIRPUR10");
  assert.equal(s1.poolSizeCount, 2); // includes one synthetic seed member
  mutateRideSharePool("a2", edge, "u2", "JOIN");
  mutateRideSharePool("a3", edge, "u3", "JOIN");
  const full = mutateRideSharePool("a4", edge, "u4", "JOIN");
  assert.equal(full.poolSizeCount, 4);
  assert.equal(full.isUserJoined, false);
  assert.equal(mutateRideSharePool("a1", edge, "u1", "JOIN").poolSizeCount, 2, "replay returns original snapshot");
  assert.equal(mutateRideSharePool("a5", edge, "u1", "LEAVE").isUserJoined, false);
});

test("pool: abandoned seats expire after 15 minutes; seeded riders stay", () => {
  mock.timers.enable({ apis: ["Date"], now: 1_000_000 });
  try {
    const edge = "E_UNIT_POOL_TTL";
    mutateRideSharePool("b1", edge, "ghost1", "JOIN");
    mutateRideSharePool("b2", edge, "ghost2", "JOIN");
    const full = mutateRideSharePool("b3", edge, "ghost3", "JOIN");
    assert.equal(full.poolSizeCount, 4);
    assert.equal(mutateRideSharePool("b4", edge, "real", "JOIN").isUserJoined, false, "full right now");
    mock.timers.tick(16 * 60 * 1000);
    const later = mutateRideSharePool("b5", edge, "real", "JOIN");
    assert.equal(later.isUserJoined, true);
    assert.equal(later.poolSizeCount, 2, "seed + real user; ghosts expired");
    assert.equal(getJoinedPoolSizes("real")[edge], 2);
    assert.equal("memberSessionIds" in later, false, "member ids are not exposed");
  } finally {
    mock.timers.reset();
  }
});

// ---------------- NLP ----------------
test("parser: every hub's English name resolves as origin and destination", () => {
  const fails: string[] = [];
  const hubs = Object.values(HubId);
  for (const o of hubs) for (const d of hubs) {
    if (o === d) continue;
    const r = parseBanglishQueryDeterministic(`${CANONICAL_HUBS[o].name_en} theke ${CANONICAL_HUBS[d].name_en} jabo`);
    if (r.origin_hub_id !== o || r.dest_hub_id !== d) fails.push(`${o}->${d} parsed ${r.origin_hub_id}->${r.dest_hub_id}`);
  }
  assert.deepEqual(fails, []);
});

test("parser: 'to' phrasing and Bangla script", () => {
  const a = parseBanglishQueryDeterministic("Uttara to Gulistan under 80 taka");
  assert.equal(a.origin_hub_id, HubId.H_UTTARA); assert.equal(a.dest_hub_id, HubId.H_GULISTAN);
  assert.equal(a.max_budget_bdt, 80);
  const b = parseBanglishQueryDeterministic("মিরপুর ১০ থেকে মতিঝিল যাবো");
  assert.equal(b.origin_hub_id, HubId.H_MIRPUR10); assert.equal(b.dest_hub_id, HubId.H_MOTIJHEEL);
});

test("parser: no budget given should not silently cap the search at a low number", () => {
  const r = parseBanglishQueryDeterministic("Uttara theke Jatrabari jabo");
  const routes = executeParetoSearch({ action_id: "x", raw_query_text: "", origin_hub_id: r.origin_hub_id, dest_hub_id: r.dest_hub_id,
    is_student: r.is_student, max_budget_bdt: r.max_budget_bdt, avoid_hub_ids: r.avoid_hub_ids, timestamp_ms: 0 }, ScenarioPreset.PEAK_CRISIS_SURGE).routes;
  assert.ok(routes.length > 0, `default budget ${r.max_budget_bdt} returns no route`);
});

test("parser: no stated budget means no limit; 'no budget' is understood", () => {
  assert.equal(parseBanglishQueryDeterministic("Uttara theke Jatrabari jabo").max_budget_bdt, 0);
  const nb = parseBanglishQueryDeterministic("Uttara to Jatrabari, no budget");
  assert.equal(nb.max_budget_bdt, 0);
  assert.ok(nb.extracted_raw.budget_token, "explicit 'no budget' is a budget token");
  assert.equal(parseBanglishQueryDeterministic("Farmgate -> Gulistan").origin_hub_id, HubId.H_FARMGATE);
});

test("conversation: a new trip drops the previous trip's budget and avoid list", () => {
  const ctx = { last_origin_hub_id: HubId.H_MIRPUR10, last_dest_hub_id: HubId.H_MOTIJHEEL, last_budget_bdt: 20, is_student: false,
    avoid_hub_ids: [HubId.H_FARMGATE], selected_route: null };
  const r = processConversationTurn("Uttara to Jatrabari", ctx, ScenarioPreset.NORMAL_BASELINE, []);
  assert.equal(r.updatedContext.last_budget_bdt, 0);
  assert.deepEqual(r.updatedContext.avoid_hub_ids, []);
  assert.ok(r.updatedContext.selected_route, r.replyText);
});

test("conversation: over-budget reply names the fare that would work", () => {
  const ctx = { last_origin_hub_id: HubId.H_UTTARA, last_dest_hub_id: HubId.H_MOTIJHEEL, last_budget_bdt: 15, is_student: false,
    avoid_hub_ids: [], selected_route: null };
  const r = processConversationTurn("Uttara theke Motijheel jabo", ctx, ScenarioPreset.NORMAL_BASELINE, []);
  assert.match(r.replyText, /cheapest grounded route I found costs \*\*\d+ BDT/);
});

test("parser: unknown places are not resolved / garbage input does not throw", () => {
  for (const s of ["", "   ", "Chittagong theke Sylhet", "🚌".repeat(400), "{\"origin\":1}", "a".repeat(5000)]) {
    const r = parseBanglishQueryDeterministic(s);
    assert.ok(typeof r.origin_resolved === "boolean");
  }
  const r = parseBanglishQueryDeterministic("Chittagong theke Sylhet");
  assert.equal(r.origin_resolved && r.dest_resolved, false);
});

test("hub matching does not match substrings inside other words", () => {
  assert.equal(findHubMentions("I am a baddass commuter").length, 0);
});

test("conversation: every hub pair route-search turn returns a grounded route or graceful reply", () => {
  const fails: string[] = [];
  const hubs = Object.values(HubId);
  for (const o of hubs) for (const d of hubs) {
    if (o === d) continue;
    const ctx = { last_origin_hub_id: HubId.H_MIRPUR10, last_dest_hub_id: HubId.H_MOTIJHEEL, last_budget_bdt: 55, is_student: true, avoid_hub_ids: [], selected_route: null };
    try {
      const r = processConversationTurn(`${CANONICAL_HUBS[o].name_en} theke ${CANONICAL_HUBS[d].name_en} jabo`, ctx, ScenarioPreset.NORMAL_BASELINE, []);
      if (!r.replyText) fails.push(`${o}->${d} empty reply`);
      if (r.updatedContext.last_origin_hub_id !== o || r.updatedContext.last_dest_hub_id !== d) fails.push(`${o}->${d} ctx ${r.updatedContext.last_origin_hub_id}->${r.updatedContext.last_dest_hub_id}`);
    } catch (e) { fails.push(`${o}->${d} threw ${(e as Error).message}`); }
  }
  assert.deepEqual(fails, []);
});

// ---------------- server auth ----------------
const req = (headers: Record<string, string> = {}) => new NextRequest("http://localhost/api", { headers });

test("auth: no built-in passcode; only ADMIN_PASSCODE unlocks admin", () => {
  const saved = process.env.ADMIN_PASSCODE;
  try {
    delete process.env.ADMIN_PASSCODE;
    assert.equal(verifyAdminPasscode("dhakapath2026"), false, "old default must not work");
    assert.equal(verifyAdminPasscode(""), false);
    process.env.ADMIN_PASSCODE = "unit-test-pass";
    assert.equal(verifyAdminPasscode("unit-test-pass"), true);
    assert.equal(verifyAdminPasscode("nope"), false);
    assert.equal(verifyAdminPasscode(123), false);
  } finally {
    if (saved === undefined) delete process.env.ADMIN_PASSCODE; else process.env.ADMIN_PASSCODE = saved;
  }
});

test("auth: admin cookie verifies; tampered/expired/session-token-as-admin rejected", () => {
  const c = createAdminCookie();
  assert.equal(isAdminRequest(req({ cookie: `${ADMIN_COOKIE}=${c.value}` })), true);
  const parts = c.value.split(".");
  const forged = [parts[0], String(Date.now() + 9e9), parts[2], parts[3]].join(".");
  assert.equal(isAdminRequest(req({ cookie: `${ADMIN_COOKIE}=${forged}` })), false);
  const s = resolveSession(req());
  assert.equal(isAdminRequest(req({ cookie: `${ADMIN_COOKIE}=${s.token}` })), false);
});

test("auth: rate limiter key cannot be chosen by the client (X-Forwarded-For spoof)", () => {
  const keys = new Set(Array.from({ length: 10 }, (_, i) => clientKey(req({ "x-forwarded-for": `10.0.0.${i}` }))));
  assert.equal(keys.size, 1, "each spoofed XFF value gets a fresh rate-limit bucket");
});

test("auth: forwarded IP is used only behind a trusted proxy / on Vercel", () => {
  const saved = { TRUST_PROXY: process.env.TRUST_PROXY, VERCEL: process.env.VERCEL };
  try {
    process.env.TRUST_PROXY = "1";
    assert.equal(clientKey(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
    delete process.env.TRUST_PROXY;
    process.env.VERCEL = "1";
    assert.equal(clientKey(req({ "x-vercel-forwarded-for": "198.51.100.4", "x-forwarded-for": "6.6.6.6" })), "198.51.100.4");
  } finally {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

test("rate limiter: blocks after max within window", () => {
  const k = "unit-" + Date.now();
  const res = Array.from({ length: 6 }, () => rateLimit(k, 5, 60_000).ok);
  assert.deepEqual(res, [true, true, true, true, true, false]);
});
