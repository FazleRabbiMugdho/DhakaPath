// ==============================================================================
// src/app/api/admin/auth/route.ts — server-side admin session
// The passcode never appears in the client bundle. Successful login sets an
// HttpOnly, SameSite=Strict cookie.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminCookie,
  createAdminCookie,
  isAdminConfigured,
  isAdminRequest,
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

export async function POST(req: NextRequest) {
  const limit = rateLimit(`admin-login:${clientKey(req)}`, 5, 5 * 60 * 1000);
  if (!limit.ok) {
    return noStore(
      NextResponse.json(
        { ok: false, error: "Too many login attempts" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      )
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return noStore(NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }));
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return noStore(NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }));
  }

  const passcode = (body as { passcode?: unknown }).passcode;
  if (!verifyAdminPasscode(passcode)) {
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
