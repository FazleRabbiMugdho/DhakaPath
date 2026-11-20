// ==============================================================================
// src/app/api/track-3-commute/route.ts
// Sandboxed LLM Intent Parser, SAT Grounding Verifier & Vision OCR Server API
// INIF 2026 DhakaPath — Track 3 (Dev 3: AI, NLP & Vision Engineer)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import {
  parseBanglishQueryDeterministic,
  safeExtractJson,
  BanglishParseResult,
} from "../../../features/feature-1-commute/banglishParser";
import { verifySubgraphTrajectory } from "../../../features/feature-1-commute/subgraphVerifier";
import { digitizeSignboardImage } from "../../../features/feature-1-commute/signboardVision";
import {
  processConversationTurn,
  ConversationContext,
} from "../../../features/feature-1-commute/conversationEngine";
import {
  DEFAULT_BUDGET_BDT,
  HubId,
  ParetoRouteOption,
  RouteLeg,
  ScenarioPreset,
  TransportMode,
  ValidationStatus,
} from "../../../contracts/schema";
import { clientKey, rateLimit, resolveSession } from "../../../lib/serverAuth";
import { getScenarioParameters } from "../../../engine/scenarioStore";
import { getJoinedPoolSizes } from "../../../features/feature-3-trust-cms/rideSharePool";
import { isRecord, sanitizeAlerts, validHub, VALIDATION_STATUSES } from "../../../lib/payloadValidation";

export const dynamic = "force-dynamic";

const MAX_QUERY_CHARS = 500;
const MAX_OCR_TEXT_CHARS = 10000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1024;
const MAX_ROUTE_LEGS = 30;

const DEFAULT_CONTEXT: ConversationContext = {
  last_origin_hub_id: HubId.H_MIRPUR10,
  last_dest_hub_id: HubId.H_MOTIJHEEL,
  last_budget_bdt: DEFAULT_BUDGET_BDT,
  is_student: true,
  avoid_hub_ids: [],
  selected_route: null,
};

function json(data: unknown, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function validHubList(value: unknown, max = 30): HubId[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const out: HubId[] = [];
  for (const hub of value) {
    if (!validHub(hub)) return null;
    if (!out.includes(hub)) out.push(hub);
  }
  return out;
}

function nonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function validateRouteLeg(value: unknown): RouteLeg | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.edge_id !== "string" ||
    !value.edge_id ||
    value.edge_id.length > 120 ||
    !validHub(value.origin_hub_id) ||
    !validHub(value.dest_hub_id) ||
    typeof value.mode !== "string" ||
    !value.mode ||
    value.mode.length > 40
  ) {
    return null;
  }

  // The verifier only needs topology, fare and duration. Accept compact legacy
  // fixtures by supplying safe defaults for the UI-only leg fields.
  const effectiveFare = nonNegativeNumber(value.effective_fare_bdt);
  const effectiveDuration = nonNegativeNumber(value.effective_duration_ms);
  if (effectiveFare === null || effectiveDuration === null) return null;

  const regularFare = nonNegativeNumber(value.regular_fare_bdt) ?? effectiveFare;
  const surgeRaw = nonNegativeNumber(value.surge_multiplier);
  const surge =
    surgeRaw !== null && surgeRaw >= 1 ? Math.min(3, surgeRaw) : 1;
  const poolRaw = value.pool_size_count;
  const poolSize =
    typeof poolRaw === "number" &&
    Number.isInteger(poolRaw) &&
    poolRaw >= 1 &&
    poolRaw <= 4
      ? poolRaw
      : 1;

  return {
    edge_id: value.edge_id,
    origin_hub_id: value.origin_hub_id,
    dest_hub_id: value.dest_hub_id,
    mode: value.mode as TransportMode,
    route_name:
      typeof value.route_name === "string"
        ? value.route_name.slice(0, 160)
        : value.edge_id,
    regular_fare_bdt: regularFare,
    effective_fare_bdt: effectiveFare,
    surge_multiplier: surge,
    pool_size_count: poolSize,
    effective_duration_ms: effectiveDuration,
    boarding_landmark:
      typeof value.boarding_landmark === "string"
        ? value.boarding_landmark.slice(0, 200)
        : "",
  };
}

function validateRoute(value: unknown): ParetoRouteOption | null {
  if (!isRecord(value) || !Array.isArray(value.legs)) return null;
  if (value.legs.length === 0 || value.legs.length > MAX_ROUTE_LEGS) return null;

  const legs: RouteLeg[] = [];
  for (const rawLeg of value.legs) {
    const leg = validateRouteLeg(rawLeg);
    if (!leg) return null;
    legs.push(leg);
  }

  const numericFields = [
    value.total_regular_fare_bdt,
    value.total_effective_fare_bdt,
    value.total_duration_ms,
  ];
  if (
    numericFields.some((field) => nonNegativeNumber(field) === null) ||
    typeof value.transfers_count !== "number" ||
    !Number.isInteger(value.transfers_count) ||
    value.transfers_count < 0 ||
    value.transfers_count > MAX_ROUTE_LEGS
  ) {
    return null;
  }
  const generalizedCost = nonNegativeNumber(value.generalized_cost_score) ?? 0;

  return {
    route_id:
      typeof value.route_id === "string" && value.route_id
        ? value.route_id.slice(0, 160)
        : "api_route",
    legs,
    total_regular_fare_bdt: value.total_regular_fare_bdt as number,
    total_effective_fare_bdt: value.total_effective_fare_bdt as number,
    total_duration_ms: value.total_duration_ms as number,
    transfers_count: value.transfers_count,
    generalized_cost_score: generalizedCost,
    grounding_status:
      typeof value.grounding_status === "string" &&
      VALIDATION_STATUSES.has(value.grounding_status)
        ? (value.grounding_status as ValidationStatus)
        : ValidationStatus.GRAPH_GROUNDED,
  };
}

function sanitizeContext(value: unknown): ConversationContext | null {
  if (value === undefined) return { ...DEFAULT_CONTEXT };
  if (!isRecord(value)) return null;

  const origin = value.last_origin_hub_id ?? DEFAULT_CONTEXT.last_origin_hub_id;
  const dest = value.last_dest_hub_id ?? DEFAULT_CONTEXT.last_dest_hub_id;
  const budget = value.last_budget_bdt ?? DEFAULT_CONTEXT.last_budget_bdt;
  const student = value.is_student ?? DEFAULT_CONTEXT.is_student;
  const avoid = validHubList(value.avoid_hub_ids ?? []);
  if (
    !validHub(origin) ||
    !validHub(dest) ||
    typeof budget !== "number" ||
    !Number.isFinite(budget) ||
    budget < 0 ||
    budget > 10000 ||
    typeof student !== "boolean" ||
    !avoid
  ) {
    return null;
  }

  let selectedRoute: ParetoRouteOption | null = null;
  if (value.selected_route !== undefined && value.selected_route !== null) {
    selectedRoute = validateRoute(value.selected_route);
    if (!selectedRoute) return null;
  }

  const context: ConversationContext = {
    last_origin_hub_id: origin,
    last_dest_hub_id: dest,
    last_budget_bdt: budget,
    is_student: student,
    avoid_hub_ids: avoid.filter((hub) => hub !== origin && hub !== dest),
    selected_route: selectedRoute,
  };

  if (value.last_discussed_hub !== undefined) {
    if (!validHub(value.last_discussed_hub)) return null;
    context.last_discussed_hub = value.last_discussed_hub;
  }
  if (value.last_reported_hub !== undefined) {
    if (!validHub(value.last_reported_hub)) return null;
    context.last_reported_hub = value.last_reported_hub;
  }
  return context;
}

function mergeValidatedLlmFields(
  deterministic: BanglishParseResult,
  raw: unknown,
  latencyMs: number
): BanglishParseResult | null {
  if (!isRecord(raw)) return null;
  const llmOrigin = validHub(raw.origin_hub_id) ? raw.origin_hub_id : null;
  const llmDest = validHub(raw.dest_hub_id) ? raw.dest_hub_id : null;
  if (!llmOrigin && !llmDest) return null;

  let changed = false;
  const merged: BanglishParseResult = { ...deterministic };
  if (!deterministic.origin_resolved && llmOrigin) {
    merged.origin_hub_id = llmOrigin;
    merged.origin_resolved = true;
    changed = true;
  }
  if (!deterministic.dest_resolved && llmDest) {
    merged.dest_hub_id = llmDest;
    merged.dest_resolved = true;
    changed = true;
  }
  if (!changed) return null;

  merged.parser_source = "LLM_SANDBOX";
  merged.parse_latency_ms = latencyMs;
  return merged;
}

function parseImageDataUrl(value: unknown): { mime: string; data: string } | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:image\/(png|jpe?g|webp|heic|heif);base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (!match) return null;
  const mime = `image/${match[1].toLowerCase()}`;
  const base64 = match[2].replace(/\s+/g, "");
  if (!base64 || base64.length > MAX_BASE64_CHARS) return null;
  let bytes: number;
  try {
    bytes = Buffer.from(base64, "base64").length;
  } catch {
    return null;
  }
  if (bytes < 100 || bytes > MAX_IMAGE_BYTES) return null;
  return { mime, data: base64 };
}

// Shared OpenRouter free-tier fallback. Returns the assistant text or null on any failure.
async function callOpenRouter(system: string, user: string, jsonMode: boolean, timeoutMs = 2500): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://dhakapath.app",
        "X-Title": "DhakaPath",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: jsonMode ? 0.1 : 0.4,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  // Signboard photos travel as base64 data URLs (≤ 5 MB image ≈ 6.7 MB text).
  const parsed = await readJsonBody(req, MAX_BASE64_CHARS + 64 * 1024);
  if (!parsed.ok) {
    return json({ error: parsed.error }, parsed.status);
  }
  const body = parsed.body;
  if (!isRecord(body)) {
    return json({ error: "Invalid request body" }, 400);
  }

  const action = body.action ?? "parse_intent";
  if (typeof action !== "string") {
    return json({ error: "Invalid action" }, 400);
  }

  try {
    // --------------------------------------------------------------------------
    // ACTION 1: PARSE BANGLISH COMMUTER INTENT (Groq / Gemini / Deterministic)
    // --------------------------------------------------------------------------
    if (action === "parse_intent") {
      if (typeof body.query !== "string") {
        return json({ error: "query must be a string" }, 400);
      }
      const rawQuery = body.query.trim();
      if (!rawQuery || rawQuery.length > MAX_QUERY_CHARS) {
        return json({ error: `query must be 1-${MAX_QUERY_CHARS} characters` }, 400);
      }

      const parseLimit = rateLimit(`track3:parse:${clientKey(req)}`, 60, 60 * 1000);
      if (!parseLimit.ok) {
        return json(
          { error: "Rate limit exceeded", retry_after_seconds: parseLimit.retryAfterSeconds },
          429
        );
      }

      const deterministicResult = parseBanglishQueryDeterministic(rawQuery);
      if (deterministicResult.adversarialHallucinationDetected) {
        return json({
          ...deterministicResult,
          latency_ms: Number((performance.now() - startTime).toFixed(2)),
        });
      }

      let result = deterministicResult;

      // Only consult an LLM when the deterministic lexer could not resolve both
      // sides. LLM hub fields are whitelisted; budget/student/avoid values are
      // never allowed to invent facts that were not in the text.
      if (!deterministicResult.origin_resolved || !deterministicResult.dest_resolved) {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (groqApiKey) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 900);
            const systemPrompt = `You are a strict transit intent parser for Dhaka, Bangladesh.
Return ONLY valid JSON with keys:
"origin_hub_id" (one of: H_UTTARA, H_MIRPUR10, H_AGARGAON, H_MOHAKHALI, H_BADDA, H_BANASREE, H_MALIBAGH, H_FARMGATE, H_MOHAMMADPUR, H_DHANMONDI, H_SCIENCELAB, H_SHAHBAGH, H_MOTIJHEEL, H_JATRABARI, H_GULISTAN),
"dest_hub_id" (same hub enum).
If a side is not clearly one of these hubs, omit that key.`;

            try {
              const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${groqApiKey}`,
                },
                body: JSON.stringify({
                  model: "llama-3.1-8b-instant",
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: rawQuery },
                  ],
                  temperature: 0.1,
                  response_format: { type: "json_object" },
                }),
                signal: controller.signal,
              });

              if (groqRes.ok) {
                const groqData = await groqRes.json();
                const content = groqData.choices?.[0]?.message?.content || "";
                const parsedJson = safeExtractJson<unknown>(content, null);
                const merged = mergeValidatedLlmFields(
                  deterministicResult,
                  parsedJson,
                  Number((performance.now() - startTime).toFixed(2))
                );
                if (merged) result = merged;
              }
            } finally {
              clearTimeout(timeoutId);
            }
          } catch {
            // Deterministic fallback.
          }
        }

        if (result === deterministicResult) {
          const orSystem = `You are a strict transit intent parser for Dhaka, Bangladesh. Return ONLY JSON with keys origin_hub_id and dest_hub_id (one of H_UTTARA,H_MIRPUR10,H_AGARGAON,H_MOHAKHALI,H_BADDA,H_BANASREE,H_MALIBAGH,H_FARMGATE,H_MOHAMMADPUR,H_DHANMONDI,H_SCIENCELAB,H_SHAHBAGH,H_MOTIJHEEL,H_JATRABARI,H_GULISTAN). If a place is not one of these hubs, omit that side.`;
          const orContent = await callOpenRouter(orSystem, rawQuery, true);
          if (orContent) {
            const merged = mergeValidatedLlmFields(
              deterministicResult,
              safeExtractJson<unknown>(orContent, null),
              Number((performance.now() - startTime).toFixed(2))
            );
            if (merged) result = merged;
          }
        }
      }

      return json({
        ...result,
        latency_ms: Number((performance.now() - startTime).toFixed(2)),
      });
    }

    // --------------------------------------------------------------------------
    // ACTION 2: DIGITIZE SIGNBOARD VISION OCR
    // --------------------------------------------------------------------------
    if (action === "digitize_signboard") {
      const ocrLimit = rateLimit(`track3:digitize:${clientKey(req)}`, 30, 60 * 1000);
      if (!ocrLimit.ok) {
        return json(
          { error: "Rate limit exceeded", retry_after_seconds: ocrLimit.retryAfterSeconds },
          429
        );
      }

      if (body.presetId !== undefined && (typeof body.presetId !== "string" || body.presetId.length > 80)) {
        return json({ error: "Invalid presetId" }, 400);
      }
      if (
        body.rawOcrText !== undefined &&
        (typeof body.rawOcrText !== "string" || body.rawOcrText.length > MAX_OCR_TEXT_CHARS)
      ) {
        return json({ error: "Invalid rawOcrText" }, 400);
      }
      if (body.base64Image !== undefined && !parseImageDataUrl(body.base64Image)) {
        return json({ error: "Invalid or oversized image" }, 400);
      }

      const result = await digitizeSignboardImage({
        base64Image: typeof body.base64Image === "string" ? body.base64Image : undefined,
        presetId: typeof body.presetId === "string" ? body.presetId : undefined,
        rawOcrText: typeof body.rawOcrText === "string" ? body.rawOcrText : undefined,
      });
      return json(result);
    }

    // --------------------------------------------------------------------------
    // ACTION 3: SAT SUBGRAPH GROUNDING VERIFIER V(P) = 1
    // --------------------------------------------------------------------------
    if (action === "verify_grounding") {
      const route = validateRoute(body.route);
      if (!route) {
        return json({ error: "Invalid route payload" }, 400);
      }
      if (body.is_student !== undefined && typeof body.is_student !== "boolean") {
        return json({ error: "Invalid is_student flag" }, 400);
      }

      const verifyPreset = body.preset === undefined ? ScenarioPreset.NORMAL_BASELINE : (body.preset as ScenarioPreset);
      if (!Object.values(ScenarioPreset).includes(verifyPreset)) {
        return json({ error: "Invalid scenario preset" }, 400);
      }

      // Surge and pool size come from server state, never from the route payload.
      const verifierResult = verifySubgraphTrajectory(route, Boolean(body.is_student), {
        surgeMultiplier: getScenarioParameters(verifyPreset).surge_multiplier,
        poolSizes: getJoinedPoolSizes(resolveSession(req).sessionId),
      });
      return json({
        ...verifierResult,
        latency_ms: Number((performance.now() - startTime).toFixed(2)),
      });
    }

    // --------------------------------------------------------------------------
    // ACTION 4: CONVERSATIONAL CHAT TURN ("Ask DhakaPath")
    // --------------------------------------------------------------------------
    if (action === "chat_turn") {
      const chatLimit = rateLimit(`track3:chat:${clientKey(req)}`, 90, 60 * 1000);
      if (!chatLimit.ok) {
        return json(
          { error: "Rate limit exceeded", retry_after_seconds: chatLimit.retryAfterSeconds },
          429
        );
      }

      if (typeof body.query !== "string") {
        return json({ error: "query must be a string" }, 400);
      }
      const rawQuery = body.query.trim();
      if (!rawQuery || rawQuery.length > MAX_QUERY_CHARS) {
        return json({ error: `query must be 1-${MAX_QUERY_CHARS} characters` }, 400);
      }

      const context = sanitizeContext(body.context);
      if (!context) {
        return json({ error: "Invalid conversation context" }, 400);
      }

      const preset =
        body.preset === undefined
          ? ScenarioPreset.NORMAL_BASELINE
          : (body.preset as ScenarioPreset);
      if (!Object.values(ScenarioPreset).includes(preset)) {
        return json({ error: "Invalid scenario preset" }, 400);
      }

      const activeAlerts = sanitizeAlerts(body.activeAlerts);
      if (!activeAlerts) {
        return json({ error: "Invalid activeAlerts payload" }, 400);
      }

      const turnResult = processConversationTurn(rawQuery, context, preset, activeAlerts);
      return json({
        ...turnResult,
        latency_ms: Number((performance.now() - startTime).toFixed(2)),
      });
    }

    // --------------------------------------------------------------------------
    // ACTION 5: SIGNBOARD PHOTO -> TEXT (Gemini free-tier vision). The client then
    // runs the deterministic digitizer on the transcript, so grounding still applies.
    // --------------------------------------------------------------------------
    if (action === "ocr_image") {
      const ocrLimit = rateLimit(`track3:ocr:${clientKey(req)}`, 10, 60 * 1000);
      if (!ocrLimit.ok) {
        return json(
          { ok: false, reason: "rate limited", retry_after_seconds: ocrLimit.retryAfterSeconds },
          429
        );
      }

      const image = parseImageDataUrl(body.base64Image);
      if (!image) {
        return json({ ok: false, reason: "invalid or oversized image" }, 400);
      }

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return json({ ok: false, reason: "vision unavailable" });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text:
                        "This is a Dhaka bus signboard, printed fare chart or handwritten route note. " +
                        "Transcribe every route as one line in the exact form: <Origin> -> <Destination> : <fare> BDT. " +
                        "Add the word metro if it is a metro rail fare. Output only those lines, no commentary.",
                    },
                    { inline_data: { mime_type: image.mime, data: image.data } },
                  ],
                },
              ],
            }),
            signal: controller.signal,
          }
        );
        if (!res.ok) {
          return json({ ok: false, reason: "vision error" }, 502);
        }
        const data = await res.json();
        const text = String(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").slice(
          0,
          MAX_OCR_TEXT_CHARS
        );
        return json({ ok: text.trim().length > 0, rawOcrText: text.trim() });
      } catch {
        return json({ ok: false, reason: "vision timeout" }, 504);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return json({ error: "Unsupported action" }, 400);
  } catch (error: unknown) {
    console.error("track-3-commute failed", error);
    return json({ error: "Internal API Error" }, 500);
  }
}
