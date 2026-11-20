// ==============================================================================
// src/lib/serverAuth.ts — server-only signed cookies + tiny in-memory limiter
// No admin passcode or session token is ever shipped to the browser bundle.
// ==============================================================================

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "dp_admin";
export const SESSION_COOKIE = "dp_session";

interface CookieOptions {
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
  path?: string;
  maxAge?: number;
}

const ADMIN_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Next bundles each route handler separately, so a module-level random secret
// would sign cookies that another route cannot verify. We prefer an explicit
// SESSION_SECRET; in its absence we use a deterministic secret derived from
// the project and admin passcode so that multi-instance serverless deployments
// (e.g. Vercel) can consistently verify signed cookies across cold starts.
const RUNTIME_SECRET = (() => {
  const globalWithSecret = globalThis as typeof globalThis & {
    __dhakapathRuntimeSecret?: string;
  };
  if (!globalWithSecret.__dhakapathRuntimeSecret) {
    globalWithSecret.__dhakapathRuntimeSecret = randomBytes(32).toString("hex");
  }
  return globalWithSecret.__dhakapathRuntimeSecret;
})();

function signingSecret(kind: string): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    `dhakapath_auth_session_secret_2026:${process.env.ADMIN_PASSCODE || "dhakapath2026"}:${kind}`
  );
}

function sign(kind: string, payload: string): string {
  return createHmac("sha256", signingSecret(kind)).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function createToken(kind: string, subject: string, ttlMs: number, now = Date.now()): string {
  const payload = `${kind}.${now + ttlMs}.${subject}`;
  return `${payload}.${sign(kind, payload)}`;
}

function verifyToken(kind: string, token: string | undefined, now = Date.now()): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [version, expiresRaw, subject, signature] = parts;
  if (version !== kind) return null;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires <= now) return null;
  const payload = `${version}.${expiresRaw}.${subject}`;
  if (!safeEqual(signature, sign(kind, payload))) return null;
  return subject;
}

function adminPasscode(): string {
  return (process.env.ADMIN_PASSCODE || "dhakapath2026").trim();
}

export function isAdminConfigured(): boolean {
  return adminPasscode().length > 0;
}

export function verifyAdminPasscode(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const expected = adminPasscode();
  if (!expected) return false;
  return safeEqual(input.trim(), expected);
}

export function createAdminCookie(): {
  name: string;
  value: string;
  options: CookieOptions;
} {
  return {
    name: ADMIN_COOKIE,
    value: createToken("admin", "admin", ADMIN_TTL_MS),
    options: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(ADMIN_TTL_MS / 1000),
    },
  };
}

export function clearAdminCookie(): {
  name: string;
  value: string;
  options: CookieOptions;
} {
  return {
    name: ADMIN_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifyToken("admin", req.cookies.get(ADMIN_COOKIE)?.value) === "admin";
}

/**
 * Reads a signed anonymous session or issues a fresh one. The returned token
 * must be set as an HttpOnly cookie on the response when `isNew` is true.
 */
export function resolveSession(req: NextRequest): {
  sessionId: string;
  token: string;
  isNew: boolean;
} {
  const existing = verifyToken("session", req.cookies.get(SESSION_COOKIE)?.value);
  if (existing) {
    return {
      sessionId: existing,
      token: req.cookies.get(SESSION_COOKIE)?.value ?? "",
      isNew: false,
    };
  }
  const sessionId = `anon_${randomUUID()}`;
  return {
    sessionId,
    token: createToken("session", sessionId, SESSION_TTL_MS),
    isNew: true,
  };
}

export function attachSessionCookie(
  response: NextResponse,
  session: { token: string; isNew: boolean }
): NextResponse {
  if (session.isNew && session.token) {
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
  }
  return response;
}

export function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (buckets.size > 512) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= max) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}
