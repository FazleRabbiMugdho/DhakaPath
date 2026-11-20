// ==============================================================================
// src/app/api/admin/auth/route.ts — server-side admin session
// The passcode never appears in the client bundle. Successful login sets an
// HttpOnly, SameSite=Strict cookie.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import {
  clearAdminCookie,
  createAdminCookie,
  isAdminConfigured,
  isAdminRequest,
  isRateLimited,
  rateLimit,
  clientKey,
  verifyAdminPasscode,
} from "../../../../lib/serverAuth";

export const dynamic = "force-dynamic";

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(req: NextRequest) {
  return noStore(
    NextResponse.json({
      ok: true,
      authenticated: isAdminRequest(req),
      configured: isAdminConfigured(),
    })
  );
}

const LOGIN_WINDOW_MS = 5 * 60 * 1000;
// Failed logins from all callers combined: rotating IPs cannot brute-force the
// passcode. Trade-off: a flood of failures can lock admin out for one window.
const GLOBAL_FAILURE_KEY = "admin-login-failures:global";
const GLOBAL_FAILURE_MAX = 20;

function tooMany(retryAfterSeconds: number): NextResponse {
  return noStore(
    NextResponse.json(
      { ok: false, error: "Too many login attempts" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    )
  );
}

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return noStore(
      NextResponse.json({ ok: false, error: "Admin is disabled: ADMIN_PASSCODE is not set" }, { status: 503 })
    );
  }

  const global = isRateLimited(GLOBAL_FAILURE_KEY, GLOBAL_FAILURE_MAX);
  if (global.limited) return tooMany(global.retryAfterSeconds);

  const limit = rateLimit(`admin-login:${clientKey(req)}`, 5, LOGIN_WINDOW_MS);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const parsed = await readJsonBody(req, 4 * 1024);
  if (!parsed.ok) {
    return noStore(NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status }));
  }
  const body = parsed.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return noStore(NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }));
  }

  const passcode = (body as { passcode?: unknown }).passcode;
  if (!verifyAdminPasscode(passcode)) {
    rateLimit(GLOBAL_FAILURE_KEY, GLOBAL_FAILURE_MAX, LOGIN_WINDOW_MS);
    return noStore(NextResponse.json({ ok: false, error: "Invalid passcode" }, { status: 401 }));
  }

  const cookie = createAdminCookie();
  const response = noStore(NextResponse.json({ ok: true, authenticated: true }));
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

export async function DELETE() {
  const cookie = clearAdminCookie();
  const response = noStore(NextResponse.json({ ok: true, authenticated: false }));
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
