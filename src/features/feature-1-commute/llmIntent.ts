// ==============================================================================
// src/features/feature-1-commute/llmIntent.ts
// Server-only language-understanding layer for "Ask DhakaPath".
//
// The model is used ONLY to understand language: intent, place names and
// incident vocabulary. It never produces fares, budgets, durations or route
// geometry — those stay inside the deterministic engine so the V(P*)=1
// grounding guarantee cannot be bypassed by a hallucination.
//
// Provider order: Groq (primary, Vercel) -> OpenRouter (fallback).
// Every failure is logged and degrades to the deterministic engine.
// ==============================================================================

import { HubId, IncidentType } from "../../contracts/schema";
import { CANONICAL_HUBS } from "../../contracts/canonicalGraph";
import type { ChatTurnIntent } from "./conversationEngine";

export type LlmProvider = "groq" | "openrouter";

export interface ChatHints {
  intent?: ChatTurnIntent;
  originHubId?: HubId;
  destHubId?: HubId;
  incidentHubId?: HubId;
  incidentType?: IncidentType;
}

export interface ChatHintsResult {
  hints: ChatHints;
  provider: LlmProvider;
}

const HUB_SET = new Set<string>(Object.values(HubId));
const INCIDENT_SET = new Set<string>(Object.values(IncidentType));
const INTENT_SET = new Set<string>([
  "ROUTE_SEARCH",
  "ALTERNATIVE_ROUTE",
  "FARE_QUESTION",
  "ALERT_QUESTION",
  "REPORT_INCIDENT",
  "CLARIFY",
]);

const HUB_CATALOGUE = Object.values(HubId)
  .map((hubId) => `${hubId} = ${CANONICAL_HUBS[hubId].name_en}`)
  .join("\n");

const SYSTEM_PROMPT = `You convert one Dhaka commuter message (English, Bangla or Banglish) into strict JSON.
Return ONLY a JSON object with exactly these keys:
{
  "intent": "ROUTE_SEARCH" | "ALTERNATIVE_ROUTE" | "FARE_QUESTION" | "ALERT_QUESTION" | "REPORT_INCIDENT" | "CLARIFY",
  "origin_hub_id": "<hub id>" | null,
  "dest_hub_id": "<hub id>" | null,
  "incident_hub_id": "<hub id>" | null,
  "incident_type": "WATERLOGGING" | "INTERSECTION_BLOCKADE" | "SEVERE_GRIDLOCK" | "ROAD_CONSTRUCTION" | null,
  "confidence": 0.0
}

Rules:
- Never output fares, budgets, prices, durations or distances. The only number you may output is "confidence".
- ROUTE_SEARCH: the message asks to travel between two places.
- REPORT_INCIDENT: the commuter reports a flood, waterlogging, traffic jam, blockade, strike or road work.
- FARE_QUESTION: they ask what a fare/price is or why a fare is what it is.
- ALERT_QUESTION: they ask whether a report/alert is trustworthy or still active.
- ALTERNATIVE_ROUTE: they ask to avoid or bypass a place.
- CLARIFY: greeting, thanks, small talk, or anything unrelated to Dhaka transit.
- Use only the hub ids below. If a place is not in this list, return null for it.
- Bangla case endings are part of the place name (e.g. "ফার্মগেটে" means Farmgate).

Hubs:
${HUB_CATALOGUE}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Pulls the first JSON object out of a possibly noisy completion.
 * Models sometimes wrap JSON in prose or code fences.
 */
function extractJsonObject(raw: string): unknown | null {
  if (!raw || typeof raw !== "string") return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function asHub(value: unknown): HubId | undefined {
  return typeof value === "string" && HUB_SET.has(value) ? (value as HubId) : undefined;
}

function asIntent(value: unknown): ChatTurnIntent | undefined {
  return typeof value === "string" && INTENT_SET.has(value)
    ? (value as ChatTurnIntent)
    : undefined;
}

function asIncident(value: unknown): IncidentType | undefined {
  return typeof value === "string" && INCIDENT_SET.has(value)
    ? (value as IncidentType)
    : undefined;
}

function parseHints(raw: unknown): ChatHints | null {
  if (!isRecord(raw)) return null;

  // A low-confidence guess is worse than asking the commuter to clarify.
  if (typeof raw.confidence === "number" && Number.isFinite(raw.confidence) && raw.confidence < 0.45) {
    return null;
  }

  const hints: ChatHints = {
    intent: asIntent(raw.intent),
    originHubId: asHub(raw.origin_hub_id),
    destHubId: asHub(raw.dest_hub_id),
    incidentHubId: asHub(raw.incident_hub_id),
    incidentType: asIncident(raw.incident_type),
  };

  if (!hints.intent && !hints.originHubId && !hints.destHubId && !hints.incidentHubId) {
    return null;
  }

  // An incident without a suspected corridor cannot be grounded; drop the type
  // so the engine does not attach a flood to the wrong hub.
  if (hints.intent === "REPORT_INCIDENT" && !hints.incidentHubId && !hints.originHubId) {
    hints.incidentType = undefined;
  }

  return hints;
}

interface ProviderResult {
  content: string;
  provider: LlmProvider;
}

async function postCompletion(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      console.warn(
        `[llm] ${url.includes("groq") ? "groq" : "openrouter"} HTTP ${response.status}: ${text.slice(0, 180)}`
      );
      return `__RETRY__:${response.status}:${text}`;
    }

    const data = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (error) {
    console.warn(`[llm] ${url.includes("groq") ? "groq" : "openrouter"} failed:`, String(error).slice(0, 180));
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGroq(userText: string, timeoutMs: number): Promise<ProviderResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText },
    ],
    temperature: 0,
    max_tokens: 220,
    response_format: { type: "json_object" },
  };

  const first = await postCompletion(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${apiKey}` },
    body,
    timeoutMs
  );

  // Some models reject JSON mode with 400/422: retry once without it.
  if (first && first.startsWith("__RETRY__")) {
    const status = Number(first.split(":")[1]);
    if (status === 400 || status === 422) {
      delete body.response_format;
      const retry = await postCompletion(
        "https://api.groq.com/openai/v1/chat/completions",
        { Authorization: `Bearer ${apiKey}` },
        body,
        Math.max(300, Math.round(timeoutMs * 0.6))
      );
      if (retry && !retry.startsWith("__RETRY__")) return { content: retry, provider: "groq" };
    }
    return null;
  }

  return first ? { content: first, provider: "groq" } : null;
}

async function callOpenRouter(userText: string, timeoutMs: number): Promise<ProviderResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  // Note: the retired "meta-llama/llama-3.1-8b-instruct:free" slug now returns
  // HTTP 404. Keep the slug configurable and log a clear warning if it dies too.
  const model = process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free";
  const content = await postCompletion(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://dhakapath.app",
      "X-Title": "DhakaPath",
    },
    {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      temperature: 0,
      max_tokens: 220,
      response_format: { type: "json_object" },
    },
    timeoutMs
  );

  if (!content || content.startsWith("__RETRY__")) return null;
  return { content, provider: "openrouter" };
}

/**
 * Resolves language understanding for one commuter message.
 *
 * `budgetMs` caps the total time spent across providers so the caller can keep
 * its own latency promise. Returns null when no provider is configured, every
 * call fails, or the model answers with unusable JSON.
 */
export async function resolveChatHints(
  query: string,
  budgetMs = 3200
): Promise<ChatHintsResult | null> {
  if (!query || typeof query !== "string") return null;

  const started = Date.now();
  const remaining = () => budgetMs - (Date.now() - started);

  // Groq gets the first share of the budget; OpenRouter takes what is left.
  if (process.env.GROQ_API_KEY) {
    const groq = await callGroq(query, Math.min(1800, Math.max(400, remaining())));
    if (groq) {
      const hints = parseHints(extractJsonObject(groq.content));
      if (hints) return { hints, provider: groq.provider };
    }
  }

  if (process.env.OPENROUTER_API_KEY && remaining() > 500) {
    const openRouter = await callOpenRouter(query, Math.min(2200, remaining() - 150));
    if (openRouter) {
      const hints = parseHints(extractJsonObject(openRouter.content));
      if (hints) return { hints, provider: openRouter.provider };
    }
  }

  return null;
}
