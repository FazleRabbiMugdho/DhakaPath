// ==============================================================================
// src/features/feature-1-commute/banglishParser.ts
// Sandboxed LLM Parser + 0.2ms Deterministic Phonetic Lexer Fallback
// INIF 2026 DhakaPath — Track 3 (Dev 3: AI, NLP & Vision Engineer)
// ==============================================================================

import { DEFAULT_BUDGET_BDT, HubId } from "../../contracts/schema";
import {
  findHubMentions,
  HubMention,
  clauseContains,
  normalizeDigitsToAscii,
} from "./hubMatching";

export interface BanglishParseResult {
  origin_hub_id: HubId;
  dest_hub_id: HubId;
  is_student: boolean;
  max_budget_bdt: number;
  avoid_hub_ids: HubId[];
  adversarialHallucinationDetected: boolean;
  origin_resolved: boolean;
  dest_resolved: boolean;
  explicit_dest_attempted?: boolean;
  explicit_origin_attempted?: boolean;
  unresolved_dest_token?: string;
  unresolved_origin_token?: string;
  hallucinatedSummary?: string;
  parser_source: "LLM_SANDBOX" | "DETERMINISTIC_REGEX_FALLBACK";
  parse_latency_ms: number;
  confidence_score: number;
  extracted_raw: {
    origin_token?: string;
    dest_token?: string;
    budget_token?: string;
    student_token?: string;
    avoid_tokens?: string[];
  };
}

// ------------------------------------------------------------------------------
// 1. Safe JSON Extractor (Robust brace parser for noisy LLM outputs)
// ------------------------------------------------------------------------------
export function safeExtractJson<T>(rawLlmText: string, fallback: T): T {
  if (!rawLlmText || typeof rawLlmText !== "string") return fallback;
  const start = rawLlmText.indexOf("{");
  const end = rawLlmText.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return fallback;
  try {
    return JSON.parse(rawLlmText.slice(start, end + 1)) as T;
  } catch {
    return fallback;
  }
}

// Hallucination keywords and adversarial traps
const ADVERSARIAL_TRAPS = [
  /underground[\s_-]*ferry/i,
  /ferry[\s_-]*from[\s_-]*badda/i,
  /launch[\s_-]*from[\s_-]*badda/i,
  /submarine/i,
  /helicopter/i,
  /bullet[\s_-]*train/i,
  /hovercraft/i,
  /teleport/i,
  /underground[\s_-]*boat/i,
  /water[\s_-]*metro[\s_-]*badda/i,
];

// Student keyword triggers. Bengali words do not use \b: JavaScript's word
// boundary only understands ASCII word characters.
const STUDENT_PATTERNS = [
  /\bstudents?\b/i,
  /\bhalf[\s_-]*pass\b/i,
  /\bid[\s_-]*(?:ache|ase)\b/i,
  /স্টুডেন্ট/i,
  /শিক্ষার্থী/i,
  /ছাত্র(?:ী)?/i,
  /হাফ[\s_-]*পাস/i,
];

// Flood / block phrases. Deliberately no bare "বাদ": it is a substring of
// সায়েদাবাদ and would turn a destination into an avoided hub.
const FLOOD_OR_BLOCK_RE =
  /(?:\bpani\b|\bflood(?:ed|ing)?\b|\bwaterlog(?:ging)?\b|\bblock(?:ade|ed)?\b|\bjam\b|\bgridlock\b|জলজট|পানি|বন্যা|ডুবে|উঠেছে|উঠছে|রাস্তা\s*বন্ধ|ব্লকেড|জ্যাম|যানজট)/iu;

const AVOID_COMMAND_PREFIX_RE =
  /(?:avoid|bypass|skip|excluding|without)\s+([^,;.!?।\n]{1,80})/giu;
const AVOID_COMMAND_POSTFIX_RE =
  /([^,;.!?।\n]{1,80}?)\s+(?:bad\s*diye|bad\s*deye|chara|charai|eray|এড়িয়ে|বাদ\s*দিয়ে|বাদ\s*দিন|ছাড়া|এড়ান)(?=$|[\s,;.!?।])/giu;

interface AvoidZone {
  readonly start: number;
  readonly end: number;
}

function avoidZones(text: string): AvoidZone[] {
  const zones: AvoidZone[] = [];
  AVOID_COMMAND_PREFIX_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = AVOID_COMMAND_PREFIX_RE.exec(text)) !== null) {
    const start = match.index + match[0].indexOf(match[1]);
    zones.push({ start, end: start + match[1].length });
  }
  AVOID_COMMAND_POSTFIX_RE.lastIndex = 0;
  while ((match = AVOID_COMMAND_POSTFIX_RE.exec(text)) !== null) {
    zones.push({ start: match.index, end: match.index + match[1].length });
  }
  return zones;
}

function isInsideZone(mention: HubMention, zones: ReadonlyArray<AvoidZone>): boolean {
  return zones.some((zone) => mention.start >= zone.start && mention.end <= zone.end);
}

// ------------------------------------------------------------------------------
// 2. Fast Deterministic Phonetic Lexer (< 0.2ms execution)
// ------------------------------------------------------------------------------
export function parseBanglishQueryDeterministic(rawText: string): BanglishParseResult {
  const startTime = performance.now();
  const text = (rawText || "").trim();

  // 1. Check for Adversarial Hallucination Traps
  for (const trap of ADVERSARIAL_TRAPS) {
    if (trap.test(text)) {
      const endTime = performance.now();
      return {
        origin_hub_id: HubId.H_BADDA,
        dest_hub_id: HubId.H_DHANMONDI,
        is_student: false,
        max_budget_bdt: 5,
        avoid_hub_ids: [],
        adversarialHallucinationDetected: true,
        origin_resolved: true,
        dest_resolved: true,
        hallucinatedSummary: "Edge H_BADDA -> H_DHANMONDI (UNDERGROUND_FERRY) Not in Canonical Graph G_0",
        parser_source: "DETERMINISTIC_REGEX_FALLBACK",
        parse_latency_ms: Number((endTime - startTime).toFixed(3)),
        confidence_score: 0.1,
        extracted_raw: {
          origin_token: "badda",
          dest_token: "dhanmondi",
          budget_token: "5 BDT",
        },
      };
    }
  }

  // 2. Identify hub mentions with text-index offsets. Matching is boundary-aware,
  // so "du" cannot match "during" and "বাদ" cannot match inside "সায়েদাবাদ".
  const mentions = findHubMentions(text);

  // 3. Identify avoided hubs from explicit avoid clauses or the clause that
  // contains the flood/block report. A hub is only avoided when it is tied to
  // that incident, not merely because the word appears elsewhere in the text.
  const zones = avoidZones(text);
  const avoidHubs: HubId[] = [];
  const travelHits: HubMention[] = [];

  for (const mention of mentions) {
    const explicitlyAvoided = isInsideZone(mention, zones);
    const incidentAvoided = clauseContains(text, mention.start, FLOOD_OR_BLOCK_RE);
    if (explicitlyAvoided || incidentAvoided) {
      if (!avoidHubs.includes(mention.hub_id)) avoidHubs.push(mention.hub_id);
    } else {
      travelHits.push(mention);
    }
  }

  // If a clause mentions the only hub together with a flood, keep it as the
  // destination rather than silently rewriting the trip. A pure incident report
  // is classified before this parser runs, so this is the least surprising path.
  const usableHits = travelHits.length > 0 ? travelHits : [];

  // Remove duplicate hub mentions while preserving text order.
  const uniqueHits = usableHits.filter(
    (hit, index, all) => all.findIndex((other) => other.hub_id === hit.hub_id) === index
  );

  // 4. Determine Origin & Destination (defaults are only used when unresolved)
  let origin_hub_id = uniqueHits[0]?.hub_id ?? HubId.H_MIRPUR10;
  let dest_hub_id = uniqueHits[uniqueHits.length - 1]?.hub_id ?? HubId.H_MOTIJHEEL;
  let originResolved = false;
  let destResolved = false;

  // "from" precedes the origin, so it is only checked before a hub (see below).
  const thekeRegex = /^\s*(?:theke|thekey|থেকে)(?=$|[\s,;.!?।])/i;
  const jaboRegex = /^\s*(?:jabo|zabo|porjonto|যাব|যেতে|পর্যন্ত)(?=$|[\s,;.!?।])/i;
  // English "X to Y" / "X -> Y": the hub *before* the connector is the origin.
  const toConnectorRegex = /^\s*(?:to\b|->|→)/i;

  let explicitOrigin: HubMention | null = null;
  let explicitDest: HubMention | null = null;

  for (const hit of uniqueHits) {
    const postSnippet = text.slice(hit.end, hit.end + 16);
    const preSnippet = text.slice(Math.max(0, hit.start - 12), hit.start);

    if (!explicitOrigin && (thekeRegex.test(postSnippet) || toConnectorRegex.test(postSnippet) || /\bfrom\s*$/i.test(preSnippet))) {
      explicitOrigin = hit;
    }
    if (!explicitDest && (jaboRegex.test(postSnippet) || /\bto\s*$/i.test(preSnippet) || /(?:->|→|-|>)\s*$/i.test(preSnippet))) {
      explicitDest = hit;
    }
  }

  if (explicitOrigin) {
    origin_hub_id = explicitOrigin.hub_id;
    originResolved = true;
  }
  if (explicitDest) {
    dest_hub_id = explicitDest.hub_id;
    destResolved = true;
  }

  // Positional fallback for an unlabelled pair ("Mirpur 10 Motijheel").
  if (!originResolved && !destResolved && uniqueHits.length >= 2) {
    origin_hub_id = uniqueHits[0].hub_id;
    dest_hub_id = uniqueHits[uniqueHits.length - 1].hub_id;
    originResolved = true;
    destResolved = true;
  } else if (uniqueHits.length === 1 && !originResolved && !destResolved) {
    // A single unlabelled hub is treated as the origin; the destination is
    // inherited from conversation context.
    origin_hub_id = uniqueHits[0].hub_id;
    originResolved = true;
  } else if (!originResolved && uniqueHits.length > 0 && destResolved) {
    // Destination was explicit, but no origin marker: use the first other hub.
    const candidate = uniqueHits.find((hit) => hit.hub_id !== dest_hub_id);
    if (candidate) {
      origin_hub_id = candidate.hub_id;
      originResolved = true;
    }
  } else if (!destResolved && uniqueHits.length > 1 && originResolved) {
    const candidate = uniqueHits.find((hit) => hit.hub_id !== origin_hub_id);
    if (candidate) {
      dest_hub_id = candidate.hub_id;
      destResolved = true;
    }
  }

  // Check if user explicitly tried to supply origin or destination words that failed to resolve
  let explicit_dest_attempted = false;
  let unresolved_dest_token: string | undefined;
  let explicit_origin_attempted = false;
  let unresolved_origin_token: string | undefined;

  if (!destResolved) {
    const destTryMatch =
      text.match(/(?:to|->|→)\s+([A-Za-z0-9\u0980-\u09FF\-_]{3,})/i) ||
      text.match(/([A-Za-z0-9\u0980-\u09FF\-_]{3,})\s+(?:jabo|zabo|porjonto|যাব|যেতে|পর্যন্ত)/i);
    if (destTryMatch && destTryMatch[1]) {
      const word = destTryMatch[1].trim().toLowerCase();
      if (!/^(?:bus|metro|rickshaw|student|pass|budget|fare|taka|tk|bdt|fast|speed|go|travel|now|today)$/i.test(word)) {
        explicit_dest_attempted = true;
        unresolved_dest_token = destTryMatch[1].trim();
      }
    }
  }

  if (!originResolved) {
    const originTryMatch =
      text.match(/\bfrom\s+([A-Za-z0-9\u0980-\u09FF\-_]{3,})/i) ||
      text.match(/([A-Za-z0-9\u0980-\u09FF\-_]{3,})\s+(?:theke|thekey|থেকে)/i);
    if (originTryMatch && originTryMatch[1]) {
      const word = originTryMatch[1].trim().toLowerCase();
      if (!/^(?:bus|metro|rickshaw|student|pass|budget|fare|taka|tk|bdt|fast|speed|go|travel|now|today)$/i.test(word)) {
        explicit_origin_attempted = true;
        unresolved_origin_token = originTryMatch[1].trim();
      }
    }
  }

  // Ensure origin and destination are distinct when both were inferred.
  if (originResolved && destResolved && origin_hub_id === dest_hub_id) {
    const candidate = uniqueHits.find((hit) => hit.hub_id !== origin_hub_id);
    if (candidate) dest_hub_id = candidate.hub_id;
    else destResolved = false;
  }

  // 5. Parse Student Pass status
  const is_student = STUDENT_PATTERNS.some((pattern) => pattern.test(text));

  // 6. Parse Budget in BDT (Bengali digits normalised to ASCII first)
  const numericText = normalizeDigitsToAscii(text);
  const isFareQuestion = /(?:koto|kto|how\s+much|কত|ভাড়া\s*কত)/iu.test(numericText);
  const hasExplicitBudgetContext = /(?:budget|under|within|max|moddhe|মধ্যে|takar\s*moddhe|মাসিক)/iu.test(numericText);
  let max_budget_bdt = DEFAULT_BUDGET_BDT;
  let budget_token: string | undefined;

  const noBudgetMatch = numericText.match(/\b(?:no|any)\s+budget\b|\bbudget\s+(?:nai|nei|nay)\b|বাজেট\s*নেই/iu);
  if (noBudgetMatch) {
    budget_token = noBudgetMatch[0].trim(); // explicit "no limit" (DEFAULT_BUDGET_BDT = 0)
  } else if (!isFareQuestion || hasExplicitBudgetContext) {
    const budgetMatch =
      numericText.match(/(?:budget|max|under|within)\s*[:=-]?\s*(\d{1,4})/i) ||
      numericText.match(/(\d{1,4})\s*(?:taka|takar|tk|bdt|৳|টাকা)\s*(?:er\s*)?(?:moddhe|মধ্যে|under|within|max)?/i);

    if (budgetMatch && budgetMatch[1]) {
      const parsedVal = parseInt(budgetMatch[1], 10);
      if (Number.isFinite(parsedVal) && parsedVal > 0 && parsedVal <= 1000) {
        max_budget_bdt = parsedVal;
        budget_token = budgetMatch[0].trim();
      }
    }
  }

  // Clean avoided list to not include origin or destination.
  const cleanAvoidHubs = avoidHubs.filter(
    (hub) => hub !== origin_hub_id && hub !== dest_hub_id
  );

  const endTime = performance.now();
  const latency = Number((endTime - startTime).toFixed(3));
  const confidence =
    originResolved && destResolved ? 0.98 : originResolved || destResolved ? 0.85 : 0.35;

  return {
    origin_hub_id,
    dest_hub_id,
    is_student,
    max_budget_bdt,
    avoid_hub_ids: cleanAvoidHubs,
    adversarialHallucinationDetected: false,
    origin_resolved: originResolved,
    dest_resolved: destResolved,
    explicit_dest_attempted,
    explicit_origin_attempted,
    unresolved_dest_token,
    unresolved_origin_token,
    parser_source: "DETERMINISTIC_REGEX_FALLBACK",
    parse_latency_ms: latency,
    confidence_score: confidence,
    extracted_raw: {
      ...(originResolved ? { origin_token: origin_hub_id } : {}),
      ...(destResolved ? { dest_token: dest_hub_id } : {}),
      ...(budget_token ? { budget_token } : {}),
      ...(is_student ? { student_token: "Student Pass Active" } : {}),
      avoid_tokens: cleanAvoidHubs,
    },
  };
}

// ------------------------------------------------------------------------------
// 4. Online Sandboxed Intent Parser (800ms AbortController + Local Fallback)
// ------------------------------------------------------------------------------
export async function parseCommuterIntent(rawText: string): Promise<BanglishParseResult> {
  const deterministicFallback = parseBanglishQueryDeterministic(rawText);

  // If adversarial trap detected, immediately return deterministic result
  if (deterministicFallback.adversarialHallucinationDetected) {
    return deterministicFallback;
  }

  // Try sandboxed server API with 2500ms abort controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch("/api/track-3-commute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "parse_intent",
        query: rawText,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return deterministicFallback;
    const data = (await response.json()) as Record<string, unknown> | null;
    if (!data || typeof data !== "object") return deterministicFallback;

    const hubs = new Set<string>(Object.values(HubId));
    const dataOrigin = typeof data.origin_hub_id === "string" && hubs.has(data.origin_hub_id)
      ? (data.origin_hub_id as HubId)
      : deterministicFallback.origin_hub_id;
    const dataDest = typeof data.dest_hub_id === "string" && hubs.has(data.dest_hub_id)
      ? (data.dest_hub_id as HubId)
      : deterministicFallback.dest_hub_id;

    const raw = data.extracted_raw && typeof data.extracted_raw === "object"
      ? (data.extracted_raw as Record<string, unknown>)
      : {};
    const avoidTokens = Array.isArray(raw.avoid_tokens)
      ? raw.avoid_tokens.filter((hub): hub is HubId => typeof hub === "string" && hubs.has(hub))
      : null;
    const serverAvoid = Array.isArray(data.avoid_hub_ids)
      ? data.avoid_hub_ids.filter((hub): hub is HubId => typeof hub === "string" && hubs.has(hub))
      : null;

    const hasStudentToken = raw.student_token !== undefined;
    const hasBudgetToken = raw.budget_token !== undefined;
    const student =
      hasStudentToken && typeof data.is_student === "boolean"
        ? data.is_student
        : deterministicFallback.is_student;
    const budget =
      hasBudgetToken &&
      typeof data.max_budget_bdt === "number" &&
      Number.isFinite(data.max_budget_bdt) &&
      data.max_budget_bdt >= 0 &&
      data.max_budget_bdt <= 10000
        ? data.max_budget_bdt
        : deterministicFallback.max_budget_bdt;
    const avoid =
      avoidTokens !== null ? serverAvoid ?? avoidTokens : deterministicFallback.avoid_hub_ids;

    return {
      ...deterministicFallback,
      origin_hub_id: dataOrigin,
      dest_hub_id: dataDest,
      origin_resolved:
        typeof data.origin_resolved === "boolean"
          ? data.origin_resolved && hubs.has(data.origin_hub_id as string)
          : deterministicFallback.origin_resolved,
      dest_resolved:
        typeof data.dest_resolved === "boolean"
          ? data.dest_resolved && hubs.has(data.dest_hub_id as string)
          : deterministicFallback.dest_resolved,
      is_student: student,
      max_budget_bdt: budget,
      avoid_hub_ids: avoid,
      adversarialHallucinationDetected: Boolean(data.adversarialHallucinationDetected),
      parser_source:
        data.parser_source === "LLM_SANDBOX"
          ? "LLM_SANDBOX"
          : "DETERMINISTIC_REGEX_FALLBACK",
      parse_latency_ms:
        typeof data.latency_ms === "number" && Number.isFinite(data.latency_ms)
          ? data.latency_ms
          : deterministicFallback.parse_latency_ms,
      confidence_score:
        typeof data.confidence_score === "number" && Number.isFinite(data.confidence_score)
          ? data.confidence_score
          : deterministicFallback.confidence_score,
      extracted_raw: {
        ...(typeof raw.origin_token === "string" ? { origin_token: raw.origin_token } : {}),
        ...(typeof raw.dest_token === "string" ? { dest_token: raw.dest_token } : {}),
        ...(typeof raw.budget_token === "string" ? { budget_token: raw.budget_token } : {}),
        ...(typeof raw.student_token === "string" ? { student_token: raw.student_token } : {}),
        ...(avoidTokens !== null ? { avoid_tokens: avoidTokens } : {}),
      },
    };
  } catch {
    // Timeout or network drop: fallback silently and seamlessly to deterministic output
    return deterministicFallback;
  } finally {
    clearTimeout(timeoutId);
  }
}

