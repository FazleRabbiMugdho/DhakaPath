"use client";

// ==============================================================================
// src/ui/plan/AskDhakaPathChat.tsx
// Conversational Commute Assistant ("Ask DhakaPath")
// Multi-turn context memory, deterministic/AI grounding, street reports, and audits
// ==============================================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { Btn, Pill, inputCls, Tone } from "../kit";
import {
  ChatMessage,
  ConversationContext,
} from "@/features/feature-1-commute/conversationEngine";
import { HubId, IncidentType } from "@/contracts/schema";

const SUGGESTIONS = [
  {
    id: "route",
    labelBn: "মিরপুর ১০ → মতিঝিল (৫৫৳, ছাত্র)",
    labelEn: "Mirpur 10 → Motijheel (55 BDT, student)",
    text: "Mirpur 10 theke Motijheel jabo, student id ache, 55 BDT",
  },
  {
    id: "detour",
    labelBn: "ফার্মগেট এড়িয়ে বিকল্প পথ?",
    labelEn: "What if Farmgate floods? avoid Farmgate",
    text: "What if Farmgate floods? avoid Farmgate",
  },
  {
    id: "audit",
    labelBn: "এই ভাড়ার হিসাব কী?",
    labelEn: "Why that fare?",
    text: "Why that fare?",
  },
  {
    id: "report",
    labelBn: "শাহবাগে পানি উঠেছে (রিপোর্ট)",
    labelEn: "Shahbagh e pani uthse (report)",
    text: "Shahbagh e pani uthse",
  },
  {
    id: "trust",
    labelBn: "রিপোর্টটি কি যাচাই করা?",
    labelEn: "Can I trust that report?",
    text: "Can I trust that report?",
  },
];

function badgeVariantToTone(variant?: string): Tone {
  switch (variant) {
    case "emerald":
      return "green";
    case "amber":
      return "amber";
    case "crimson":
      return "red";
    case "cyan":
      return "blue";
    default:
      return "gray";
  }
}

// Strip LaTeX math ($...$, \(...\), \ge, \le) down to plain readable text.
function deLatex(s: string): string {
  return s
    .replace(/\$\$?([^$]*)\$\$?/g, "$1")
    .replace(/\\\(([^)]*)\\\)/g, "$1")
    .replace(/\\\[([^\]]*)\\\]/g, "$1")
    .replace(/\\ge\b/g, "≥")
    .replace(/\\le\b/g, "≤")
    .replace(/\\times\b/g, "×")
    .replace(/\\[a-zA-Z]+\b/g, "")
    .replace(/[_^]\{([^}]*)\}/g, "$1")
    .replace(/[_^]([A-Za-z0-9])/g, "$1");
}

function FormattedChatText({ text }: { text: string }) {
  const lines = deLatex(text).split("\n");
  return (
    <div className="space-y-1 text-[13.5px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;
        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");
        const clean = isBullet ? trimmed.replace(/^[•-]\s*/, "") : trimmed;
        const parts = clean.split(/(\*\*.*?\*\*|`.*?`)/g);

        const content = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-extrabold text-ink">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                key={pIdx}
                className="rounded bg-brand-soft px-1 py-0.5 font-mono text-[11.5px] text-brand-dark"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={pIdx}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="font-bold text-brand">•</span>
              <span className="flex-1">{content}</span>
            </div>
          );
        }
        return <p key={idx}>{content}</p>;
      })}
    </div>
  );
}

export function AskDhakaPathChat({ fill = false }: { fill?: boolean }) {
  const { lang, t } = useLang();
  const store = useDhakaPathStore();
  const { activeQuery, activePreset, alerts, reportIncident, search, options } = store;

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [context, setContext] = useState<ConversationContext>({
    last_origin_hub_id: activeQuery.origin_hub_id,
    last_dest_hub_id: activeQuery.dest_hub_id,
    last_budget_bdt: activeQuery.max_budget_bdt,
    is_student: activeQuery.is_student,
    avoid_hub_ids: [...activeQuery.avoid_hub_ids],
    selected_route: store.selectedRoute || null,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      sender: "assistant",
      text:
        lang === "bn"
          ? "আসসালামু আলাইকুম! আমি DhakaPath সহকারী। কোথায় যাবেন বলুন — যেমন: `মিরপুর ১০ থেকে মতিঝিল, স্টুডেন্ট আইডি আছে`। আমি বিকল্প রুট, ভাড়ার অডিট বা রাস্তার রিপোর্ট দিতে পারি।"
          : "Assalamu Alaikum! I am your DhakaPath commute assistant. Tell me where you want to go — e.g. `Mirpur 10 to Motijheel, 55 BDT`. I remember context, suggest detours, audit fares, and record alerts.",
      timestamp_ms: Date.now(),
      badges: [{ label: "Context Memory", variant: "emerald" }, { label: "SAT Verified", variant: "cyan" }],
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const sendTurn = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || busy) return;

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp_ms: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setBusy(true);

      try {
        const res = await fetch("/api/track-3-commute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "chat_turn",
            query: trimmed,
            context,
            preset: activePreset,
            activeAlerts: alerts,
          }),
        });

        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();

        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          sender: "assistant",
          text: data.replyText || "Route processed.",
          timestamp_ms: Date.now(),
          intent: data.intent,
          badges: data.badges,
          metadata: data.messageMetadata,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.updatedContext) {
          setContext(data.updatedContext);
        }

        // If turn yielded a new street report, commit to store
        if (data.newAlertToSubmit) {
          const alert = data.newAlertToSubmit;
          reportIncident(alert.hub_id as HubId, alert.incident_type as IncidentType, 2, 0.4);
        }

        // If turn was a route search or detour, trigger main engine search
        if (data.intent === "ROUTE_SEARCH" || data.intent === "ALTERNATIVE_ROUTE") {
          await search(trimmed, options);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: "assistant",
            text:
              lang === "bn"
                ? "দুঃখিত, অনুরোধ প্রক্রিয়া করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
                : "Apologies, could not process that request right now. Please try again.",
            timestamp_ms: Date.now(),
            badges: [{ label: "Error", variant: "crimson" }],
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, context, activePreset, alerts, reportIncident, search, options, lang]
  );

  const resetThread = () => {
    setContext({
      last_origin_hub_id: HubId.H_MIRPUR10,
      last_dest_hub_id: HubId.H_MOTIJHEEL,
      last_budget_bdt: 55,
      is_student: true,
      avoid_hub_ids: [],
      selected_route: null,
    });
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: "assistant",
        text:
          lang === "bn"
            ? "স্মৃতি মুছে নতুন করে শুরু করা হয়েছে। পরবর্তী যাত্রা কোথায়?"
            : "Conversation memory cleared. Where would you like to travel next?",
        timestamp_ms: Date.now(),
        badges: [{ label: "Fresh Context", variant: "emerald" }],
      },
    ]);
  };

  return (
    <div className={`flex flex-col overflow-hidden bg-white ${fill ? "h-full" : "rounded-2xl border border-line shadow-sm"}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-brand-soft/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[13px] font-extrabold text-ink leading-none">
              {t("Ask DhakaPath সহকারী", "Ask DhakaPath Assistant")}
            </div>
            <div className="text-[11px] text-ink-soft">
              {t("English · বাংলা · বাংলিশ (স্মৃতিযুক্ত)", "English · Bangla · Banglish (multi-turn)")}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={resetThread}
          title={t("স্মৃতি মুছুন", "Clear memory")}
          className="rounded-lg p-1.5 text-ink-soft hover:bg-white hover:text-ink transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message List */}
      <div
        ref={scrollRef}
        className={`overflow-y-auto p-4 space-y-3 bg-[#FBFDFB] ${fill ? "flex-1 min-h-0" : "h-80"}`}
        aria-live="polite"
      >
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  isUser ? "bg-ink text-white" : "bg-brand text-white shadow-xs"
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </span>

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                  isUser
                    ? "bg-brand text-white rounded-tr-xs"
                    : "bg-white border border-line text-ink rounded-tl-xs"
                }`}
              >
                {isUser ? (
                  <p className="text-[13.5px] font-medium leading-relaxed">{m.text}</p>
                ) : (
                  <>
                    <FormattedChatText text={m.text} />
                    {m.badges && m.badges.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.badges.map((b, i) => (
                          <Pill key={i} tone={badgeVariantToTone(b.variant)}>
                            {b.label}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-ink-soft text-[12px] pl-8">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
            <span>{t("হিসাব করা হচ্ছে...", "Auditing route graph...")}</span>
          </div>
        )}
      </div>

      {/* Quick Contextual Suggestions */}
      <div className="border-t border-line bg-white px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => sendTurn(s.text)}
              className="shrink-0 rounded-full border border-line bg-[#F8FAF9] px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft hover:border-brand hover:bg-brand-soft hover:text-brand-dark transition-colors disabled:opacity-50"
            >
              {lang === "bn" ? s.labelBn : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendTurn(input);
        }}
        className="flex items-center gap-2 border-t border-line bg-white p-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(
            "যেমন: 'Farmgate avoid korle koto time lagbe?' বা 'Why that fare?'",
            "e.g. 'What if Farmgate floods?' or 'Why that fare?'"
          )}
          aria-label={t("সহকারীকে মেসেজ লিখুন", "Message commute assistant")}
          className={`${inputCls} text-[13px] py-2`}
        />
        <Btn
          type="submit"
          size="sm"
          busy={busy}
          disabled={!input.trim()}
          icon={<Send className="h-3.5 w-3.5" />}
          className="shrink-0"
        >
          {t("পাঠান", "Send")}
        </Btn>
      </form>
    </div>
  );
}
