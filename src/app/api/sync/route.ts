// ==============================================================================
// src/app/api/sync/route.ts — validated write-through to Supabase
// The browser used to upsert straight into Supabase with the public anon key,
// which required open read/write RLS. Rows now come here, are validated and
// rebuilt server-side, and are written with the server-only service key.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/serverAuth";
import { isRecord, sanitizeAlerts, VALIDATION_STATUSES } from "@/lib/payloadValidation";
import { getSupabaseServiceClient, SUPABASE_TIMEOUT_MS } from "@/lib/supabaseServer";
import { CANONICAL_GRAPH_G0 } from "@/contracts/canonicalGraph";
import { getExtraEdges } from "@/engine/graphExtensions";
import { TransportMode } from "@/contracts/schema";

export const dynamic = "force-dynamic";

type SyncTable = "street_alerts" | "interception_logs" | "ride_share_pools";

function respond(data: Record<string, unknown>, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Rebuilds the row from validated fields only; returns null when invalid. */
function buildRow(table: SyncTable, raw: Record<string, unknown>): Record<string, unknown> | null {
  if (table === "street_alerts") {
    const alert = sanitizeAlerts([raw])?.[0];
    return alert ? { ...alert, half_life_remaining_ms: Math.round(alert.half_life_remaining_ms) } : null;
  }

  if (table === "interception_logs") {
    const { event_id, timestamp_ms, status, rejected_payload_summary, execution_time_ms } = raw;
    if (
      typeof event_id !== "string" || !event_id || event_id.length > 160 ||
      typeof timestamp_ms !== "number" || !Number.isFinite(timestamp_ms) ||
      typeof status !== "string" || !VALIDATION_STATUSES.has(status) ||
      typeof rejected_payload_summary !== "string" ||
      typeof execution_time_ms !== "number" || !Number.isFinite(execution_time_ms) || execution_time_ms < 0
    ) return null;
    return {
      event_id,
      timestamp_ms: Math.round(timestamp_ms),
      status,
      rejected_payload_summary: rejected_payload_summary.slice(0, 1000),
      execution_time_ms,
    };
  }

  // ride_share_pools: only the size is stored; member session IDs never leave the server.
  const { edge_id, pool_size_count } = raw;
  if (typeof edge_id !== "string" || typeof pool_size_count !== "number" || !Number.isInteger(pool_size_count)
    || pool_size_count < 1 || pool_size_count > 4) return null;
  const edge = [...CANONICAL_GRAPH_G0, ...getExtraEdges()].find((e) => e.edge_id === edge_id);
  if (!edge || (edge.mode !== TransportMode.RICKSHAW && edge.mode !== TransportMode.LEGUNA)) return null;
  return { edge_id, hub_id: edge.origin_hub_id, pool_size_count, updated_timestamp_ms: Date.now() };
}

const PRIMARY_KEYS: Record<SyncTable, string> = {
  street_alerts: "alert_id",
  interception_logs: "event_id",
  ride_share_pools: "edge_id",
};

export async function POST(req: NextRequest) {
  const limit = rateLimit(`sync:${clientKey(req)}`, 120, 60 * 1000);
  if (!limit.ok) return respond({ ok: false, error: "Rate limit exceeded" }, 429);

  const parsed = await readJsonBody(req, 64 * 1024);
  if (!parsed.ok) return respond({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (!isRecord(body) || !isRecord(body.row)) return respond({ ok: false, error: "Invalid request body" }, 400);

  const table = body.table;
  if (table !== "street_alerts" && table !== "interception_logs" && table !== "ride_share_pools") {
    return respond({ ok: false, error: "Unsupported table" }, 400);
  }
  const row = buildRow(table, body.row);
  if (!row) return respond({ ok: false, error: "Invalid row" }, 400);

  const client = getSupabaseServiceClient();
  if (!client) return respond({ ok: true, persisted: false }, 202);

  try {
    const { error } = await client
      .from(table)
      .upsert(row, { onConflict: PRIMARY_KEYS[table] })
      .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));
    if (error) return respond({ ok: false, error: "Persistence failed" }, 502);
    return respond({ ok: true, persisted: true });
  } catch {
    return respond({ ok: false, error: "Persistence timed out" }, 504);
  }
}
