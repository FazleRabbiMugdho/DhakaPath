// ==============================================================================
// src/app/api/track-1-engine/route.ts — TRACK 1 ENGINE SERVER ENDPOINT
// WAVE 1 — TRACK 1 (Dev 1: Systems & Graph Architect)
// Sandboxed API Route Handler for Pareto Routing & Tariff Benchmarking
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CommuterQuery, ScenarioPreset, HubId } from "@/contracts/schema";
import { executeParetoSearch } from "@/engine/paretoRouter";
import { computeCounterfactualRoi } from "@/engine/shadowBaseline";
import { projectScenario } from "@/engine/scenarioStore";

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await req.json();

    const preset: ScenarioPreset = body.preset || ScenarioPreset.NORMAL_BASELINE;
    const simOffsetMs: number = Number(body.simOffsetMs) || 0;
    const poolSizes: Record<string, number> = body.poolSizes || {};

    // 1. Pure Functional Scenario Projection
    const scenario = projectScenario(preset, simOffsetMs);

    // 2. Build or Fallback Commuter Query
    const query: CommuterQuery = {
      action_id: body.query?.action_id || `API_QUERY_${Date.now()}`,
      raw_query_text: body.query?.raw_query_text || "Mirpur 10 to Motijheel",
      origin_hub_id: (body.query?.origin_hub_id as HubId) || HubId.H_MIRPUR10,
      dest_hub_id: (body.query?.dest_hub_id as HubId) || HubId.H_MOTIJHEEL,
      is_student: body.query?.is_student !== undefined ? Boolean(body.query.is_student) : true,
      max_budget_bdt: Number(body.query?.max_budget_bdt) || 55,
      avoid_hub_ids: Array.isArray(body.query?.avoid_hub_ids) ? body.query.avoid_hub_ids : [],
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

    const totalServerLatencyMs = +(performance.now() - startTime).toFixed(3);

    return NextResponse.json({
      success: true,
      server_latency_ms: totalServerLatencyMs,
      router_latency_ms: paretoResult.execution_time_ms,
      walk_bridge_active: paretoResult.walk_bridge_active,
      labels_explored: paretoResult.total_labels_explored,
      scenario,
      query,
      routes: paretoResult.routes,
      roi: roiMetrics,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal routing error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        server_latency_ms: +(performance.now() - startTime).toFixed(3),
      },
      { status: 500 }
    );
  }
}
