import assert from "node:assert/strict";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";

async function get(path) {
  const response = await fetch(new URL(path, baseUrl));
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response;
}

async function post(path, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response.json();
}

async function check(label, run) {
  await run();
  console.log(`PASS ${label}`);
}

try {
  await check("Global disclosure on every page", async () => {
    for (const path of ["/", "/command-center", "/track-1-engine", "/track-2-trust-cms", "/track-3-commute", "/track-4-map-shell"]) {
      const html = await (await get(path)).text();
      assert.ok(html.includes("[SIMULATED DEMO TELEMETRY"), `${path} lacks disclosure`);
    }
  });

  await check("Track 1 official MRT fare and no student discount", async () => {
    for (const is_student of [true, false]) {
      const data = await post("/api/track-1-engine", {
        query: { origin_hub_id: "H_MIRPUR10", dest_hub_id: "H_AGARGAON", is_student, max_budget_bdt: 100, avoid_hub_ids: [] },
      });
      const metro = data.routes.flatMap((route) => route.legs).find((leg) => leg.mode === "METRO");
      assert.ok(metro, "Metro leg missing");
      assert.equal(metro.regular_fare_bdt, 20);
      assert.equal(metro.effective_fare_bdt, 20);
    }
  });

  await check("Track 1 rapid presets are idempotent and ROI stays finite", async () => {
    const request = {
      preset: "PEAK_CRISIS_SURGE",
      query: { origin_hub_id: "H_MIRPUR10", dest_hub_id: "H_MOTIJHEEL", is_student: true, max_budget_bdt: 55, avoid_hub_ids: ["H_FARMGATE"] },
    };
    const runs = await Promise.all(Array.from({ length: 5 }, () => post("/api/track-1-engine", request)));
    const fares = runs.map((data) => data.routes[0]?.total_effective_fare_bdt);
    assert.ok(fares[0] > 0, "No route returned");
    assert.ok(fares.every((fare) => fare === fares[0]), `Fares drifted: ${fares}`);
    for (const data of runs) {
      for (const value of Object.values(data.roi)) assert.ok(Number.isFinite(value), `Non-finite ROI: ${value}`);
      assert.ok(data.roi.shadow_duration_ms <= 112 * 60_000, "Shadow stall exceeds 112 minutes");
    }
  });

  await check("Track 2 fare spoofing and single-report quarantine", async () => {
    for (const submittedFareBdt of [9, 500]) {
      const data = await post("/api/track-2-trust-cms", {
        action: "VALIDATE_FARE", payload: { edgeId: "E_BUS_SURFACE_MIRPUR10_FARMGATE", submittedFareBdt },
      });
      assert.equal(data.result.status, "ANOMALOUS_FARE_REJECTED");
    }
    const data = await post("/api/track-2-trust-cms", { action: "STRESS_TEST_ANOMALY", payload: { testType: "UNCONFIRMED_REPORT" } });
    assert.equal(data.alert.status, "PENDING_CORROBORATION");
    assert.ok(data.alert.confidence_pct < 85);
  });

  await check("Track 2 90-minute vote decay", async () => {
    const now = Date.now();
    const vote = { direction: 1, reliability_weight: 0.3, timestamp_ms: now };
    const fresh = await post("/api/track-2-trust-cms", { action: "CALCULATE_BAYESIAN_DECAY", payload: { prior: 0.15, votes: [vote], nowMs: now } });
    const aged = await post("/api/track-2-trust-cms", { action: "CALCULATE_BAYESIAN_DECAY", payload: { prior: 0.15, votes: [vote], nowMs: now + 90 * 60_000 } });
    assert.ok(aged.posterior < fresh.posterior);
    assert.ok(aged.confidence_pct < 25);
  });

  await check("Track 2 pool double-click is idempotent", async () => {
    const actionId = `qa_join_${Date.now()}`;
    const sessionUserId = `qa_user_${Date.now()}`;
    const payload = { actionId, edgeId: "E_RICK_MOTIJHEEL_LASTMILE", sessionUserId, direction: "JOIN" };
    try {
      const first = await post("/api/track-2-trust-cms", { action: "JOIN_POOL", payload });
      const second = await post("/api/track-2-trust-cms", { action: "JOIN_POOL", payload });
      assert.equal(first.poolState.poolSizeCount, 3);
      assert.equal(first.poolState.perPersonFareBdt, 30);
      assert.equal(second.poolState.poolSizeCount, 3);
    } finally {
      await post("/api/track-2-trust-cms", { action: "JOIN_POOL", payload: { ...payload, actionId: `${actionId}_leave`, direction: "LEAVE" } });
    }
  });

  await check("Track 3 Banglish intent, grounding, and OCR fixtures", async () => {
    const parsed = await post("/api/track-3-commute", {
      action: "parse_intent", query: "bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?",
    });
    assert.equal(parsed.origin_hub_id, "H_MIRPUR10");
    assert.equal(parsed.dest_hub_id, "H_MOTIJHEEL");
    assert.equal(parsed.is_student, true);
    assert.equal(parsed.max_budget_bdt, 55);
    assert.ok(parsed.avoid_hub_ids.includes("H_FARMGATE"));

    const fake = await post("/api/track-3-commute", {
      action: "verify_grounding", is_student: false,
      route: { route_id: "QA_FERRY", legs: [{ edge_id: "E_FAKE_FERRY", origin_hub_id: "H_BADDA", dest_hub_id: "H_DHANMONDI", mode: "FERRY", effective_fare_bdt: 10, regular_fare_bdt: 10, effective_duration_ms: 600_000 }], total_effective_fare_bdt: 10, total_regular_fare_bdt: 10, total_duration_ms: 600_000, transfers_count: 0 },
    });
    assert.equal(fake.status, "GROUNDING_INTERCEPTED");

    for (const presetId of ["MRT6_OFFICIAL_CHART", "BIHANGA_TARIFF", "RAIDA_ENTERPRISE"]) {
      const ocr = await post("/api/track-3-commute", { action: "digitize_signboard", presetId });
      assert.ok(ocr.extractedEdges.length > 0, `${presetId} produced no grounded edges`);
      assert.equal(ocr.rejectedEdges.length, 0, `${presetId} has rejected fixture edges`);
      if (presetId === "MRT6_OFFICIAL_CHART") {
        assert.deepEqual(ocr.extractedEdges.map((edge) => edge.base_fare_bdt), [40, 20, 50]);
      }
    }
  });

  await check("Track 4 telemetry uses the current city-bus fare basis", async () => {
    const data = await (await get("/api/track-4-map-shell")).json();
    assert.equal(data.engine.vertices_expanded, 75);
    assert.equal(data.engine.city_bus_rate_bdt_per_km, 2.7);
    assert.equal(data.engine.metro_student_half_fare, false);
  });

  console.log("Final QA smoke checks passed. Browser, deployment, and recording checks remain manual.");
} catch (error) {
  console.error("FAIL", error);
  process.exitCode = 1;
}
