// ==============================================================================
// src/app/api/sync/route.ts — validated write-through to Supabase
// The browser used to upsert straight into Supabase with the public anon key,
// which required open read/write RLS. Rows now come here, are validated and
// rebuilt server-side (src/lib/syncRows.ts), scoped to the sender's signed
// session, and written with the server-only service key.
// Ride-share pool sizes are not accepted: a browser's pool is its own
// simulation, and one shared row per edge would let any caller set it.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { limitClient, readSession } from "@/lib/serverAuth";
import { isRecord } from "@/lib/payloadValidation";
import { getSupabaseServiceClient, SUPABASE_TIMEOUT_MS } from "@/lib/supabaseServer";
import { buildSyncRow, ownerTag, SYNC_PRIMARY_KEYS } from "@/lib/syncRows";

export const dynamic = "force-dynamic";

function respond(data: Record<string, unknown>, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(req: NextRequest) {
  const sessionId = readSession(req);
  if (!sessionId) return respond({ ok: false, error: "Session required" }, 401);

  const limit = limitClient(req, "sync", 120, 60 * 1000);
  if (!limit.ok) return respond({ ok: false, error: "Rate limit exceeded" }, 429);

  const parsed = await readJsonBody(req, 64 * 1024);
  if (!parsed.ok) return respond({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (!isRecord(body) || !isRecord(body.row)) return respond({ ok: false, error: "Invalid request body" }, 400);

  const table = body.table;
  if (table !== "street_alerts" && table !== "interception_logs") {
    return respond({ ok: false, error: "Unsupported table" }, 400);
  }
  const row = buildSyncRow(table, body.row, ownerTag(sessionId));
  if (!row) return respond({ ok: false, error: "Invalid row" }, 400);

  const client = getSupabaseServiceClient();
  if (!client) return respond({ ok: true, persisted: false }, 202);

  try {
    const { error } = await client
      .from(table)
      .upsert(row, { onConflict: SYNC_PRIMARY_KEYS[table] })
      .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));
    if (error) return respond({ ok: false, error: "Persistence failed" }, 502);
    return respond({ ok: true, persisted: true });
  } catch {
    return respond({ ok: false, error: "Persistence timed out" }, 504);
  }
}
