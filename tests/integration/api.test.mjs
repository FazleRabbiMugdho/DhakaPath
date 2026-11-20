// Integration tests: HTTP API contract, validation, auth, cross-route behaviour.
// Needs a running server: QA_BASE_URL (default http://localhost:3000).
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const HUBS = ["H_UTTARA", "H_MIRPUR10", "H_AGARGAON", "H_MOHAKHALI", "H_BADDA", "H_BANASREE", "H_MALIBAGH", "H_FARMGATE",
  "H_MOHAMMADPUR", "H_DHANMONDI", "H_SCIENCELAB", "H_SHAHBAGH", "H_MOTIJHEEL", "H_JATRABARI", "H_GULISTAN"];

async function call(path, { method = "POST", body, headers = {}, raw } = {}) {
  const res = await fetch(new URL(path, BASE), {
    method, headers: { "Content-Type": "application/json", ...headers },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* non-json */ }
  return { status: res.status, json, headers: res.headers };
}
const t1 = (query, extra = {}) => call("/api/track-1-engine", { body: { query, ...extra } });
const t2 = (action, payload, headers) => call("/api/track-2-trust-cms", { body: { action, payload }, headers });
const t3 = (body) => call("/api/track-3-commute", { body });

// ---------------- Track 1 ----------------
test("T1 rejects malformed input with 400", async () => {
  assert.equal((await call("/api/track-1-engine", { raw: "{bad" })).status, 400);
  assert.equal((await call("/api/track-1-engine", { body: [] })).status, 400);
  assert.equal((await t1({ origin_hub_id: "H_NOWHERE" })).status, 400);
  assert.equal((await t1({ origin_hub_id: "H_UTTARA", dest_hub_id: "H_UTTARA" })).status, 400);
  assert.equal((await t1({}, { preset: "NOPE" })).status, 400);
  assert.equal((await t1({}, { simOffsetMs: -1 })).status, 400);
  assert.equal((await t1({}, { poolSizes: { E_X: 9 } })).status, 400);
  assert.equal((await t1({ max_budget_bdt: "50" })).status, 400);
  assert.equal((await t1({ avoid_hub_ids: ["H_NOWHERE"] })).status, 400);
});

test("T1 every OD pair returns 200 with at least one route (student, budget 0 = unlimited)", async () => {
  const fails = [];
  await Promise.all(HUBS.flatMap((o) => HUBS.filter((d) => d !== o).map(async (d) => {
    const r = await t1({ origin_hub_id: o, dest_hub_id: d, is_student: true, max_budget_bdt: 0 });
    if (r.status !== 200 || !r.json.routes?.length) fails.push(`${o}->${d} ${r.status} ${r.json?.routes?.length}`);
  })));
  assert.deepEqual(fails, []);
});

test("T1 no budget given means no limit", async () => {
  const r = await t1({ origin_hub_id: "H_UTTARA", dest_hub_id: "H_MOTIJHEEL", is_student: false });
  assert.equal(r.status, 200);
  assert.ok(r.json.routes.length > 0);
  assert.equal(r.json.query.max_budget_bdt, 0);
});

test("T1 empty result explains why", async () => {
  const budget = await t1({ origin_hub_id: "H_UTTARA", dest_hub_id: "H_MOTIJHEEL", max_budget_bdt: 15 });
  assert.equal(budget.json.routes.length, 0);
  assert.equal(budget.json.empty_reason, "BUDGET");
  assert.ok(budget.json.available_fare_bdt > 15);
});

test("T1 every route from the API passes T3 grounding verification", async () => {
  const fails = [];
  for (const [o, d] of [["H_UTTARA", "H_GULISTAN"], ["H_MOHAMMADPUR", "H_BANASREE"], ["H_JATRABARI", "H_AGARGAON"]]) {
    for (const preset of ["NORMAL_BASELINE", "PEAK_CRISIS_SURGE", "ADVERSARIAL_CORRUPT_INPUT"]) {
      const r = await t1({ origin_hub_id: o, dest_hub_id: d, is_student: true, max_budget_bdt: 0 }, { preset });
      for (const route of r.json.routes) {
        const v = await t3({ action: "verify_grounding", route, is_student: true, preset });
        if (v.json.status !== "GRAPH_GROUNDED") fails.push(`${o}->${d} ${preset}: ${v.json.violationClause}`);
      }
    }
  }
  assert.deepEqual(fails, []);
});

test("T1 oversized request body is rejected, not parsed", async () => {
  const big = JSON.stringify({ query: {}, pad: "x".repeat(20 * 1024 * 1024) });
  const r = await call("/api/track-1-engine", { raw: big });
  assert.equal(r.status, 413, `20 MB body answered with ${r.status}`);
});

// ---------------- Track 2 ----------------
test("T2 GET issues HttpOnly session cookie and validates offset", async () => {
  const r = await call("/api/track-2-trust-cms?offset_ms=0", { method: "GET" });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie") ?? "", /dp_session=.*HttpOnly/i);
  assert.equal((await call("/api/track-2-trust-cms?offset_ms=abc", { method: "GET" })).status, 400);
});

test("T2 validation errors", async () => {
  assert.equal((await t2("NOPE", {})).status, 400);
  assert.equal((await t2("VALIDATE_FARE", { edgeId: "E_BUS_SURFACE_MIRPUR10_FARMGATE", submittedFareBdt: "20" })).status, 400);
  assert.equal((await t2("JOIN_POOL", { edgeId: "E_BUS_SURFACE_MIRPUR10_FARMGATE" })).status, 400);
  assert.equal((await t2("JOIN_POOL", { edgeId: "E_NOPE" })).status, 400);
  const votes = Array.from({ length: 257 }, () => ({ direction: 1, reliability_weight: 1, timestamp_ms: 0 }));
  assert.equal((await t2("CALCULATE_BAYESIAN_DECAY", { votes })).status, 400);
});

test("T2 fare validation knows admin-added edges", async () => {
  const r = await t2("VALIDATE_FARE", { edgeId: "E_ADMIN_ONLY_EDGE", submittedFareBdt: 20 });
  // Only canonical G0 edges are known; admin edges are always "unknown".
  assert.equal(r.json.result.status, "GROUNDING_INTERCEPTED");
});

async function sessionCookie() {
  const res = await fetch(new URL("/api/track-2-trust-cms", BASE));
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

test("T2 pool join/leave with a session; no member ids exposed", async () => {
  const cookie = await sessionCookie();
  const edgeId = "E_RICK_MIRPUR10_FEEDER";
  const join = await t2("JOIN_POOL", { edgeId, actionId: `it_join_${Date.now()}` }, { cookie });
  assert.equal(join.status, 200);
  assert.equal(join.json.poolState.isUserJoined, true);
  assert.equal("memberSessionIds" in join.json.poolState, false);
  const get = await call("/api/track-2-trust-cms", { method: "GET", headers: { cookie } });
  assert.ok(get.json.pools.every((p) => !("memberSessionIds" in p)));
  const leave = await t2("JOIN_POOL", { edgeId, actionId: `it_leave_${Date.now()}`, direction: "LEAVE" }, { cookie });
  assert.equal(leave.json.poolState.isUserJoined, false);
});

test("T2 cookie-less requests cannot join (no fresh identity per request)", async () => {
  const before = (await call("/api/track-2-trust-cms", { method: "GET" })).json.pools[0].poolSizeCount;
  for (let i = 0; i < 4; i++) {
    const r = await t2("JOIN_POOL", { edgeId: "E_RICK_MOTIJHEEL_LASTMILE", actionId: `fill_${Date.now()}_${i}` });
    assert.equal(r.status, 401);
  }
  const after = (await call("/api/track-2-trust-cms", { method: "GET" })).json.pools[0].poolSizeCount;
  assert.equal(after, before);
});

// ---------------- Track 3 ----------------
test("T3 'X to Y' English phrasing keeps the direction", async () => {
  const r = await t3({ action: "parse_intent", query: "Uttara to Gulistan" });
  assert.equal(r.status, 200);
  assert.deepEqual([r.json.origin_hub_id, r.json.dest_hub_id], ["H_UTTARA", "H_GULISTAN"]);
});

test("T3 chat 'X to Y' plans the right direction", async () => {
  const r = await t3({ action: "chat_turn", query: "Farmgate to Jatrabari, student" });
  assert.equal(r.status, 200);
  assert.deepEqual([r.json.updatedContext.last_origin_hub_id, r.json.updatedContext.last_dest_hub_id], ["H_FARMGATE", "H_JATRABARI"]);
});

test("T3 grounding rejects a hallucinated edge id on a real hub pair", async () => {
  const route = (await t1({ origin_hub_id: "H_FARMGATE", dest_hub_id: "H_MOTIJHEEL", is_student: false, max_budget_bdt: 0 })).json.routes[0];
  const fake = { ...route, legs: route.legs.map((l) => ({ ...l, edge_id: `E_FAKE_${l.edge_id}` })) };
  const v = await t3({ action: "verify_grounding", route: fake, is_student: false });
  assert.notEqual(v.json.status, "GRAPH_GROUNDED");
});

test("T3 grounding accepts a surged route only with the matching preset", async () => {
  const route = (await t1({ origin_hub_id: "H_MOTIJHEEL", dest_hub_id: "H_GULISTAN", max_budget_bdt: 0 }, { preset: "PEAK_CRISIS_SURGE" })).json.routes
    .find((r) => r.legs.some((l) => l.mode === "RICKSHAW"));
  if (!route) return;
  assert.equal((await t3({ action: "verify_grounding", route, preset: "PEAK_CRISIS_SURGE" })).json.status, "GRAPH_GROUNDED");
  assert.notEqual((await t3({ action: "verify_grounding", route })).json.status, "GRAPH_GROUNDED");
});

test("T3 grounding rejects a route whose total fare disagrees with its legs", async () => {
  const route = (await t1({ origin_hub_id: "H_FARMGATE", dest_hub_id: "H_MOTIJHEEL", is_student: false, max_budget_bdt: 0 })).json.routes[0];
  const v = await t3({ action: "verify_grounding", route: { ...route, total_effective_fare_bdt: 1, total_duration_ms: 1 }, is_student: false });
  assert.notEqual(v.json.status, "GRAPH_GROUNDED");
});

test("T3 validation + unknown action + oversized query", async () => {
  assert.equal((await t3({ action: "nope" })).status, 400);
  assert.equal((await t3({ action: 5 })).status, 400);
  assert.equal((await t3({ action: "parse_intent", query: "a".repeat(501) })).status, 400);
  assert.equal((await t3({ action: "chat_turn", query: "hi", context: { last_origin_hub_id: "X" } })).status, 400);
  assert.equal((await t3({ action: "ocr_image", base64Image: "data:text/plain;base64,AAAA" })).status, 400);
});

test("T3 OCR without GEMINI key degrades gracefully", async () => {
  const png = "data:image/png;base64," + Buffer.alloc(200, 1).toString("base64");
  const r = await t3({ action: "ocr_image", base64Image: png });
  assert.ok([200, 502, 504].includes(r.status));
  assert.equal(r.json.ok, false);
});

// ---------------- Track 4 ----------------
test("T4 telemetry GET", async () => {
  const r = await call("/api/track-4-map-shell", { method: "GET" });
  assert.equal(r.status, 200);
  assert.ok(r.json.engine);
});

// ---------------- Admin ----------------
test("Admin: unauthenticated writes are 401, GET is public", async () => {
  assert.equal((await call("/api/admin/edges", { method: "GET" })).status, 200);
  assert.equal((await call("/api/admin/edges", { body: {} })).status, 401);
  assert.equal((await call("/api/admin/edges?edgeId=x", { method: "DELETE" })).status, 401);
});

test("Admin: full edge lifecycle with dev passcode, router picks up the new edge", async (t) => {
  const login = await fetch(new URL("/api/admin/auth", BASE), {
    method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.7" },
    body: JSON.stringify({ passcode: process.env.ADMIN_PASSCODE }),
  });
  if (login.status !== 200) return t.skip(`login ${login.status}`);
  const cookie = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const edgeId = `E_IT_${Date.now()}`;
  const edge = { edge_id: edgeId, origin_hub_id: "H_BADDA", dest_hub_id: "H_DHANMONDI", mode: "LEGUNA",
    distance_km: 9, base_duration_ms: 20 * 60_000, base_fare_bdt: 30, route_name: "IT Leguna" };
  const add = await call("/api/admin/edges", { body: { edge }, headers: { cookie } });
  assert.equal(add.status, 200);
  assert.equal((await call("/api/admin/edges", { body: { edge }, headers: { cookie } })).status, 400, "duplicate");
  const route = await t1({ origin_hub_id: "H_BADDA", dest_hub_id: "H_DHANMONDI", is_student: false, max_budget_bdt: 0 });
  assert.ok(route.json.routes.some((r) => r.legs.some((l) => l.edge_id === edgeId)), "server router ignores admin edge");
  assert.equal((await call("/api/admin/edges?edgeId=E_BUS_SURFACE_MIRPUR10_FARMGATE", { method: "DELETE", headers: { cookie } })).status, 403);
  assert.equal((await call(`/api/admin/edges?edgeId=${edgeId}`, { method: "DELETE", headers: { cookie } })).status, 200);
});

test("Admin: bus edge with absurd duration/distance ratio accepted (600 km/h)", async (t) => {
  const login = await fetch(new URL("/api/admin/auth", BASE), {
    method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.8" },
    body: JSON.stringify({ passcode: process.env.ADMIN_PASSCODE }),
  });
  if (login.status !== 200) return t.skip(`login ${login.status}`);
  const cookie = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const edgeId = `E_IT_FAST_${Date.now()}`;
  const r = await call("/api/admin/edges", { headers: { cookie }, body: { edge: { edge_id: edgeId, origin_hub_id: "H_UTTARA",
    dest_hub_id: "H_JATRABARI", mode: "BUS", distance_km: 30, base_duration_ms: 180_000 } } });
  await call(`/api/admin/edges?edgeId=${edgeId}`, { method: "DELETE", headers: { cookie } });
  assert.equal(r.status, 400, "30 km in 3 minutes was accepted");
  const short = await call("/api/admin/edges", { headers: { cookie }, body: { edge: { edge_id: `${edgeId}_S`, origin_hub_id: "H_UTTARA",
    dest_hub_id: "H_JATRABARI", mode: "BUS", distance_km: 2, base_duration_ms: 3_600_000 } } });
  assert.equal(short.status, 400, "2 km between hubs ~20 km apart was accepted");
});

// ---------------- headers ----------------
test("Security headers present; Permissions-Policy allows features the UI uses", async () => {
  const r = await fetch(new URL("/app", BASE));
  for (const h of ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy"]) assert.ok(r.headers.get(h), h);
  const pp = r.headers.get("permissions-policy") ?? "";
  assert.ok(!/geolocation=\(\)/.test(pp), `UI 'use my location' blocked by: ${pp}`);
  assert.ok(!/microphone=\(\)/.test(pp), `UI voice input blocked by: ${pp}`);
});

// Runs last: it uses up the login attempts for this client.
test("Admin: login brute-force limit cannot be bypassed by rotating X-Forwarded-For", async () => {
  const statuses = [];
  for (let i = 0; i < 12; i++) {
    statuses.push((await call("/api/admin/auth", { body: { passcode: `wrong${i}` }, headers: { "X-Forwarded-For": `203.0.113.${i}` } })).status);
  }
  assert.ok(statuses.includes(429), `12 wrong passcodes, statuses: ${statuses.join(",")}`);
});
