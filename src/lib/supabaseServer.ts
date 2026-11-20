// ==============================================================================
// src/lib/supabaseServer.ts — server-only Supabase client (service role)
// The anon key in the browser is read-only (migration 0002). All writes go
// through validated API routes that use this client. Never import from client code.
// ==============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_TIMEOUT_MS = 1500;

let cached: SupabaseClient | null | undefined;

/** Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured: writes are then skipped. */
export function getSupabaseServiceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  return cached;
}
