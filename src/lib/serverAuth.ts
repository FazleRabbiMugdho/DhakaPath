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
// SESSION_SECRET; without it, a secret derived from ADMIN_PASSCODE keeps
// multi-instance serverless deployments (e.g. Vercel) consistent across cold
// starts. This per-process random secret is the last resort.
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
    // Serverless instances (e.g. Vercel cold starts) must agree on the secret.
    // Derive it from the deployment's own passcode: never from a value in the
    // source, which would let anyone forge cookies.
    (adminPasscode() ? `${createHmac("sha256", adminPasscode()).update("dhakapath-cookie-secret").digest("hex")}:${kind}` : "") ||
    `${RUNTIME_SECRET}:${kind}`
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

// No built-in fallback: admin stays disabled until ADMIN_PASSCODE is set (see .env.example).
function adminPasscode(): string {
  let val = (process.env.ADMIN_PASSCODE ?? "").trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1).trim();
  }
  return val;
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

/** The caller's anonymous session id from a valid signed cookie, or null. Never issues one. */
export function readSession(req: NextRequest): string | null {
  return verifyToken("session", req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Rate-limit key for the caller. Only headers written by a trusted proxy are
 * read; a client can set X-Forwarded-For to anything, so it is ignored unless
 * TRUST_PROXY=1 says a proxy in front of us overwrites it. Without a trusted
 * IP, a signed session cookie (issued when the app loads; see GET
 * /api/admin/edges and /api/admin/auth) keys the
 * caller; cookie-less callers share one bucket — strict, but not spoofable.
 */
export function clientKey(req: NextRequest): string {
  if (process.env.VERCEL === "1") {
    // Vercel sets these headers with the real client address.
    const vercelIp =
      req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip")?.trim();
    if (vercelIp) return vercelIp;
  }
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (forwarded) return forwarded;
    const realIp = req.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }
  const session = readSession(req);
  return session ? `session:${session}` : "shared";
}

// Sessions cost nothing to mint, so session-keyed callers together also get a
// site-wide ceiling: farming cookies cannot multiply the per-caller limit forever.
const SESSION_CEILING_FACTOR = 20;

/** Per-caller rate limit for `name`, plus the shared ceiling when the caller is known only by session. */
export function limitClient(
  req: NextRequest,
  name: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
  const key = clientKey(req);
  const own = rateLimit(`${name}:${key}`, max, windowMs);
  if (!own.ok || !key.startsWith("session:")) return own;
  return rateLimit(`${name}:all-sessions`, max * SESSION_CEILING_FACTOR, windowMs);
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

/** Rate-limit check that does not consume a slot. */
export function isRateLimited(key: string, max: number): { limited: boolean; retryAfterSeconds: number } {
  const bucket = buckets.get(key);
  const now = Date.now();
  if (!bucket || bucket.resetAt <= now || bucket.count < max) return { limited: false, retryAfterSeconds: 0 };
  return { limited: true, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}
