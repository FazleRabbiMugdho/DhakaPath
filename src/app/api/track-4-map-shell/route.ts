// ==============================================================================
// src/app/api/track-4-map-shell/route.ts — TRACK 4 TELEMETRY SNAPSHOT ENDPOINT
// Returns a deterministic, SSR-safe telemetry snapshot for the Zone 0 X-Ray pill
// and the ROI ledger benchmark. Pure canonical data — no mutation, no auth wall.
// ==============================================================================

import { NextResponse } from "next/server";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import { ScenarioPreset } from "@/contracts/schema";

export const dynamic = "force-static";

const SCENARIO_TELEMETRY: Record<
  ScenarioPreset,
  { surface_velocity_kmh: number; surge_multiplier: number; severed_hub_ids: string[] }
> = {
  [ScenarioPreset.NORMAL_BASELINE]: { surface_velocity_kmh: 14.5, surge_multiplier: 1.0, severed_hub_ids: [] },
  [ScenarioPreset.PEAK_CRISIS_SURGE]: { surface_velocity_kmh: 4.8, surge_multiplier: 1.8, severed_hub_ids: ["H_FARMGATE", "H_MALIBAGH"] },
  [ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT]: { surface_velocity_kmh: 8.5, surge_multiplier: 1.2, severed_hub_ids: ["H_SHAHBAGH"] },
};

export async function GET() {
  const vExp = Object.keys(CANONICAL_HUBS).length * 5; // 15 hubs × 5 modes (mode-expanded)
  const eExp = CANONICAL_GRAPH_G0.length;

  return NextResponse.json({
    ok: true,
    is_demo_telemetry: true,
    label: "[SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY]",
    engine: {
      recompute_latency_ms: 0.78,
      vertices_expanded: vExp,
      edges_expanded: eExp,
      generalized_cost_jstar: 0.241,
      student_floor_active_bdt: 10,
      grounding_verified: true, // V(P*) = 1
    },
    benchmark: {
      manual_fb_check_ms: 510000, // 8.5 min
      dhakapath_engine_ms: 1400, // 1.4 sec
      time_saved_ms: 3840000, // +64 min
      cost_saved_bdt: 28,
      risk_reduction_pct: 82.0,
    },
    scenarios: SCENARIO_TELEMETRY,
    generated_at_label: "canonical-static",
  });
}
