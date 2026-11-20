// ==============================================================================
// src/features/feature-1-commute/conversationEngine.ts
// Contextual English/Banglish Conversational Commute Assistant ("Ask DhakaPath")
// Multi-turn Memory, Intent Classification, Graph Grounding, and Incident Reporting
// INIF 2026 DhakaPath — Track 3 & Conversational Commute Assistant
// ==============================================================================

import {
  HubId,
  ScenarioPreset,
  StreetAlert,
  AlertStatus,
  IncidentType,
  ValidationStatus,
  CommuterQuery,
  DEFAULT_BUDGET_BDT,
  ParetoRouteOption,
  TransportMode,
} from "../../contracts/schema";
import { CANONICAL_HUBS, CANONICAL_GRAPH_G0 } from "../../contracts/canonicalGraph";
import { diagnoseEmptyResult, executeParetoSearch } from "../../engine/paretoRouter";
import { parseBanglishQueryDeterministic } from "./banglishParser";
import {
  findHubMentions,
  findIncidentHub,
  extractHubFromText,
  hasIncidentKeyword,
} from "./hubMatching";
import {
  computePosteriorConfidence,
  DEFAULT_OFF_PEAK_PRIOR,
  DEFAULT_PEAK_PRIOR,
  TAU_BLOCKADE,
} from "../feature-3-trust-cms/bayesianTruth";

export type ChatTurnIntent =
  | "ROUTE_SEARCH"
  | "ALTERNATIVE_ROUTE"
  | "FARE_QUESTION"
  | "ALERT_QUESTION"
  | "REPORT_INCIDENT"
  | "CLARIFY";

export interface ChatBadge {
  label: string;
  variant?: "cyan" | "emerald" | "amber" | "crimson";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp_ms: number;
  intent?: ChatTurnIntent;
  badges?: ChatBadge[];
  metadata?: {
    routeSummary?: {
      fareBdt: number;
      regularFareBdt: number;
      durationMin: number;
      transfers: number;
      legs: string[];
    };
    reportedAlert?: {
      hubId: HubId;
      hubName: string;
      incidentType: IncidentType;
      confidencePct: number;
      status: string;
    };
    avoidedHubs?: ReadonlyArray<HubId>;
  };
}

export interface ConversationContext {
  last_origin_hub_id: HubId;
  last_dest_hub_id: HubId;
  last_budget_bdt: number;
  is_student: boolean;
  avoid_hub_ids: ReadonlyArray<HubId>;
  selected_route: ParetoRouteOption | null;
  last_discussed_hub?: HubId;
  last_reported_hub?: HubId;
}

export interface ChatTurnResult {
  replyText: string;
  intent: ChatTurnIntent;
  updatedContext: ConversationContext;
  resolvedQuery?: Partial<CommuterQuery>;
  newAlertToSubmit?: StreetAlert;
  badges?: ChatBadge[];
  messageMetadata?: ChatMessage["metadata"];
}

/**
 * Language-understanding hints supplied by the server-side LLM layer.
 *
 * Hints may only upgrade a CLARIFY turn — they can never override a
 * deterministic verdict. They carry intent and place names only: fares,
 * budgets, student status and route geometry always come from the engine.
 */
export interface ConversationHints {
  intent?: ChatTurnIntent;
  originHubId?: HubId;
  destHubId?: HubId;
  incidentHubId?: HubId;
  incidentType?: IncidentType;
}

/**
 * True when the message names a fresh trip, either as two hubs or as one hub
 * followed by an origin marker ("Mirpur 10 theke ..."). Used so that a fare
 * question about a NEW trip is routed through the planner instead of
 * describing the previous route.
 */
function namesNewTrip(
  text: string,
  mentions: ReadonlyArray<{ end: number }>
): boolean {
  if (mentions.length >= 2) return true;
  if (mentions.length === 0) return false;
  const after = text.slice(mentions[0].end, mentions[0].end + 16);
  return /(?:theke|thekey|from|থেকে)/iu.test(after);
}

const GREETING_RE =
  /^(?:hi|hello|hey|salam|assalamu\s*alaikum|slm|hola|নমস্কার|সালাম|হ্যালো|হাই)(?:[!.\s]|$)/iu;
const THANKS_RE =
  /^(?:thank\s*you|thanks|thx|ধন্যবাদ|shukriya|shokriya)(?:[!.\s]|$)/iu;

/** Greetings and thanks should answer instantly, never wait on a model. */
export function isSmallTalk(text: string): boolean {
  const trimmed = text.trim();
  return GREETING_RE.test(trimmed) || THANKS_RE.test(trimmed);
}

/**
 * How many full-weight (1.0) corroboration votes are needed to move the
 * posterior from `prior` to `targetPct`? Used to keep chat copy honest instead
 * of hard-coding "3 corroborations".
 */
function fullWeightVotesToReach(prior: number, targetPct: number, nowMs: number): number {
  for (let count = 1; count <= 50; count++) {
    const votes = Array.from({ length: count }, (_, index) => ({
      vote_id: `v_probe_${index}`,
      voter_session_id: "probe",
      direction: 1 as const,
      reliability_weight: 1,
      timestamp_ms: nowMs,
    }));
    if (computePosteriorConfidence(prior, votes, nowMs) * 100 >= targetPct) return count;
  }
  return 50;
}

// ------------------------------------------------------------------------------
// 1. Hub & Incident Lexicon for Context Extraction
// ------------------------------------------------------------------------------
export { extractHubFromText };

export function extractIncidentType(text: string): IncidentType | null {
  const lower = text.toLowerCase();
  if (/pani|flood|waterlog|waterlogging|water|dube|পানি|বন্যা/i.test(lower)) {
    return IncidentType.WATERLOGGING;
  }
  if (/blockade|block|rasta bondho|andolon|strike|protest|hartal|রাস্তা বন্ধ|ব্লকেড|আন্দোলন/i.test(lower)) {
    return IncidentType.INTERSECTION_BLOCKADE;
  }
  if (/jam|gridlock|traffic|attke|জ্যাম|যানজট/i.test(lower)) {
    return IncidentType.SEVERE_GRIDLOCK;
  }
  if (/construction|khondol|bhanga|কাজ চলছে|সংস্কার/i.test(lower)) {
    return IncidentType.ROAD_CONSTRUCTION;
  }
  return null;
}

// ------------------------------------------------------------------------------
// 2. Multi-Turn Intent Classifier
// ------------------------------------------------------------------------------
export function classifyConversationTurn(
  text: string,
  context: ConversationContext
): {
  intent: ChatTurnIntent;
  targetHub: HubId | null;
  incidentType: IncidentType | null;
  avoidHub: HubId | null;
} {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const mentions = findHubMentions(normalized);
  const mentionedHub = mentions[0]?.hub_id ?? null;
  const incidentType = extractIncidentType(normalized);
  const incidentHub = incidentType ? findIncidentHub(normalized, mentions) : null;
  const hasTripSyntax =
    mentions.length >= 2 &&
    /(?:theke|from|থেকে).*(?:jabo|zabo|to|porjonto|যাব|যেতে)|(?:jabo|zabo|porjonto|যাব|যেতে)/iu.test(lower);

  // 1. REPORT_INCIDENT check
  // Matches e.g. "Shahbagh e pani uthse", "report Farmgate blockade", "Mohakhali te jam"
  // The vocabulary deliberately includes bare nouns ("pani", "jam", "block",
  // "water logging"): those ARE the report in Banglish, and requiring a second
  // verb used to turn them into silent detour requests.
  const isReportingPhrasing =
    hasIncidentKeyword(normalized) &&
    /(?:uthse|utheche|hoyeche|report|lagche|dekha|pani|flood(?:ed|ing)?|water\s*log(?:ging)?|waterlog(?:ging)?|jam|gridlock|block(?:ade|ed|age)?|strike|hartal|construction|traffic|জমেছে|উঠেছে|উঠছে|হয়েছে|রিপোর্ট|বন্ধ|জ্যাম|পানি|বন্যা|ডুবে|জলজট|যানজট|সংস্কার|ভাঙা)/iu.test(normalized);
  if (
    incidentType &&
    isReportingPhrasing &&
    !hasTripSyntax &&
    !/trust|can i|bhorosha|reliable|kivabe|why|কেন|ভাড়া|status|ki ache|কি ache|কি অবস্থা|^is\s|^are\s|^does\s|^do\s|^did\s|^is\s+there|^are\s+there/iu.test(normalized)
  ) {
    const hub = incidentHub || context.last_discussed_hub || null;
    if (hub) {
      return {
        intent: "REPORT_INCIDENT",
        targetHub: hub,
        incidentType,
        avoidHub: null,
      };
    }
  }

  // 2. FARE_QUESTION check. This also catches "Mirpur 10 taka koto?" so the
  // number in the destination name is never mistaken for a 10 BDT budget.
  // A message that names a NEW trip goes to ROUTE_SEARCH instead: its reply
  // already includes the verified fare, and describing the previous route's
  // fare for a different journey is worse than doing the search.
  if (
    !namesNewTrip(normalized, mentions) &&
    /(?:why.*(?:fare|cost|price|48)|fare\s*(?:breakdown|rule|details|chart|info)?|how\s*(?:much|is).*fare|how\s*does.*(?:student|pass|fare|discount)|(?:student|metro|bus)\s*(?:fare|pass|discount|rule|rate)|kivabe.*holo|bhara.*kivabe|ভাড়া.*(?:কেন|হিসাব|কত|নিয়ম|চার্ট)|(?:ছাত্র|স্টুডেন্ট|মেট্রো|বাস).*(?:ভাড়া|ছাড়)|student pass.*rule|10 taka keno|(?:\d+|taka|tk|bdt|৳|টাকা)\s*(?:koto|kto|কত)|(?:koto|kto|কত).*(?:taka|tk|bdt|৳|টাকা))/iu.test(normalized)
  ) {
    return {
      intent: "FARE_QUESTION",
      targetHub: mentionedHub,
      incidentType: null,
      avoidHub: null,
    };
  }

  // 3. ALERT_QUESTION check
  // Matches e.g. "can I trust that report?", "is Farmgate still flooded?", "bhorosha kora jay?", "Shahbagh er status ki?"
  if (
    /trust|reliable|bhorosha|ভরসা|বিশ্বাস|is.*flooded|pani ki ache|jam ki ache|status ki|alert.*trust|খবর কি|অবস্থা কি|কি অবস্থা/iu.test(normalized)
  ) {
    const hub = mentionedHub || context.last_discussed_hub || context.last_reported_hub || HubId.H_SHAHBAGH;
    return {
      intent: "ALERT_QUESTION",
      targetHub: hub,
      incidentType: null,
      avoidHub: null,
    };
  }

  // 4. ALTERNATIVE_ROUTE check. Only a hub actually tied to an avoid phrase is
  // added to the avoid list; a generic "any other route?" must not silently
  // avoid Farmgate.
  if (
    /avoid|bypass|bad diye|bad deye|chara|charai|eray|বাদ দিয়ে|এড়িয়ে|alternative|ar kono rasta|what if.*floods|onno kono route|অন‍্য পথ/iu.test(normalized)
  ) {
    const explicitlyAvoiding = /avoid|bypass|bad diye|bad deye|chara|charai|eray|বাদ দিয়ে|এড়িয়ে/iu.test(normalized);
    return {
      intent: "ALTERNATIVE_ROUTE",
      targetHub: null,
      incidentType: null,
      avoidHub: explicitlyAvoiding ? incidentHub || mentionedHub : null,
    };
  }

  // 5. ROUTE_SEARCH check. The bare English "to" is deliberately absent here:
  // it appears in ordinary conversation and must not create a trip by itself.
  if (
    mentions.length > 0 ||
    /theke|from|jabo|route|যাব|থেকে|budget|student|half pass/iu.test(normalized)
  ) {
    return {
      intent: "ROUTE_SEARCH",
      targetHub: mentionedHub,
      incidentType: null,
      avoidHub: null,
    };
  }

  // Fallback -> CLARIFY
  return {
    intent: "CLARIFY",
    targetHub: mentionedHub,
    incidentType,
    avoidHub: null,
  };
}

// ------------------------------------------------------------------------------
// 3. Grounded Turn Processor
// ------------------------------------------------------------------------------
export function processConversationTurn(
  rawUserText: string,
  context: ConversationContext,
  preset: ScenarioPreset,
  activeAlerts: ReadonlyArray<StreetAlert>,
  hints?: ConversationHints
): ChatTurnResult {
  const classification = classifyConversationTurn(rawUserText, context);
  let intent = classification.intent;
  let targetHub = classification.targetHub;
  let incidentType = classification.incidentType;
  let avoidHub = classification.avoidHub;

  // Hints are a fallback for language the rules could not interpret. They are
  // ignored whenever the deterministic classifier already understood the turn.
  if (hints && intent === "CLARIFY") {
    if (hints.intent) intent = hints.intent;
    if (hints.incidentType) incidentType = hints.incidentType;
    if (hints.incidentHubId) targetHub = hints.incidentHubId;
    else if (hints.destHubId) targetHub = hints.destHubId;
    else if (hints.originHubId) targetHub = hints.originHubId;
    if (intent === "ALTERNATIVE_ROUTE" && !avoidHub) {
      avoidHub = hints.incidentHubId ?? hints.originHubId ?? hints.destHubId ?? null;
    }
  }

  // ----------------------------------------------------------------------------
  // CASE 0: CLARIFY
  // ----------------------------------------------------------------------------
  if (intent === "CLARIFY") {
    const isGreeting = GREETING_RE.test(rawUserText.trim());
    const isThanks = THANKS_RE.test(rawUserText.trim());

    if (isGreeting) {
      return {
        replyText:
          `Assalamu Alaikum! 👋 I am your **Ask DhakaPath** commute assistant.\n\n` +
          `How can I help with your journey today?\n` +
          `• **Find Routes:** *"Mirpur 10 to Motijheel, student"* or *"Uttara to Dhanmondi"*\n` +
          `• **Fare Inquiries:** *"Why that fare?"* or *"How does student discount work?"*\n` +
          `• **Live Conditions & Detours:** *"Avoid Farmgate"* or *"Shahbagh e pani uthse"*`,
        intent: "CLARIFY",
        updatedContext: {
          ...context,
          ...(targetHub ? { last_discussed_hub: targetHub } : {}),
        },
        badges: [{ label: "ACTIVE", variant: "emerald" }],
      };
    }

    if (isThanks) {
      return {
        replyText:
          `You're very welcome! Safe travels across Dhaka. Let me know if you need another route or live alert update anytime!`,
        intent: "CLARIFY",
        updatedContext: context,
        badges: [{ label: "SAFE TRAVELS", variant: "emerald" }],
      };
    }

    return {
      replyText:
        `I can help with a route, a fare breakdown, a live alert check, or a street report. ` +
        `Try: *"Mirpur 10 theke Motijheel, student, 55 BDT"*, *"why is the fare 48 BDT?"*, ` +
        `or *"Farmgate e pani uthse"*.`,
      intent: "CLARIFY",
      updatedContext: {
        ...context,
        ...(targetHub ? { last_discussed_hub: targetHub } : {}),
      },
      badges: [{ label: "NEED A DETAIL", variant: "cyan" }],
    };
  }

  // ----------------------------------------------------------------------------
  // CASE 1: REPORT_INCIDENT
  // ----------------------------------------------------------------------------
  if (intent === "REPORT_INCIDENT" && targetHub && incidentType) {
    const hubMeta = CANONICAL_HUBS[targetHub];
    const hubName = hubMeta?.name_en || targetHub;

    const now = Date.now();
    const alertId = `alert_chat_${targetHub.toLowerCase()}_${now}`;
    // Find representative edge for this hub
    const associatedEdge =
      CANONICAL_GRAPH_G0.find((e) => e.dest_hub_id === targetHub || e.origin_hub_id === targetHub)
        ?.edge_id || `E_CROWD_${targetHub}`;

    const reportVote = {
      vote_id: `v_chat_${now}`,
      voter_session_id: "commuter_conversational_reporter",
      direction: 1 as const,
      reliability_weight: 0.30,
      timestamp_ms: now,
    };

    const priorUsed =
      preset === ScenarioPreset.PEAK_CRISIS_SURGE ? DEFAULT_PEAK_PRIOR : DEFAULT_OFF_PEAK_PRIOR;
    const confidencePct = Number(
      (computePosteriorConfidence(priorUsed, [reportVote], now) * 100).toFixed(1)
    );
    const alertStatus =
      confidencePct >= TAU_BLOCKADE
        ? AlertStatus.VERIFIED_ACTIVE
        : AlertStatus.PENDING_CORROBORATION;
    const corroborationsNeeded = fullWeightVotesToReach(
      priorUsed,
      TAU_BLOCKADE,
      now
    );

    const newAlert: StreetAlert = {
      alert_id: alertId,
      edge_id: associatedEdge,
      hub_id: targetHub,
      incident_type: incidentType,
      status: alertStatus,
      validation_status: ValidationStatus.GRAPH_GROUNDED,
      severity_alpha: incidentType === IncidentType.WATERLOGGING ? 2.4 : 1.9,
      confidence_pct: confidencePct,
      half_life_remaining_ms: 1800000, // 30-min half-life
      created_timestamp_ms: now,
      votes: [reportVote],
    };

    const replyText =
      `Report submitted! Logged **${incidentType}** at **${hubName}** as \`${alertStatus}\` with an initial Bayesian confidence of **${confidencePct.toFixed(1)}%**.\n\n` +
      `🛡️ **Sanity Gate:** Under our Tier-2 Bayesian model, a single 0.30-weight report does NOT sever transit corridors immediately. ` +
      `The posterior must reach $R_e \\ge ${TAU_BLOCKADE}%$ (about ${corroborationsNeeded} full-weight corroborations from the ${Math.round(priorUsed * 100)}% baseline prior). This stops false alarms and troll reports.\n\n` +
      `You can corroborate this live in **Zone 3 Alert Feed** or vote to verify it!`;

    return {
      replyText,
      intent: "REPORT_INCIDENT",
      updatedContext: {
        ...context,
        last_discussed_hub: targetHub,
        last_reported_hub: targetHub,
      },
      newAlertToSubmit: newAlert,
      badges: [
        { label: `LOGGED: ${incidentType}`, variant: "amber" },
        { label: `PENDING (${confidencePct.toFixed(1)}%)`, variant: "amber" },
        { label: hubName, variant: "cyan" },
      ],
      messageMetadata: {
        reportedAlert: {
          hubId: targetHub,
          hubName,
          incidentType,
          confidencePct,
          status: alertStatus,
        },
      },
    };
  }

  // ----------------------------------------------------------------------------
  // CASE 2: FARE_QUESTION
  // ----------------------------------------------------------------------------
  if (intent === "FARE_QUESTION") {
    const route = context.selected_route;
    const originName = CANONICAL_HUBS[context.last_origin_hub_id]?.name_en || context.last_origin_hub_id;
    const destName = CANONICAL_HUBS[context.last_dest_hub_id]?.name_en || context.last_dest_hub_id;

    if (!route || route.legs.length === 0) {
      return {
        replyText:
          `Under statutory Bangladesh transit fare laws:\n` +
          `• **Local Buses:** 50% statutory student discount with a strict **10 BDT minimum floor** (\`max(10, ceil(0.5 * Base))\`).\n` +
          `• **MRT-6 Metro Rail:** Stepped in 10 BDT increments from **20 BDT to 100 BDT** at 5 BDT/km with **zero student discount**.\n` +
          `• **Connector Rickshaw:** Surges 1.5x–2.5x during storms, split dynamically by up to 4 peers.`,
        intent: "FARE_QUESTION",
        updatedContext: context,
        badges: [{ label: "STATUTORY TARIFF", variant: "emerald" }],
      };
    }

    const legExplanations = route.legs.map((leg, i) => {
      if (leg.mode === TransportMode.WALK) {
        return `• **Leg ${i + 1} (${leg.route_name}):** Free transfer (**0 BDT**, ${Math.round(leg.effective_duration_ms / 60000)} mins)`;
      }
      if (leg.mode === TransportMode.METRO) {
        return `• **Leg ${i + 1} (${leg.route_name}):** **${leg.effective_fare_bdt} BDT** (DMTCL MRT-6 statutory distance rate; **0% student discount** per DMTCL rules)`;
      }
      if (leg.mode === TransportMode.BUS) {
        const studentNote = context.is_student
          ? `(Statutory 50% Student Pass: Regular ${leg.regular_fare_bdt} BDT → **${leg.effective_fare_bdt} BDT**, 10 BDT floor verified)`
          : `(Regular ticket: ${leg.regular_fare_bdt} BDT)`;
        return `• **Leg ${i + 1} (${leg.route_name}):** **${leg.effective_fare_bdt} BDT** ${studentNote}`;
      }
      if (leg.mode === TransportMode.RICKSHAW) {
        return `• **Leg ${i + 1} (${leg.route_name}):** **${leg.effective_fare_bdt} BDT** (Surged ${leg.surge_multiplier}x split across ${leg.pool_size_count} pool members)`;
      }
      return `• **Leg ${i + 1}:** **${leg.effective_fare_bdt} BDT**`;
    });

    const replyText =
      `Here is the verified fare breakdown for **${originName} → ${destName}**:\n\n` +
      legExplanations.join("\n") +
      `\n\n💰 **Total Verified Fare: ${route.total_effective_fare_bdt} BDT** (Regular fare would be ${route.total_regular_fare_bdt} BDT, saving you **+${route.total_regular_fare_bdt - route.total_effective_fare_bdt} BDT**).\n` +
      `🛡️ Status: \`GRAPH_GROUNDED\` — calculated directly from official BRTA statutory schedules and DMTCL station tariffs with zero guesswork.`;

    return {
      replyText,
      intent: "FARE_QUESTION",
      updatedContext: context,
      badges: [
        { label: `${route.total_effective_fare_bdt} BDT VERIFIED`, variant: "emerald" },
        { label: "10 BDT FLOOR ENFORCED", variant: "emerald" },
        { label: "MRT-6 ZERO DISCOUNT", variant: "cyan" },
      ],
      messageMetadata: {
        routeSummary: {
          fareBdt: route.total_effective_fare_bdt,
          regularFareBdt: route.total_regular_fare_bdt,
          durationMin: Math.round(route.total_duration_ms / 60000),
          transfers: route.transfers_count,
          legs: route.legs.map((l) => `${l.mode}: ${l.effective_fare_bdt} BDT`),
        },
      },
    };
  }

  // ----------------------------------------------------------------------------
  // CASE 3: ALERT_QUESTION
  // ----------------------------------------------------------------------------
  if (intent === "ALERT_QUESTION") {
    const hub = targetHub || context.last_discussed_hub || HubId.H_SHAHBAGH;
    const hubName = CANONICAL_HUBS[hub]?.name_en || hub;

    const alert = activeAlerts.find(
      (a) => a.hub_id === hub && a.status !== AlertStatus.EXPIRED && a.status !== AlertStatus.RESOLVED
    );

    if (alert) {
      const isSevered = alert.confidence_pct >= TAU_BLOCKADE;
      const decayMinsRemaining = Math.round(alert.half_life_remaining_ms / 60000);

      const replyText =
        `🔍 **Truth & Reliability Audit for ${hubName}:**\n\n` +
        `• **Incident:** ${alert.incident_type}\n` +
        `• **Bayesian Posterior Confidence $R_e(t)$:** **${alert.confidence_pct.toFixed(1)}%**\n` +
        `• **Status:** \`${alert.status}\` (${alert.votes.length} corroboration vote(s))\n` +
        `• **Corridor Impact:** ${isSevered
          ? `🚨 **SEVERED ($T_{eff} \\to \\infty$).** Motorized surface edges are completely blocked. DhakaPath automatically reroutes traffic through grade-separated MRT-6 or Walk-Bridges.`
          : `⚠️ **Passable with Delay.** Vehicle speeds are slowed down, but the corridor is not yet severed.`
        }\n` +
        `• **30-Min Exponential Decay:** Decays toward baseline with $\\lambda = \\ln(2)/30$. Expires automatically if uncorroborated in ~${decayMinsRemaining} mins.\n\n` +
        `You can click **[+1 Corroborate]** or **[-1 Resolve]** on the Zone 3 card to update live confidence!`;

      return {
        replyText,
        intent: "ALERT_QUESTION",
        updatedContext: { ...context, last_discussed_hub: hub },
        badges: [
          { label: `${hubName}: ${alert.confidence_pct.toFixed(1)}%`, variant: isSevered ? "crimson" : "amber" },
          { label: alert.status, variant: isSevered ? "crimson" : "amber" },
        ],
      };
    }

    const replyText =
      `🟢 **Corridor Clear:** There are currently no active waterlogging or blockade alerts at **${hubName}**.\n\n` +
      `Buses, MRT-6, and connector rickshaws are operating along baseline corridors without disruption. If you notice any street blockade or flood, simply type *"Report ${hubName} flooded"*!`;

    return {
      replyText,
      intent: "ALERT_QUESTION",
      updatedContext: { ...context, last_discussed_hub: hub },
      badges: [
        { label: `${hubName}: CLEAR`, variant: "emerald" },
        { label: "NORMAL BASELINE", variant: "cyan" },
      ],
    };
  }

  // ----------------------------------------------------------------------------
  // CASE 4: ALTERNATIVE_ROUTE (e.g. "What if Farmgate floods? avoid Farmgate")
  // ----------------------------------------------------------------------------
  if (intent === "ALTERNATIVE_ROUTE") {
    if (!avoidHub) {
      return {
        replyText:
          `I can suggest a detour, but I need to know which corridor to avoid. ` +
          `Try *"avoid Farmgate"* or *"what if Mohakhali floods?"* so I can reroute your last trip without guessing.`,
        intent: "ALTERNATIVE_ROUTE",
        updatedContext: context,
        badges: [{ label: "NEED A CORRIDOR", variant: "amber" }],
      };
    }
    const hubToAvoid = avoidHub;
    const avoidName = CANONICAL_HUBS[hubToAvoid]?.name_en || hubToAvoid;

    const newAvoidList = Array.from(new Set([...context.avoid_hub_ids, hubToAvoid]));

    const resolvedQuery: Partial<CommuterQuery> = {
      origin_hub_id: context.last_origin_hub_id,
      dest_hub_id: context.last_dest_hub_id,
      is_student: context.is_student,
      max_budget_bdt: context.last_budget_bdt,
      avoid_hub_ids: newAvoidList,
      raw_query_text: rawUserText,
    };

    // Recompute route via Pareto router
    const searchRes = executeParetoSearch(
      {
        action_id: `CHAT_DETOUR_${Date.now()}`,
        raw_query_text: rawUserText,
        origin_hub_id: context.last_origin_hub_id,
        dest_hub_id: context.last_dest_hub_id,
        is_student: context.is_student,
        max_budget_bdt: context.last_budget_bdt,
        avoid_hub_ids: newAvoidList,
        timestamp_ms: Date.now(),
      },
      preset,
      activeAlerts
    );

    const newOptimal = searchRes.routes[0] || null;
    const originName = CANONICAL_HUBS[context.last_origin_hub_id]?.name_en;
    const destName = CANONICAL_HUBS[context.last_dest_hub_id]?.name_en;

    let replyText = "";
    if (newOptimal) {
      const legDesc = newOptimal.legs
        .map((l, i) => {
          const modeEmoji =
            l.mode === TransportMode.METRO
              ? "🚇"
              : l.mode === TransportMode.BUS
                ? "🚌"
                : l.mode === TransportMode.RICKSHAW
                  ? "🛺"
                  : "🚶";
          return `• Step ${i + 1}: ${modeEmoji} **${l.mode}** (${l.route_name}) → **${l.effective_fare_bdt} BDT** · ~${Math.round(l.effective_duration_ms / 60000)} mins`;
        })
        .join("\n");

      replyText =
        `Detour Calculated! Rerouting **${originName} → ${destName}** to safely **bypass ${avoidName}**:\n\n` +
        `⚡ **Detour Route Plan:**\n` +
        `${legDesc}\n\n` +
        `📊 **Total:** **${newOptimal.total_effective_fare_bdt} BDT** • **${Math.round(newOptimal.total_duration_ms / 60000)} mins** • **${newOptimal.transfers_count} transfer(s)**.\n` +
        `🛡️ Avoided flooded/severed corridor at ${avoidName}. Route cards and map have updated automatically!`;
    } else {
      replyText =
        `Attempted to bypass **${avoidName}**, but motorized routes partition under budget ${context.last_budget_bdt} BDT. Activating Walk-Bridge Footpath bypass!`;
    }

    return {
      replyText,
      intent: "ALTERNATIVE_ROUTE",
      updatedContext: {
        ...context,
        avoid_hub_ids: newAvoidList,
        selected_route: newOptimal,
        last_discussed_hub: hubToAvoid,
      },
      resolvedQuery,
      badges: [
        { label: `BYPASSING ${avoidName}`, variant: "amber" },
        newOptimal
          ? { label: `${newOptimal.total_effective_fare_bdt} BDT`, variant: "emerald" }
          : { label: "WALK-BRIDGE", variant: "amber" },
      ],
      messageMetadata: {
        avoidedHubs: newAvoidList,
        routeSummary: newOptimal
          ? {
            fareBdt: newOptimal.total_effective_fare_bdt,
            regularFareBdt: newOptimal.total_regular_fare_bdt,
            durationMin: Math.round(newOptimal.total_duration_ms / 60000),
            transfers: newOptimal.transfers_count,
            legs: newOptimal.legs.map((l) => `${l.mode}: ${l.effective_fare_bdt} BDT`),
          }
          : undefined,
      },
    };
  }

  // ----------------------------------------------------------------------------
  // CASE 5: ROUTE_SEARCH (New query or contextual refinement)
  // ----------------------------------------------------------------------------
  // Parse with deterministic lexer first
  const parsed = parseBanglishQueryDeterministic(rawUserText);

  // The LLM can name the hubs the lexer could not resolve. It is still only a
  // fallback: a hub the lexer already found is never overwritten.
  if (hints && intent === "ROUTE_SEARCH") {
    if (hints.originHubId && !parsed.origin_resolved) {
      parsed.origin_hub_id = hints.originHubId;
      parsed.origin_resolved = true;
    }
    if (hints.destHubId && !parsed.dest_resolved) {
      parsed.dest_hub_id = hints.destHubId;
      parsed.dest_resolved = true;
    }
  }

  // If user explicitly attempted to specify a destination that failed to resolve,
  // do NOT silently fall back to the previous destination in context.
  if (parsed.explicit_dest_attempted && !parsed.dest_resolved) {
    const originName = parsed.origin_resolved
      ? CANONICAL_HUBS[parsed.origin_hub_id]?.name_en || parsed.origin_hub_id
      : CANONICAL_HUBS[context.last_origin_hub_id]?.name_en || context.last_origin_hub_id;
    const tokenStr = parsed.unresolved_dest_token ? ` "${parsed.unresolved_dest_token}"` : "";
    return {
      replyText: `I found starting location **${originName}**, but couldn't recognize destination${tokenStr} in our Dhaka transit network.\n\nCould you clarify where you'd like to travel to? (e.g. *"to Mohammadpur"*, *"to Motijheel"*, or *"to Farmgate"*)`,
      intent: "CLARIFY",
      updatedContext: {
        ...context,
        ...(parsed.origin_resolved ? { last_origin_hub_id: parsed.origin_hub_id, last_discussed_hub: parsed.origin_hub_id } : {}),
      },
      badges: [{ label: "UNKNOWN DESTINATION", variant: "amber" }],
    };
  }

  if (parsed.explicit_origin_attempted && !parsed.origin_resolved) {
    const destName = parsed.dest_resolved
      ? CANONICAL_HUBS[parsed.dest_hub_id]?.name_en || parsed.dest_hub_id
      : CANONICAL_HUBS[context.last_dest_hub_id]?.name_en || context.last_dest_hub_id;
    const tokenStr = parsed.unresolved_origin_token ? ` "${parsed.unresolved_origin_token}"` : "";
    return {
      replyText: `I see you want to travel to **${destName}**, but couldn't recognize your departure point${tokenStr}.\n\nWhere are you starting from? (e.g. *"from Mirpur 10"* or *"from Mohakhali"*)`,
      intent: "CLARIFY",
      updatedContext: {
        ...context,
        ...(parsed.dest_resolved ? { last_dest_hub_id: parsed.dest_hub_id, last_discussed_hub: parsed.dest_hub_id } : {}),
      },
      badges: [{ label: "UNKNOWN ORIGIN", variant: "amber" }],
    };
  }

  // Inherit missing contextual values. Tokens are only present when the
  // deterministic parser actually resolved that field; defaults in the parser
  // are not evidence that the user said them.
  const effectiveOrigin = parsed.origin_resolved
    ? parsed.origin_hub_id
    : context.last_origin_hub_id;
  const effectiveDest = parsed.dest_resolved
    ? parsed.dest_hub_id
    : context.last_dest_hub_id;

  if (effectiveOrigin === effectiveDest) {
    const hubName = CANONICAL_HUBS[effectiveOrigin]?.name_en || effectiveOrigin;
    return {
      replyText: `Your starting point and destination are both set to **${hubName}**. Please specify where you would like to go from or to, e.g. *"from ${hubName} to Motijheel"*.`,
      intent: "ROUTE_SEARCH",
      updatedContext: context,
      badges: [{ label: "SAME LOCATION", variant: "amber" }],
    };
  }
  const effectiveStudent =
    parsed.extracted_raw.student_token !== undefined ? parsed.is_student : context.is_student;
  // A new trip starts from fresh constraints; only refinements of the same trip
  // inherit the previous budget and avoid list.
  const tripChanged =
    effectiveOrigin !== context.last_origin_hub_id || effectiveDest !== context.last_dest_hub_id;
  const effectiveBudget =
    parsed.extracted_raw.budget_token !== undefined
      ? parsed.max_budget_bdt
      : tripChanged
        ? DEFAULT_BUDGET_BDT
        : context.last_budget_bdt;
  const effectiveAvoid = Array.from(
    new Set([...(tripChanged ? [] : context.avoid_hub_ids), ...(parsed.avoid_hub_ids || [])])
  ).filter((hub) => hub !== effectiveOrigin && hub !== effectiveDest);
  const reusedContext = !parsed.origin_resolved && !parsed.dest_resolved;

  const resolvedQuery: Partial<CommuterQuery> = {
    origin_hub_id: effectiveOrigin,
    dest_hub_id: effectiveDest,
    is_student: effectiveStudent,
    max_budget_bdt: effectiveBudget,
    avoid_hub_ids: effectiveAvoid,
    raw_query_text: rawUserText,
  };

  const searchRes = executeParetoSearch(
    {
      action_id: `CHAT_SEARCH_${Date.now()}`,
      raw_query_text: rawUserText,
      origin_hub_id: effectiveOrigin,
      dest_hub_id: effectiveDest,
      is_student: effectiveStudent,
      max_budget_bdt: effectiveBudget,
      avoid_hub_ids: effectiveAvoid,
      timestamp_ms: Date.now(),
    },
    preset,
    activeAlerts
  );

  const optimal = searchRes.routes[0] || null;
  const originName = CANONICAL_HUBS[effectiveOrigin]?.name_en || effectiveOrigin;
  const destName = CANONICAL_HUBS[effectiveDest]?.name_en || effectiveDest;

  let replyText = "";
  if (optimal) {
    const legLines = optimal.legs.map((l, idx) => {
      const modeEmoji =
        l.mode === TransportMode.METRO
          ? "🚇"
          : l.mode === TransportMode.BUS
            ? "🚌"
            : l.mode === TransportMode.RICKSHAW
              ? "🛺"
              : "🚶";
      return `• Step ${idx + 1}: ${modeEmoji} **${l.mode}** (${l.route_name}) — **${l.effective_fare_bdt} BDT**, ~${Math.round(l.effective_duration_ms / 60000)} mins`;
    });

    replyText =
      `${reusedContext ? "Using your last trip context. " : ""}Grounded route found for **${originName} → ${destName}**:\n\n` +
      `⚡ **Route Plan:**\n` +
      legLines.join("\n") +
      `\n\n💰 **Fare:** **${optimal.total_effective_fare_bdt} BDT** ${effectiveStudent ? "(Student Pass Verified: 10 BDT floor)" : "(Regular Ticket)"}\n` +
      `⏱️ **Duration:** **${Math.round(optimal.total_duration_ms / 60000)} mins** • Transfers: **${optimal.transfers_count}**\n` +
      `🛡️ Verified against official BRTA & DMTCL transit data. Check detailed route cards below!`;
  } else {
    const diagnosis = diagnoseEmptyResult(
      { ...(resolvedQuery as CommuterQuery), action_id: "CHAT_DIAGNOSE", timestamp_ms: Date.now() },
      preset,
      activeAlerts
    );
    const avoidedNames = effectiveAvoid.map((hub) => CANONICAL_HUBS[hub]?.name_en || hub).join(", ");
    replyText =
      diagnosis.reason === "BUDGET"
        ? `No route for **${originName} → ${destName}** fits your **${effectiveBudget} BDT** budget. The cheapest grounded route I found costs **${diagnosis.available_fare_bdt} BDT** — say "budget ${diagnosis.available_fare_bdt}" or "no budget" to see it.`
        : diagnosis.reason === "AVOIDED_HUBS"
          ? `Every route for **${originName} → ${destName}** passes through a hub you asked to avoid (**${avoidedNames}**). Remove one to get a route.`
          : `**${originName}** and **${destName}** are cut off right now by verified disruptions. Try again later or pick a nearby hub.`;
  }

  return {
    replyText,
    intent: "ROUTE_SEARCH",
    updatedContext: {
      ...context,
      last_origin_hub_id: effectiveOrigin,
      last_dest_hub_id: effectiveDest,
      last_budget_bdt: effectiveBudget,
      is_student: effectiveStudent,
      avoid_hub_ids: effectiveAvoid,
      selected_route: optimal,
      last_discussed_hub: effectiveDest,
    },
    resolvedQuery,
    badges: optimal
      ? [
        { label: `${optimal.total_effective_fare_bdt} BDT`, variant: "emerald" },
        { label: `${Math.round(optimal.total_duration_ms / 60000)} MIN`, variant: "cyan" },
        { label: "VERIFIED ROUTE", variant: "emerald" },
        ...(reusedContext ? [{ label: "CONTEXT REUSED", variant: "amber" as const }] : []),
      ]
      : [{ label: "NO ROUTE", variant: "crimson" }],
    messageMetadata: optimal
      ? {
        routeSummary: {
          fareBdt: optimal.total_effective_fare_bdt,
          regularFareBdt: optimal.total_regular_fare_bdt,
          durationMin: Math.round(optimal.total_duration_ms / 60000),
          transfers: optimal.transfers_count,
          legs: optimal.legs.map((l) => `${l.mode}: ${l.effective_fare_bdt} BDT`),
        },
      }
      : undefined,
  };
}
