// ==============================================================================
// src/lib/edgeStore.ts — admin-added links shared across server instances
// graphExtensions.ts keeps the router's in-memory copy. With a Supabase service
// key, admin writes also go to `transit_edges` and every instance reloads that
// table (at most every REFRESH_MS), so all instances route on the same graph
// and links survive restarts. Without a key, links stay in this process only.
// Server-only: uses the service-role client.
// ==============================================================================

import { HubId, TransitEdge, TransportMode } from "../contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../contracts/canonicalGraph";
import { getExtraEdges, setExtraEdges } from "../engine/graphExtensions";
import { getSupabaseServiceClient, SUPABASE_TIMEOUT_MS } from "./supabaseServer";

const REFRESH_MS = 5_000;
const CANONICAL_IDS = new Set(CANONICAL_GRAPH_G0.map((edge) => edge.edge_id));
const MODES = new Set<string>(Object.values(TransportMode));

let loadedAt = 0;
let inflight: Promise<void> | null = null;
// Bumped by every local write; a reload that started before a write is discarded.
let writes = 0;

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Maps a `transit_edges` row to an edge, or null when the row is unusable. */
export function edgeFromRow(row: unknown): TransitEdge | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (
    typeof r.edge_id !== "string" || !r.edge_id || CANONICAL_IDS.has(r.edge_id) ||
    typeof r.origin_hub_id !== "string" || !(r.origin_hub_id in CANONICAL_HUBS) ||
    typeof r.dest_hub_id !== "string" || !(r.dest_hub_id in CANONICAL_HUBS) ||
    typeof r.mode !== "string" || !MODES.has(r.mode) ||
    !finite(r.distance_km) || r.distance_km <= 0 ||
    !finite(r.base_fare_bdt) || r.base_fare_bdt < 0 ||
    !finite(r.base_duration_ms) || r.base_duration_ms <= 0
  ) return null;
  return {
    edge_id: r.edge_id,
    origin_hub_id: r.origin_hub_id as HubId,
    dest_hub_id: r.dest_hub_id as HubId,
    mode: r.mode as TransportMode,
    route_name: typeof r.route_name === "string" ? r.route_name : "Admin link",
    distance_km: r.distance_km,
    base_fare_bdt: r.base_fare_bdt,
    base_duration_ms: r.base_duration_ms,
    student_half_fare_eligible: r.student_half_fare_eligible === true,
    boarding_landmark: typeof r.boarding_landmark === "string" ? r.boarding_landmark : "",
  };
}

/** Reloads admin links from Supabase when the copy is stale. Keeps the last copy on failure. */
export async function refreshExtraEdges(): Promise<void> {
  const client = getSupabaseServiceClient();
  if (!client || Date.now() - loadedAt < REFRESH_MS) return;
  inflight ??= (async () => {
    const startedAt = writes;
    try {
      const { data, error } = await client
        .from("transit_edges")
        .select("*")
        .order("created_at", { ascending: true })
        .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));
      if (error || !Array.isArray(data) || startedAt !== writes) return;
      const next = data.map(edgeFromRow).filter((edge): edge is TransitEdge => edge !== null);
      // Only bump the graph version (which clears the router cache) on a real change.
      if (JSON.stringify(next) !== JSON.stringify(getExtraEdges())) setExtraEdges(next);
      loadedAt = Date.now();
    } catch {
      // Unreachable database: keep routing on the last known links.
    } finally {
      inflight = null;
    }
  })();
  await inflight;
}

export type EdgeWriteResult = "ok" | "duplicate" | "failed";

/** Adds an admin link: stored first (when a database is configured), then routed on. */
export async function addExtraEdge(edge: TransitEdge): Promise<EdgeWriteResult> {
  const client = getSupabaseServiceClient();
  if (client) {
    try {
      const { error } = await client
        .from("transit_edges")
        .insert(edge)
        .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));
      if (error) return error.code === "23505" ? "duplicate" : "failed"; // 23505: unique_violation
    } catch {
      return "failed";
    }
  }
  writes += 1;
  setExtraEdges([...getExtraEdges().filter((e) => e.edge_id !== edge.edge_id), edge]);
  return "ok";
}

/** Removes an admin link from the database (when configured) and from routing. */
export async function removeExtraEdge(edgeId: string): Promise<EdgeWriteResult> {
  const client = getSupabaseServiceClient();
  if (client) {
    try {
      const { error } = await client
        .from("transit_edges")
        .delete()
        .eq("edge_id", edgeId)
        .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));
      if (error) return "failed";
    } catch {
      return "failed";
    }
  }
  writes += 1;
  setExtraEdges(getExtraEdges().filter((e) => e.edge_id !== edgeId));
  return "ok";
}
