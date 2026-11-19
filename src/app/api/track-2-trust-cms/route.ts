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
  CrowdVote,
  ScenarioPreset,
  StreetAlert,
  TransportMode,
} from "../../../contracts/schema";
import { CANONICAL_GRAPH_G0 } from "../../../contracts/canonicalGraph";
import { getExtraEdges } from "../../../engine/graphExtensions";
import { getScenarioParameters } from "../../../engine/scenarioStore";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { attachSessionCookie, resolveSession } from "../../../lib/serverAuth";

export const dynamic = "force-dynamic";

const MAX_OFFSET_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_VOTES = 256;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function validPreset(value: unknown): ScenarioPreset | null {
  return Object.values(ScenarioPreset).includes(value as ScenarioPreset)
    ? (value as ScenarioPreset)
    : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const preset = validPreset(searchParams.get("preset")) ?? ScenarioPreset.PEAK_CRISIS_SURGE;
  const offsetRaw = searchParams.get("offset_ms") ?? "0";
  const simOffsetMs = Number(offsetRaw);

  if (
    !Number.isFinite(simOffsetMs) ||
    !Number.isInteger(simOffsetMs) ||
    simOffsetMs < 0 ||
    simOffsetMs > MAX_OFFSET_MS
  ) {
    return noStore(
      NextResponse.json({ status: "error", message: "Invalid offset_ms" }, { status: 400 })
    );
  }

  const session = resolveSession(req);

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

  const poolMotijheel = getPoolSnapshot("E_RICK_MOTIJHEEL_LASTMILE", session.sessionId);
  const poolMirpur = getPoolSnapshot("E_RICK_MIRPUR10_FEEDER", session.sessionId);

  const response = noStore(
    NextResponse.json({
      status: "ok",
      track: "Track 2: Trust Shield, Bayesian CMS & Ride-Share Pool Bot",
      timestamp_ms: Date.now() + simOffsetMs,
      preset,
      alertsCount: alerts.length,
      pools: [poolMotijheel, poolMirpur],
    })
  );
  return attachSessionCookie(response, session);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return noStore(NextResponse.json({ status: "error", message: "Invalid JSON body" }, { status: 400 }));
  }

  if (!isRecord(body)) {
    return noStore(NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 }));
  }

  const action = body.action;
  if (typeof action !== "string" || !action) {
    return noStore(NextResponse.json({ status: "error", message: "Missing action" }, { status: 400 }));
  }

  const payloadRaw = body.payload ?? {};
  if (!isRecord(payloadRaw)) {
    return noStore(NextResponse.json({ status: "error", message: "Invalid payload" }, { status: 400 }));
  }
  const payload = payloadRaw;

  try {
    switch (action) {
      case "VALIDATE_FARE": {
        if (
          typeof payload.edgeId !== "string" ||
          !payload.edgeId ||
          payload.edgeId.length > 120 ||
          typeof payload.submittedFareBdt !== "number" ||
          !Number.isFinite(payload.submittedFareBdt) ||
          payload.submittedFareBdt < 0 ||
          payload.submittedFareBdt > 1_000_000
        ) {
          return noStore(
            NextResponse.json({ status: "error", message: "Invalid fare payload" }, { status: 400 })
          );
        }
        const result = validateFareSubmission(payload.edgeId, payload.submittedFareBdt);
        return noStore(
          NextResponse.json({
            status: "ok",
            action: "VALIDATE_FARE",
            result,
          })
        );
      }

      case "JOIN_POOL": {
        const session = resolveSession(req);
        const actionId =
          typeof payload.actionId === "string" && payload.actionId.trim()
            ? payload.actionId.trim()
            : `pool_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        if (actionId.length > 160) {
          return noStore(
            NextResponse.json({ status: "error", message: "Invalid actionId" }, { status: 400 })
          );
        }
        if (typeof payload.edgeId !== "string" || !payload.edgeId) {
          return noStore(
            NextResponse.json({ status: "error", message: "edgeId is required" }, { status: 400 })
          );
        }
        if (payload.direction !== undefined && payload.direction !== "JOIN" && payload.direction !== "LEAVE") {
          return noStore(
            NextResponse.json({ status: "error", message: "direction must be JOIN or LEAVE" }, { status: 400 })
          );
        }
        const direction = (payload.direction as "JOIN" | "LEAVE" | undefined) ?? "JOIN";
        const preset = validPreset(payload.preset) ?? ScenarioPreset.NORMAL_BASELINE;

        const edge = [...CANONICAL_GRAPH_G0, ...getExtraEdges()].find(
          (candidate) => candidate.edge_id === payload.edgeId
        );
        if (!edge) {
          return noStore(
            NextResponse.json({ status: "error", message: "Unknown pool edge" }, { status: 400 })
          );
        }
        if (edge.mode !== TransportMode.RICKSHAW && edge.mode !== TransportMode.LEGUNA) {
          return noStore(
            NextResponse.json(
              { status: "error", message: "Ride-share pools are only valid on rickshaw/leguna connector edges" },
              { status: 400 }
            )
          );
        }

        const poolState = mutateRideSharePool(
          actionId,
          edge.edge_id,
          session.sessionId,
          direction,
          edge.base_fare_bdt,
          getScenarioParameters(preset).surge_multiplier,
          edge.origin_hub_id
        );

        const response = noStore(
          NextResponse.json({
            status: "ok",
            action: "JOIN_POOL",
            poolState,
          })
        );
        return attachSessionCookie(response, session);
      }

      case "STRESS_TEST_ANOMALY": {
        const testType = payload.testType;
        if (testType === "SPOOFED_FARE") {
          const result = injectSpoofedFareStressTest("E_BUS_SURFACE_MIRPUR10_FARMGATE", 500);
          return noStore(
            NextResponse.json({
              status: "ok",
              testType,
              result,
            })
          );
        }

        if (testType === "UNCONFIRMED_REPORT") {
          const alert = createUncorroboratedShahbaghAlert(Date.now());
          return noStore(
            NextResponse.json({
              status: "ok",
              testType,
              alert,
            })
          );
        }

        return noStore(
          NextResponse.json(
            { status: "error", message: "Unknown stress test type" },
            { status: 400 }
          )
        );
      }

      case "CALCULATE_BAYESIAN_DECAY": {
        const prior = payload.prior ?? DEFAULT_OFF_PEAK_PRIOR;
        const nowMs = payload.nowMs ?? Date.now();
        const votesRaw = payload.votes ?? [];

        if (
          typeof prior !== "number" ||
          !Number.isFinite(prior) ||
          prior < 0 ||
          prior > 1 ||
          typeof nowMs !== "number" ||
          !Number.isFinite(nowMs) ||
          nowMs < 0 ||
          !Array.isArray(votesRaw) ||
          votesRaw.length > MAX_VOTES
        ) {
          return noStore(
            NextResponse.json({ status: "error", message: "Invalid Bayesian payload" }, { status: 400 })
          );
        }

        const votes: CrowdVote[] = [];
        for (const rawVote of votesRaw) {
          if (
            !isRecord(rawVote) ||
            (rawVote.direction !== 1 && rawVote.direction !== -1) ||
            typeof rawVote.reliability_weight !== "number" ||
            !Number.isFinite(rawVote.reliability_weight) ||
            rawVote.reliability_weight < 0 ||
            rawVote.reliability_weight > 1 ||
            typeof rawVote.timestamp_ms !== "number" ||
            !Number.isFinite(rawVote.timestamp_ms)
          ) {
            return noStore(
              NextResponse.json({ status: "error", message: "Invalid vote payload" }, { status: 400 })
            );
          }
          votes.push({
            vote_id: typeof rawVote.vote_id === "string" ? rawVote.vote_id.slice(0, 120) : `vote_${votes.length}`,
            voter_session_id: "api_session",
            direction: rawVote.direction,
            reliability_weight: rawVote.reliability_weight,
            timestamp_ms: rawVote.timestamp_ms,
          });
        }

        const posterior = computePosteriorConfidence(prior, votes, nowMs);
        return noStore(
          NextResponse.json({
            status: "ok",
            action: "CALCULATE_BAYESIAN_DECAY",
            posterior,
            confidence_pct: Math.round(posterior * 1000) / 10,
          })
        );
      }

      default:
        return noStore(
          NextResponse.json({ status: "error", message: "Unrecognized action" }, { status: 400 })
        );
    }
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return noStore(
        NextResponse.json({ status: "error", message: error.message }, { status: 400 })
      );
    }
    console.error("track-2-trust-cms failed", error);
    return noStore(
      NextResponse.json(
        { status: "error", message: "Internal error in track 2 API handler" },
        { status: 500 }
      )
    );
  }
}
