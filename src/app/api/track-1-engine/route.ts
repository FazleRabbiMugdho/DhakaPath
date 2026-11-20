// ==============================================================================
// src/app/api/track-1-engine/route.ts — TRACK 1 ENGINE SERVER ENDPOINT
// WAVE 1 — TRACK 1 (Dev 1: Systems & Graph Architect)
// Sandboxed API Route Handler for Pareto Routing & Tariff Benchmarking
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { CommuterQuery, DEFAULT_BUDGET_BDT, ScenarioPreset, HubId } from "@/contracts/schema";
import { diagnoseEmptyResult, executeParetoSearch } from "@/engine/paretoRouter";
import { computeCounterfactualRoi } from "@/engine/shadowBaseline";
import { projectScenario } from "@/engine/scenarioStore";

export const dynamic = "force-dynamic";

const MAX_OFFSET_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BUDGET_BDT = 10000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hubSet(): Set<string> {
  return new Set(Object.values(HubId));
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return noStore(NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status }));
  }
  const body = parsed.body;

  if (!isRecord(body)) {
    return noStore(NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 }));
  }

  const presetRaw = body.preset ?? ScenarioPreset.NORMAL_BASELINE;
  const preset = presetRaw as ScenarioPreset;
  const simOffsetRaw = body.simOffsetMs ?? 0;
  const poolSizesRaw = body.poolSizes ?? {};
  const inputRaw = body.query ?? {};

  if (
    !Object.values(ScenarioPreset).includes(preset) ||
    typeof simOffsetRaw !== "number" ||
    !Number.isFinite(simOffsetRaw) ||
    simOffsetRaw < 0 ||
    simOffsetRaw > MAX_OFFSET_MS
  ) {
    return noStore(
      NextResponse.json({ success: false, error: "Invalid scenario parameters" }, { status: 400 })
    );
  }
  const simOffsetMs = Math.floor(simOffsetRaw);

  if (!isRecord(poolSizesRaw)) {
    return noStore(
      NextResponse.json({ success: false, error: "Invalid poolSizes object" }, { status: 400 })
    );
  }
  const poolEntries = Object.entries(poolSizesRaw);
  if (poolEntries.length > 200) {
    return noStore(
      NextResponse.json({ success: false, error: "Too many pool entries" }, { status: 400 })
    );
  }
  const poolSizes: Record<string, number> = {};
  for (const [edgeId, size] of poolEntries) {
    if (
      !edgeId ||
      edgeId.length > 120 ||
      typeof size !== "number" ||
      !Number.isFinite(size) ||
      size < 1 ||
      size > 4
    ) {
      return noStore(
        NextResponse.json({ success: false, error: "Invalid poolSizes entry" }, { status: 400 })
      );
    }
    poolSizes[edgeId] = Math.floor(size);
  }

  if (!isRecord(inputRaw)) {
    return noStore(NextResponse.json({ success: false, error: "Invalid query object" }, { status: 400 }));
  }
  const input = inputRaw;
  const hubs = hubSet();

  if (input.origin_hub_id !== undefined && !hubs.has(input.origin_hub_id as string)) {
    return noStore(NextResponse.json({ success: false, error: "Invalid origin hub" }, { status: 400 }));
  }
  if (input.dest_hub_id !== undefined && !hubs.has(input.dest_hub_id as string)) {
    return noStore(NextResponse.json({ success: false, error: "Invalid destination hub" }, { status: 400 }));
  }
  if (input.is_student !== undefined && typeof input.is_student !== "boolean") {
    return noStore(NextResponse.json({ success: false, error: "Invalid student flag" }, { status: 400 }));
  }
  if (
    input.max_budget_bdt !== undefined &&
    (typeof input.max_budget_bdt !== "number" ||
      !Number.isFinite(input.max_budget_bdt) ||
      input.max_budget_bdt < 0 ||
      input.max_budget_bdt > MAX_BUDGET_BDT)
  ) {
    return noStore(NextResponse.json({ success: false, error: "Invalid budget" }, { status: 400 }));
  }
  if (input.raw_query_text !== undefined && (typeof input.raw_query_text !== "string" || input.raw_query_text.length > 500)) {
    return noStore(NextResponse.json({ success: false, error: "Invalid raw query" }, { status: 400 }));
  }
  if (input.action_id !== undefined && (typeof input.action_id !== "string" || input.action_id.length > 160)) {
    return noStore(NextResponse.json({ success: false, error: "Invalid action id" }, { status: 400 }));
  }
  if (input.avoid_hub_ids !== undefined) {
    if (!Array.isArray(input.avoid_hub_ids) || input.avoid_hub_ids.length > 30) {
      return noStore(NextResponse.json({ success: false, error: "Invalid avoid list" }, { status: 400 }));
    }
    if (!input.avoid_hub_ids.every((hub) => typeof hub === "string" && hubs.has(hub))) {
      return noStore(NextResponse.json({ success: false, error: "Invalid avoid hub" }, { status: 400 }));
    }
  }

  const origin = (input.origin_hub_id as HubId | undefined) ?? HubId.H_MIRPUR10;
  const dest = (input.dest_hub_id as HubId | undefined) ?? HubId.H_MOTIJHEEL;
  if (origin === dest) {
    return noStore(
      NextResponse.json({ success: false, error: "Origin and destination must differ" }, { status: 400 })
    );
  }

  const avoidHubIds = Array.from(
    new Set(((input.avoid_hub_ids as HubId[] | undefined) ?? []).filter((hub) => hub !== origin && hub !== dest))
  );

  try {
    // 1. Pure Functional Scenario Projection
    const scenario = projectScenario(preset, simOffsetMs);

    // 2. Build Commuter Query from validated fields only.
    const query: CommuterQuery = {
      action_id:
        typeof input.action_id === "string" && input.action_id.trim()
          ? input.action_id.trim()
          : `API_QUERY_${Date.now()}`,
      raw_query_text:
        typeof input.raw_query_text === "string"
          ? input.raw_query_text.slice(0, 500)
          : "Mirpur 10 to Motijheel",
      origin_hub_id: origin,
      dest_hub_id: dest,
      is_student: (input.is_student as boolean | undefined) ?? true,
      max_budget_bdt: (input.max_budget_bdt as number | undefined) ?? DEFAULT_BUDGET_BDT,
      avoid_hub_ids: avoidHubIds,
      timestamp_ms: Date.now(),
    };

    // 3. Multi-Criteria Pareto Search Execution
    const paretoResult = executeParetoSearch(
      query,
      preset,
      scenario.active_alerts,
      poolSizes
    );

    // 4. Counterfactual Shadow ROI Computation
    const optimalRoute = paretoResult.routes[0] || null;
    const roiMetrics = computeCounterfactualRoi(
      optimalRoute,
      query,
      preset,
      scenario.active_alerts
    );

    // An empty result says why, so clients can tell "over budget" from "cut off".
    const emptyDiagnosis = paretoResult.routes.length === 0
      ? diagnoseEmptyResult(query, preset, scenario.active_alerts, poolSizes)
      : null;

    const totalServerLatencyMs = +(performance.now() - startTime).toFixed(3);

    return noStore(
      NextResponse.json({
        success: true,
        server_latency_ms: totalServerLatencyMs,
        router_latency_ms: paretoResult.execution_time_ms,
        walk_bridge_active: paretoResult.walk_bridge_active,
        labels_explored: paretoResult.total_labels_explored,
        scenario,
        query,
        routes: paretoResult.routes,
        ...(emptyDiagnosis ? { empty_reason: emptyDiagnosis.reason, available_fare_bdt: emptyDiagnosis.available_fare_bdt } : {}),
        roi: roiMetrics,
      })
    );
  } catch (error: unknown) {
    console.error("track-1-engine failed", error);
    return noStore(
      NextResponse.json(
        {
          success: false,
          error: "Internal routing error",
          server_latency_ms: +(performance.now() - startTime).toFixed(3),
        },
        { status: 500 }
      )
    );
  }
}
