// ==============================================================================
// src/lib/supabase.ts — SAFE SUPABASE CLIENT INITIALIZATION
// Graceful Offline / Fallback Support for 0-Friction Hackathon Execution
// ==============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-dhakapath.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured: boolean =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("placeholder");

// Safe client instance that never crashes on boot if env vars are unset
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
