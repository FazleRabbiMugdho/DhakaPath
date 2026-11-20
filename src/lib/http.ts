// ==============================================================================
// src/lib/http.ts — bounded JSON body reader for route handlers
// Route handlers have no default body limit, so a client could make the server
// buffer and parse an arbitrarily large payload. Read with a hard byte cap.
// ==============================================================================

import type { NextRequest } from "next/server";

export const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413; error: string };

export async function readJsonBody(
  req: NextRequest,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES
): Promise<JsonBodyResult> {
  const tooLarge = { ok: false, status: 413, error: `Request body exceeds ${maxBytes} bytes` } as const;
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return tooLarge;

  // Content-Length can be absent or false: enforce the cap while streaming.
  const reader = req.body?.getReader();
  if (!reader) return { ok: false, status: 400, error: "Invalid JSON body" };
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return tooLarge;
    }
    chunks.push(value);
  }

  try {
    return { ok: true, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }
}
