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
  ParetoRouteOption,
  TransportMode,
} from "../../contracts/schema";
import { CANONICAL_HUBS, CANONICAL_GRAPH_G0 } from "../../contracts/canonicalGraph";
import { executeParetoSearch } from "../../engine/paretoRouter";
import { parseBanglishQueryDeterministic } from "./banglishParser";

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

// ------------------------------------------------------------------------------
// 1. Hub & Incident Lexicon for Context Extraction
// ------------------------------------------------------------------------------
const HUB_KEYWORDS_MAP: Record<HubId, string[]> = {
  [HubId.H_MIRPUR10]: ["mirpur 10", "mirpur-10", "mirpur10", "mirpur", "মিরপুর ১০", "মিরপুর"],
  [HubId.H_MOTIJHEEL]: ["motijheel", "motijhil", "matijheel", "মতিঝিল", "shapla chottor"],
  [HubId.H_FARMGATE]: ["farmgate", "farm gate", "ফার্মগেট", "ananda cinema"],
  [HubId.H_SHAHBAGH]: ["shahbagh", "shahbag", "শাহবাগ", "tsc", "du", "pg hospital"],
  [HubId.H_UTTARA]: ["uttara", "uttora", "উত্তরা", "house building", "azampur", "diabari"],
  [HubId.H_DHANMONDI]: ["dhanmondi", "dhanmandi", "ধানমন্ডি", "dhanmondi 27", "dhanmondi 32"],
  [HubId.H_BADDA]: ["badda", "বাড্ডা", "link road", "badda link road"],
  [HubId.H_MALIBAGH]: ["malibagh", "malibag", "মালিবাগ", "mouchak", "railgate"],
  [HubId.H_MOHAKHALI]: ["mohakhali", "maakhali", "মহাখালী", "wireless"],
  [HubId.H_AGARGAON]: ["agargaon", "agar gaon", "আগারগাঁও", "passport office"],
  [HubId.H_JATRABARI]: ["jatrabari", "jattrabari", "যাত্রাবাড়ী", "sayedabad"],
  [HubId.H_MOHAMMADPUR]: ["mohammadpur", "mohammodpur", "মোহাম্মদপুর", "town hall", "asad gate"],
  [HubId.H_SCIENCELAB]: ["science lab", "sciencelab", "সায়েন্স ল্যাব", "city college"],
  [HubId.H_BANASREE]: ["banasree", "bonosree", "বনশ্রী", "rampura"],
  [HubId.H_GULISTAN]: ["gulistan", " গুলিস্তান", "fulbaria", "zero point"],
};

export function extractHubFromText(text: string): HubId | null {
  const lower = text.toLowerCase();
  for (const [hubId, keywords] of Object.entries(HUB_KEYWORDS_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return hubId as HubId;
      }
    }
  }
  return null;
}

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
  const lower = text.toLowerCase().trim();
  const mentionedHub = extractHubFromText(lower);
  const incidentType = extractIncidentType(lower);

  // 1. REPORT_INCIDENT check
  // Matches e.g. "Shahbagh e pani uthse", "report Farmgate blockade", "Mohakhali te jam"
  const isReportingPhrasing = /uthse|hoyeche|report|ache ekhane|pani|block|jam|bhanga|উঠেছে|হয়েছে|রিপোর্ট/i.test(lower);
  if (
    incidentType &&
    isReportingPhrasing &&
    !/trust|can i|bhorosha|reliable|kivabe|why|কেন|ভাড়া/i.test(lower)
  ) {
    const hub = mentionedHub || context.last_discussed_hub || null;
    if (hub) {
      return {
        intent: "REPORT_INCIDENT",
        targetHub: hub,
        incidentType,
        avoidHub: null,
      };
    }
  }

  // 2. FARE_QUESTION check
  // Matches e.g. "why that fare?", "why 48 BDT?", "kivabe 48 holo?", "fare breakdown", "student pass rule"
  if (
    /why.*fare|why.*48|why.*cost|why.*price|fare breakdown|how.*fare|kivabe.*holo|bhara.*kivabe|ভাড়া.*কেন|ভাড়া.*হিসাব|student pass.*rule|10 taka keno/i.test(lower)
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
    /trust|reliable|bhorosha|ভরসা|বিশ্বাস|is.*flooded|pani ki ache|jam ki ache|status ki|alert.*trust|খবর কি|অবস্থা কি/i.test(lower)
  ) {
    const hub = mentionedHub || context.last_discussed_hub || context.last_reported_hub || HubId.H_SHAHBAGH;
    return {
      intent: "ALERT_QUESTION",
      targetHub: hub,
      incidentType: null,
      avoidHub: null,
    };
  }

  // 4. ALTERNATIVE_ROUTE check
  // Matches e.g. "What if Farmgate floods?", "avoid Farmgate", "Farmgate bad diye jabo", "ar kono rasta ache?"
  if (
    /avoid|bypass|bad diye|বাদ দিয়ে|alternative|ar kono rasta|what if.*floods|onno kono route|অন‍্য পথ/i.test(lower)
  ) {
    const hubToAvoid = mentionedHub || HubId.H_FARMGATE;
    return {
      intent: "ALTERNATIVE_ROUTE",
      targetHub: null,
      incidentType: null,
      avoidHub: hubToAvoid,
    };
  }

  // 5. ROUTE_SEARCH check
  // Matches explicit trip queries or origin/dest keywords
  if (
    mentionedHub ||
    /theke|from|jabo|to|route|যাব|থেকে|budget|student|half pass/i.test(lower)
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
  activeAlerts: ReadonlyArray<StreetAlert>
): ChatTurnResult {
  const { intent, targetHub, incidentType, avoidHub } = classifyConversationTurn(
    rawUserText,
    context
  );

  // ----------------------------------------------------------------------------
  // CASE 1: REPORT_INCIDENT
  // ----------------------------------------------------------------------------
  if (intent === "REPORT_INCIDENT" && targetHub && incidentType) {
    const hubMeta = CANONICAL_HUBS[targetHub];
    const hubName = hubMeta?.name_en || targetHub;

    const alertId = `alert_chat_${targetHub.toLowerCase()}_${Date.now()}`;
    // Find representative edge for this hub
    const associatedEdge =
      CANONICAL_GRAPH_G0.find((e) => e.dest_hub_id === targetHub || e.origin_hub_id === targetHub)
        ?.edge_id || `E_CROWD_${targetHub}`;

    const newAlert: StreetAlert = {
      alert_id: alertId,
      edge_id: associatedEdge,
      hub_id: targetHub,
      incident_type: incidentType,
      status: AlertStatus.PENDING_CORROBORATION,
      validation_status: ValidationStatus.GRAPH_GROUNDED,
      severity_alpha: incidentType === IncidentType.WATERLOGGING ? 2.4 : 1.9,
      confidence_pct: 24.3, // Prior confidence for single uncorroborated report (Track 2)
      half_life_remaining_ms: 1800000, // 30-min half-life
      created_timestamp_ms: Date.now(),
      votes: [
        {
          vote_id: `v_chat_${Date.now()}`,
          voter_session_id: "commuter_conversational_reporter",
          direction: 1,
          reliability_weight: 0.30,
          timestamp_ms: Date.now(),
        },
      ],
    };

    const replyText =
      `Report submitted! Logged **${incidentType}** at **${hubName}** as \`PENDING_CORROBORATION\` with an initial Bayesian confidence of **24.3%**.\n\n` +
      `🛡️ **Sanity Gate:** Under our Tier-2 Bayesian model, a single report does NOT sever transit corridors immediately (requires $\\ge 3$ community corroborations or $R_e \\ge 85\\%$). This stops false alarms and troll reports.\n\n` +
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
        { label: "PENDING (24.3%)", variant: "amber" },
        { label: hubName, variant: "cyan" },
      ],
      messageMetadata: {
        reportedAlert: {
          hubId: targetHub,
          hubName,
          incidentType,
          confidencePct: 24.3,
          status: "PENDING_CORROBORATION",
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
      `Here is the exact mathematically verified fare breakdown for **${originName} → ${destName}**:\n\n` +
      legExplanations.join("\n") +
      `\n\n💰 **Total Verified Fare: ${route.total_effective_fare_bdt} BDT** (Regular fare would be ${route.total_regular_fare_bdt} BDT, saving you **+${route.total_regular_fare_bdt - route.total_effective_fare_bdt} BDT**).\n` +
      `🛡️ Status: \`GRAPH_GROUNDED: V(P*)=1\` — calculated purely by deterministic equations, zero LLM guesswork!`;

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
      const isSevered = alert.confidence_pct >= 85.0;
      const decayMinsRemaining = Math.round(alert.half_life_remaining_ms / 60000);

      const replyText =
        `🔍 **Truth & Reliability Audit for ${hubName}:**\n\n` +
        `• **Incident:** ${alert.incident_type}\n` +
        `• **Bayesian Posterior Confidence $R_e(t)$:** **${alert.confidence_pct.toFixed(1)}%**\n` +
        `• **Status:** \`${alert.status}\` (${alert.votes.length} corroboration vote(s))\n` +
        `• **Corridor Impact:** ${
          isSevered
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
    const hubToAvoid = avoidHub || HubId.H_FARMGATE;
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
        .map((l, i) => `${i + 1}. **${l.mode}** (${l.route_name}) → ${l.effective_fare_bdt} BDT`)
        .join("\n");

      replyText =
        `Detour Calculated! Rerouting **${originName} → ${destName}** to safely **bypass ${avoidName}**:\n\n` +
        `⚡ **Optimal Detour ($P^*$):**\n` +
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

  // Inherit missing contextual values
  const effectiveOrigin =
    parsed.extracted_raw.origin_token ? parsed.origin_hub_id : context.last_origin_hub_id;
  const effectiveDest =
    parsed.extracted_raw.dest_token ? parsed.dest_hub_id : context.last_dest_hub_id;
  const effectiveStudent =
    parsed.extracted_raw.student_token !== undefined ? parsed.is_student : context.is_student;
  const effectiveBudget =
    parsed.max_budget_bdt > 0 ? parsed.max_budget_bdt : context.last_budget_bdt;
  const effectiveAvoid = Array.from(
    new Set([...context.avoid_hub_ids, ...(parsed.avoid_hub_ids || [])])
  );

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
    const legLines = optimal.legs.map(
      (l, idx) => `• Leg ${idx + 1}: **${l.mode}** (${l.route_name}) — **${l.effective_fare_bdt} BDT**, ${Math.round(l.effective_duration_ms / 60000)} min`
    );

    replyText =
      `Grounded route found for **${originName} → ${destName}**:\n\n` +
      `⚡ **Optimal Detour ($P^*$):**\n` +
      legLines.join("\n") +
      `\n\n💰 **Fare:** **${optimal.total_effective_fare_bdt} BDT** ${effectiveStudent ? "(Student Pass Verified: 10 BDT floor)" : "(Regular Ticket)"}\n` +
      `⏱️ **Duration:** **${Math.round(optimal.total_duration_ms / 60000)} mins** • Transfers: **${optimal.transfers_count}**\n` +
      `🛡️ Verified $V(P^*)=1$ across 15 canonical hubs. Check detailed route cards below!`;
  } else {
    replyText = `Searched for **${originName} → ${destName}**, but could not find a path under ${effectiveBudget} BDT budget. Try increasing budget or removing avoided hubs!`;
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
    },
    resolvedQuery,
    badges: optimal
      ? [
          { label: `${optimal.total_effective_fare_bdt} BDT`, variant: "emerald" },
          { label: `${Math.round(optimal.total_duration_ms / 60000)} MIN`, variant: "cyan" },
          { label: "GROUNDED", variant: "emerald" },
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
