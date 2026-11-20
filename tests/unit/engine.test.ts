// Unit tests for the deterministic engine: fares, durations, Pareto router, ROI.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AlertStatus, CommuterQuery, HubId, IncidentType, ScenarioPreset, StreetAlert,
  TransportMode,
} from "../../src/contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../../src/contracts/canonicalGraph";
import {
  computeApprovedBusFareBdt, computeEffectiveDurationMs, computeLegCost, computeMrt6FareBdt,
} from "../../src/engine/fareEngine";
import { executeParetoSearch, clearRouteCache } from "../../src/engine/paretoRouter";
import { computeCounterfactualRoi } from "../../src/engine/shadowBaseline";
import { getScenarioParameters, projectScenario } from "../../src/engine/scenarioStore";
import { verifySubgraphTrajectory } from "../../src/features/feature-1-commute/subgraphVerifier";

const HUBS = Object.values(HubId);
const PRESETS = Object.values(ScenarioPreset);
const METRO_HUBS = [HubId.H_UTTARA, HubId.H_MIRPUR10, HubId.H_AGARGAON, HubId.H_FARMGATE, HubId.H_SHAHBAGH, HubId.H_MOTIJHEEL];

function q(origin: HubId, dest: HubId, extra: Partial<CommuterQuery> = {}): CommuterQuery {
  return {
    action_id: "t", raw_query_text: "t", origin_hub_id: origin, dest_hub_id: dest,
    is_student: false, max_budget_bdt: 0, avoid_hub_ids: [], timestamp_ms: 0, ...extra,
  };
}

// ---------------- fare engine ----------------
test("MRT-6 fare table is symmetric, positive and complete for every station pair", () => {
  for (const a of METRO_HUBS) for (const b of METRO_HUBS) {
    if (a === b) { assert.equal(computeMrt6FareBdt(a, b), 0); continue; }
    const f = computeMrt6FareBdt(a, b);
    assert.ok(f >= 20, `${a}-${b} ${f}`);
    assert.equal(f, computeMrt6FareBdt(b, a));
  }
});

test("MRT-6 fare grows monotonically with distance along the line", () => {
  for (let i = 0; i < METRO_HUBS.length; i++) for (let j = i + 2; j < METRO_HUBS.length; j++) {
    assert.ok(computeMrt6FareBdt(METRO_HUBS[i], METRO_HUBS[j]) >= computeMrt6FareBdt(METRO_HUBS[i], METRO_HUBS[j - 1]));
  }
});

test("bus fare: 10 BDT floor, 2.70/km, rejects bad distance", () => {
  assert.equal(computeApprovedBusFareBdt(0.5), 10);
  assert.equal(computeApprovedBusFareBdt(10), 27);
  for (const bad of [0, -1, NaN, Infinity]) assert.throws(() => computeApprovedBusFareBdt(bad));
});

test("every canonical edge prices to a finite, non-negative fare in every mode/student combo", () => {
  for (const e of CANONICAL_GRAPH_G0) for (const s of [true, false]) {
    const f = computeLegCost(e, s, 1.8, 2);
    assert.ok(Number.isFinite(f) && f >= 0, `${e.edge_id} -> ${f}`);
    if (e.mode === TransportMode.BUS) assert.ok(f >= 10, `${e.edge_id} under bus floor`);
  }
});

test("student half fare never below 10 and never above regular", () => {
  for (const e of CANONICAL_GRAPH_G0.filter((x) => x.mode === TransportMode.BUS)) {
    const stu = computeLegCost(e, true), reg = computeLegCost(e, false);
    assert.ok(stu >= 10 && stu <= reg, e.edge_id);
  }
});

test("rickshaw split: pool clamps to 1..4 and NaN/Infinity fall back", () => {
  const r = CANONICAL_GRAPH_G0.find((e) => e.mode === TransportMode.RICKSHAW)!;
  assert.equal(computeLegCost(r, false, 1, 99), computeLegCost(r, false, 1, 4));
  assert.equal(computeLegCost(r, false, NaN, NaN), computeLegCost(r, false, 1, 1));
  assert.equal(computeLegCost(r, false, 99, 1), computeLegCost(r, false, 3, 1));
});

test("severing alert (>=85% waterlogging) makes surface legs Infinity but not metro/walk", () => {
  const alert = { status: AlertStatus.VERIFIED_ACTIVE, incident_type: IncidentType.WATERLOGGING, confidence_pct: 90, severity_alpha: 1 } as StreetAlert;
  for (const e of CANONICAL_GRAPH_G0) {
    const d = computeEffectiveDurationMs(e, alert);
    if (e.mode === TransportMode.METRO || e.mode === TransportMode.WALK) assert.equal(d, e.base_duration_ms);
    else assert.equal(d, Infinity);
  }
  const expired = { ...alert, status: AlertStatus.EXPIRED };
  for (const e of CANONICAL_GRAPH_G0) assert.equal(computeEffectiveDurationMs(e, expired), e.base_duration_ms);
});

// ---------------- graph integrity ----------------
test("canonical graph: unique edge ids, known hubs, positive durations, distances", () => {
  const ids = new Set<string>();
  for (const e of CANONICAL_GRAPH_G0) {
    assert.ok(!ids.has(e.edge_id), `dup ${e.edge_id}`); ids.add(e.edge_id);
    assert.ok(e.origin_hub_id in CANONICAL_HUBS && e.dest_hub_id in CANONICAL_HUBS, e.edge_id);
    assert.ok(e.base_duration_ms > 0, `${e.edge_id} duration`);
    assert.ok(e.distance_km >= 0, `${e.edge_id} distance`);
  }
  const idx = Object.values(CANONICAL_HUBS).map((h) => h.index);
  assert.equal(new Set(idx).size, idx.length, "hub indexes must be unique");
  assert.ok(Math.max(...idx) < 31, "visited bitmask is a 32-bit int");
});

test("every hub has at least one outgoing and one incoming non-walk edge", () => {
  for (const h of HUBS) {
    assert.ok(CANONICAL_GRAPH_G0.some((e) => e.origin_hub_id === h && e.dest_hub_id !== h), `${h} no outgoing`);
    assert.ok(CANONICAL_GRAPH_G0.some((e) => e.dest_hub_id === h && e.origin_hub_id !== h), `${h} no incoming`);
  }
});

// ---------------- Pareto router (all 210 OD pairs x 3 presets x student) ----------------
type Fail = string;
function checkAllPairs(check: (o: HubId, d: HubId, p: ScenarioPreset, s: boolean) => Fail | null): Fail[] {
  const fails: Fail[] = [];
  for (const p of PRESETS) for (const s of [true, false]) for (const o of HUBS) for (const d of HUBS) {
    if (o === d) continue;
    const f = check(o, d, p, s);
    if (f) fails.push(f);
  }
  return fails;
}

test("router: every OD pair is reachable with unlimited budget, no alerts", () => {
  clearRouteCache();
  const fails = checkAllPairs((o, d, p, s) =>
    executeParetoSearch(q(o, d, { is_student: s }), p).routes.length === 0 ? `${o}->${d} ${p} stu=${s}` : null);
  assert.deepEqual(fails, []);
});

test("router: routes are contiguous, start/end correctly, no hub revisited, totals add up", () => {
  const fails = checkAllPairs((o, d, p, s) => {
    for (const r of executeParetoSearch(q(o, d, { is_student: s }), p).routes) {
      const L = r.legs;
      if (L[0].origin_hub_id !== o || L[L.length - 1].dest_hub_id !== d) return `${r.route_id} endpoints`;
      for (let i = 1; i < L.length; i++) if (L[i].origin_hub_id !== L[i - 1].dest_hub_id) return `${r.route_id} gap at ${i}`;
      const seen = new Set<string>([o]);
      for (const l of L) if (l.origin_hub_id !== l.dest_hub_id) {
        if (seen.has(l.dest_hub_id)) return `${r.route_id} revisits ${l.dest_hub_id}`;
        seen.add(l.dest_hub_id);
      }
      const fare = L.reduce((a, l) => a + l.effective_fare_bdt, 0);
      const dur = L.reduce((a, l) => a + l.effective_duration_ms, 0);
      if (fare !== r.total_effective_fare_bdt) return `${r.route_id} fare sum ${fare}!=${r.total_effective_fare_bdt}`;
      if (dur !== r.total_duration_ms) return `${r.route_id} dur sum`;
      if (r.total_effective_fare_bdt > r.total_regular_fare_bdt) return `${r.route_id} effective>regular`;
    }
    return null;
  });
  assert.deepEqual(fails, []);
});

test("router: consecutive metro legs are charged the single station-to-station ticket", () => {
  const fails = checkAllPairs((o, d, p, s) => {
    for (const r of executeParetoSearch(q(o, d, { is_student: s }), p).routes) {
      let i = 0;
      while (i < r.legs.length) {
        if (r.legs[i].mode !== TransportMode.METRO) { i++; continue; }
        let j = i, sum = 0;
        while (j < r.legs.length && r.legs[j].mode === TransportMode.METRO) sum += r.legs[j++].effective_fare_bdt;
        const want = computeMrt6FareBdt(r.legs[i].origin_hub_id, r.legs[j - 1].dest_hub_id);
        if (sum !== want) return `${r.route_id} metro ${sum} want ${want}`;
        i = j;
      }
    }
    return null;
  });
  assert.deepEqual(fails, []);
});

test("router: returned routes are mutually non-dominated", () => {
  const fails = checkAllPairs((o, d, p, s) => {
    const rs = executeParetoSearch(q(o, d, { is_student: s }), p).routes;
    for (const a of rs) for (const b of rs) {
      if (a === b) continue;
      const dom = a.total_duration_ms <= b.total_duration_ms && a.total_effective_fare_bdt <= b.total_effective_fare_bdt
        && a.transfers_count <= b.transfers_count
        && (a.total_duration_ms < b.total_duration_ms || a.total_effective_fare_bdt < b.total_effective_fare_bdt || a.transfers_count < b.transfers_count);
      if (dom) return `${o}->${d} ${a.route_id} dominates ${b.route_id}`;
    }
    return null;
  });
  assert.deepEqual(fails, []);
});

test("router: every returned route passes the grounding verifier", () => {
  const fails = checkAllPairs((o, d, p, s) => {
    for (const r of executeParetoSearch(q(o, d, { is_student: s }), p).routes) {
      const v = verifySubgraphTrajectory(r, s, { surgeMultiplier: getScenarioParameters(p).surge_multiplier });
      if (!v.isValid) return `${o}->${d} ${p} stu=${s}: ${v.violationClause ?? v.status}`;
    }
    return null;
  });
  assert.deepEqual(fails, []);
});

test("router: budget and avoid list are respected", () => {
  const fails: string[] = [];
  for (const o of HUBS) for (const d of HUBS) {
    if (o === d) continue;
    for (const r of executeParetoSearch(q(o, d, { max_budget_bdt: 40 }), ScenarioPreset.NORMAL_BASELINE).routes)
      if (r.total_effective_fare_bdt > 40) fails.push(`${o}->${d} over budget`);
    const avoid = HUBS.filter((h) => h !== o && h !== d).slice(0, 2);
    for (const r of executeParetoSearch(q(o, d, { avoid_hub_ids: avoid }), ScenarioPreset.NORMAL_BASELINE).routes)
      if (r.legs.some((l) => avoid.includes(l.dest_hub_id))) fails.push(`${o}->${d} visits avoided hub`);
  }
  assert.deepEqual(fails, []);
});

test("router: severed hub alerts are detoured or yield no surface route through it", () => {
  const scen = projectScenario(ScenarioPreset.PEAK_CRISIS_SURGE, 0);
  const severed = scen.active_alerts.filter((a) => a.confidence_pct >= 85 &&
    (a.incident_type === IncidentType.WATERLOGGING || a.incident_type === IncidentType.INTERSECTION_BLOCKADE));
  const fails: string[] = [];
  for (const o of HUBS) for (const d of HUBS) {
    if (o === d) continue;
    for (const r of executeParetoSearch(q(o, d), ScenarioPreset.PEAK_CRISIS_SURGE, scen.active_alerts).routes)
      for (const l of r.legs)
        if (l.mode !== TransportMode.METRO && l.mode !== TransportMode.WALK && severed.some((a) => a.hub_id === l.dest_hub_id || a.edge_id === l.edge_id))
          fails.push(`${o}->${d} uses severed ${l.edge_id}`);
  }
  assert.deepEqual(fails, []);
});

test("router is deterministic and cache does not leak between different queries", () => {
  clearRouteCache();
  const a1 = executeParetoSearch(q(HubId.H_UTTARA, HubId.H_GULISTAN), ScenarioPreset.NORMAL_BASELINE);
  const b = executeParetoSearch(q(HubId.H_UTTARA, HubId.H_GULISTAN, { is_student: true }), ScenarioPreset.NORMAL_BASELINE);
  const a2 = executeParetoSearch(q(HubId.H_UTTARA, HubId.H_GULISTAN), ScenarioPreset.NORMAL_BASELINE);
  assert.deepEqual(a1.routes, a2.routes);
  assert.ok(b.routes.length > 0);
});

// ---------------- ROI ----------------
test("ROI: all metrics finite and non-negative for every OD pair and preset", () => {
  const fails: string[] = [];
  for (const p of PRESETS) {
    const scen = projectScenario(p, 0);
    for (const o of HUBS) for (const d of HUBS) {
      if (o === d) continue;
      const query = q(o, d, { is_student: true });
      const r = executeParetoSearch(query, p, scen.active_alerts).routes[0] ?? null;
      const roi = computeCounterfactualRoi(r, query, p, scen.active_alerts);
      for (const [k, v] of Object.entries(roi)) if (!Number.isFinite(v) || v < 0) fails.push(`${p} ${o}->${d} ${k}=${v}`);
    }
  }
  assert.deepEqual(fails, []);
});

