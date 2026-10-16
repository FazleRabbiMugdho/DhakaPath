// ==============================================================================
// src/app/api/track-2-trust-cms/route.ts
// WAVE 1 — TRACK 2: SERVER ROUTE HANDLER FOR TRUST SHIELD, CMS & RIDE-SHARE
// Safe Supabase integration with automatic in-memory fallback
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  validateFareSubmission,
  injectSpoofedFareStressTest,
  createUncorroboratedShahbaghAlert,
} from "../../../features/feature-3-trust-cms/sanityFilter";
import {
  computePosteriorConfidence,
  DEFAULT_OFF_PEAK_PRIOR,
} from "../../../features/feature-3-trust-cms/bayesianTruth";
import {
  mutateRideSharePool,
  getPoolSnapshot,
} from "../../../features/feature-3-trust-cms/rideSharePool";
import {
  StreetAlert,
  ScenarioPreset,
} from "../../../contracts/schema";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const preset = (searchParams.get("preset") as ScenarioPreset) || ScenarioPreset.PEAK_CRISIS_SURGE;
  const simOffsetMs = parseInt(searchParams.get("offset_ms") || "0", 10);

  let alerts: StreetAlert[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("street_alerts").select("*");
      if (!error && data && data.length > 0) {
        alerts = data as StreetAlert[];
      }
    } catch {
      // In-memory fallback
    }
  }

  const poolMotijheel = getPoolSnapshot("E_RICK_MOTIJHEEL_LASTMILE");
  const poolMirpur = getPoolSnapshot("E_RICK_MIRPUR10_FEEDER");

  return NextResponse.json({
    status: "ok",
    track: "Track 2: Trust Shield, Bayesian CMS & Ride-Share Pool Bot",
    timestamp_ms: Date.now() + simOffsetMs,
    preset,
    alertsCount: alerts.length,
    pools: [poolMotijheel, poolMirpur],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case "VALIDATE_FARE": {
        const { edgeId, submittedFareBdt } = payload || {};
        const result = validateFareSubmission(edgeId, Number(submittedFareBdt));
        return NextResponse.json({
          status: "ok",
          action: "VALIDATE_FARE",
          result,
        });
      }

      case "JOIN_POOL": {
        const { actionId, edgeId, sessionUserId, direction, baseFareBdt, surgeMultiplier } = payload || {};
        const poolState = mutateRideSharePool(
          actionId || `pool_${Date.now()}`,
          edgeId || "E_RICK_MOTIJHEEL_LASTMILE",
          sessionUserId || "commuter_user",
          direction || "JOIN",
          baseFareBdt,
          surgeMultiplier
        );

        return NextResponse.json({
          status: "ok",
          action: "JOIN_POOL",
          poolState,
        });
      }

      case "STRESS_TEST_ANOMALY": {
        const { testType } = payload || {};
        if (testType === "SPOOFED_FARE") {
          const result = injectSpoofedFareStressTest("E_BUS_SURFACE_MIRPUR10_FARMGATE", 500);
          return NextResponse.json({
            status: "ok",
            testType,
            result,
          });
        }

        if (testType === "UNCONFIRMED_REPORT") {
          const alert = createUncorroboratedShahbaghAlert(Date.now());
          return NextResponse.json({
            status: "ok",
            testType,
            alert,
          });
        }

        return NextResponse.json(
          { status: "error", message: `Unknown stress test type: ${testType}` },
          { status: 400 }
        );
      }

      case "CALCULATE_BAYESIAN_DECAY": {
        const { prior, votes, nowMs } = payload || {};
        const posterior = computePosteriorConfidence(
          prior ?? DEFAULT_OFF_PEAK_PRIOR,
          votes ?? [],
          nowMs ?? Date.now()
        );
        return NextResponse.json({
          status: "ok",
          action: "CALCULATE_BAYESIAN_DECAY",
          posterior,
          confidence_pct: Math.round(posterior * 1000) / 10,
        });
      }

      default:
        return NextResponse.json(
          { status: "error", message: `Unrecognized action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal error in track 2 API handler";
    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
