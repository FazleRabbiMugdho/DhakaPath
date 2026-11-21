// ==============================================================================
// src/app/api/admin/edges/route.ts — server-persisted graph extensions
// Stored in Supabase `transit_edges` when a service key is set (src/lib/edgeStore.ts).
// GET is public (all clients see committed links). POST/DELETE require the
// HttpOnly admin session cookie.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import {
  HubId,
  TransitEdge,
  TransportMode,
} from "../../../../contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../../../../contracts/canonicalGraph";
import { getExtraEdges } from "../../../../engine/graphExtensions";
import { addExtraEdge, refreshExtraEdges, removeExtraEdge } from "../../../../lib/edgeStore";
import { computeApprovedBusFareBdt, computeMrt6FareBdt } from "../../../../engine/fareEngine";
import { attachSessionCookie, isAdminRequest, resolveSession } from "../../../../lib/serverAuth";
import { haversineKm } from "../../../../data/dhakaRoadNetwork";

export const dynamic = "force-dynamic";

const MAX_EXTRA_EDGES = 500;
// Upper bounds on average speed per mode (MRT-6 design speed is 100 km/h).
const MAX_SPEED_KMH: Record<TransportMode, number> = {
  [TransportMode.WALK]: 7,
  [TransportMode.RICKSHAW]: 20,
  [TransportMode.LEGUNA]: 40,
  [TransportMode.BUS]: 60,
  [TransportMode.METRO]: 100,
};
// Road distance can't be much shorter than the straight line between hubs.
const MIN_DISTANCE_RATIO = 0.8;
const CANONICAL_IDS = new Set(CANONICAL_GRAPH_G0.map((edge) => edge.edge_id));

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateAndNormalizeEdge(raw: unknown): { edge?: TransitEdge; error?: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "Invalid edge payload" };
  }
  const input = raw as Record<string, unknown>;

  if (typeof input.edge_id !== "string" || !input.edge_id.trim() || input.edge_id.length > 120) {
    return { error: "Invalid edge_id" };
  }
  const edgeId = input.edge_id.trim();
  if (CANONICAL_IDS.has(edgeId) || getExtraEdges().some((edge) => edge.edge_id === edgeId)) {
    return { error: "Duplicate edge_id" };
  }

  const origin = input.origin_hub_id as HubId;
  const dest = input.dest_hub_id as HubId;
  if (!origin || !(origin in CANONICAL_HUBS)) return { error: "Unknown origin hub" };
  if (!dest || !(dest in CANONICAL_HUBS)) return { error: "Unknown destination hub" };

  const mode = input.mode as TransportMode;
  if (!Object.values(TransportMode).includes(mode)) return { error: "Unsupported mode" };
  if (origin === dest && mode !== TransportMode.WALK) {
    return { error: "Origin and destination must differ" };
  }

  const routeName =
    typeof input.route_name === "string" && input.route_name.trim()
      ? input.route_name.trim().slice(0, 120)
      : "Admin link";
  const distanceKm = input.distance_km;
  if (!isFiniteNumber(distanceKm) || distanceKm <= 0 || distanceKm > 100) {
    return { error: "distance_km must be between 0 and 100" };
  }
  const durationMs = input.base_duration_ms;
  if (!isFiniteNumber(durationMs) || durationMs <= 0 || durationMs > 24 * 60 * 60 * 1000) {
    return { error: "base_duration_ms must be positive and under 24 hours" };
  }
  // Physical plausibility: the router prefers fast links, so an impossible one
  // (e.g. a 600 km/h bus) would hijack every route.
  if (origin !== dest) {
    const straightKm = haversineKm([CANONICAL_HUBS[origin].lat, CANONICAL_HUBS[origin].lng], [CANONICAL_HUBS[dest].lat, CANONICAL_HUBS[dest].lng]);
    if (distanceKm < MIN_DISTANCE_RATIO * straightKm) {
      return { error: `distance_km must be at least ${(MIN_DISTANCE_RATIO * straightKm).toFixed(1)} km (straight-line distance between the hubs is ${straightKm.toFixed(1)} km)` };
    }
  }
  const speedKmh = distanceKm / (durationMs / 3_600_000);
  if (speedKmh > MAX_SPEED_KMH[mode]) {
    return { error: `Implied speed ${speedKmh.toFixed(0)} km/h exceeds the ${MAX_SPEED_KMH[mode]} km/h limit for ${mode}` };
  }
  const landmark =
    typeof input.boarding_landmark === "string"
      ? input.boarding_landmark.trim().slice(0, 160)
      : "";
  const studentHalfFareEligible =
    input.student_half_fare_eligible === true && mode === TransportMode.BUS;

  let baseFare: number;
  if (mode === TransportMode.BUS) {
    baseFare = computeApprovedBusFareBdt(distanceKm);
  } else if (mode === TransportMode.METRO) {
    try {
      baseFare = computeMrt6FareBdt(origin, dest);
    } catch {
      return { error: "No official MRT-6 fare exists for this station pair" };
    }
  } else if (mode === TransportMode.WALK) {
    baseFare = 0;
  } else {
    const submittedFare = input.base_fare_bdt;
    if (!isFiniteNumber(submittedFare) || submittedFare < 10 || submittedFare > 300) {
      return { error: "Leguna/rickshaw fare must be between 10 and 300 BDT" };
    }
    baseFare = Math.round(submittedFare);
  }

  return {
    edge: {
      edge_id: edgeId,
      origin_hub_id: origin,
      dest_hub_id: dest,
      mode,
      route_name: routeName,
      distance_km: distanceKm,
      base_fare_bdt: baseFare,
      base_duration_ms: Math.round(durationMs),
      student_half_fare_eligible: studentHalfFareEligible,
      boarding_landmark: landmark || `${CANONICAL_HUBS[origin].name_en} stop`,
    },
  };
}

// The app loads this on start, so it also issues the anonymous session cookie
// that keys rate limits and owns synced rows (see serverAuth.clientKey).
export async function GET(req: NextRequest) {
  await refreshExtraEdges();
  return attachSessionCookie(noStore(NextResponse.json({ ok: true, edges: getExtraEdges() })), resolveSession(req));
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return noStore(NextResponse.json({ ok: false, error: "Admin authentication required" }, { status: 401 }));
  }

  await refreshExtraEdges();
  if (getExtraEdges().length >= MAX_EXTRA_EDGES) {
    return noStore(NextResponse.json({ ok: false, error: "Extension graph is full" }, { status: 409 }));
  }

  const parsed = await readJsonBody(req, 8 * 1024);
  if (!parsed.ok) {
    return noStore(NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status }));
  }
  const body = parsed.body;

  const rawEdge = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { edge?: unknown }).edge ?? body
    : null;
  const result = validateAndNormalizeEdge(rawEdge);
  if (!result.edge) {
    return noStore(NextResponse.json({ ok: false, error: result.error ?? "Invalid edge" }, { status: 400 }));
  }

  const saved = await addExtraEdge(result.edge);
  if (saved === "duplicate") {
    return noStore(NextResponse.json({ ok: false, error: "Duplicate edge_id" }, { status: 400 }));
  }
  if (saved === "failed") {
    return noStore(NextResponse.json({ ok: false, error: "Could not save the link; try again" }, { status: 502 }));
  }
  return noStore(NextResponse.json({ ok: true, edge: result.edge, edges: getExtraEdges() }));
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return noStore(NextResponse.json({ ok: false, error: "Admin authentication required" }, { status: 401 }));
  }

  const url = new URL(req.url);
  let edgeId = url.searchParams.get("edgeId") ?? "";

  if (!edgeId) {
    const parsed = await readJsonBody(req, 4 * 1024);
    const body = parsed.ok ? parsed.body : null;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const candidate = (body as { edgeId?: unknown }).edgeId;
      if (typeof candidate === "string") edgeId = candidate;
    }
  }

  if (!edgeId.trim()) {
    return noStore(NextResponse.json({ ok: false, error: "edgeId is required" }, { status: 400 }));
  }
  if (CANONICAL_IDS.has(edgeId)) {
    return noStore(NextResponse.json({ ok: false, error: "Canonical graph edges cannot be deleted" }, { status: 403 }));
  }

  await refreshExtraEdges();
  if (!getExtraEdges().some((edge) => edge.edge_id === edgeId)) {
    return noStore(NextResponse.json({ ok: false, error: "Edge not found" }, { status: 404 }));
  }
  if ((await removeExtraEdge(edgeId)) === "failed") {
    return noStore(NextResponse.json({ ok: false, error: "Could not delete the link; try again" }, { status: 502 }));
  }
  return noStore(NextResponse.json({ ok: true, edges: getExtraEdges() }));
}
