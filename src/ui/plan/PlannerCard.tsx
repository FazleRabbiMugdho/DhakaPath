"use client";

// Trip search: type or speak a Banglish / Bangla / English request, tap an example, and tune the
// three human-in-the-loop preferences. Shows exactly what the parser understood, and the
// "fake route blocked" notice when a prompt asks for a route that does not exist.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Footprints, GraduationCap, Mic, MicOff, Search, ShieldAlert, Waves } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { Btn, Card, Pill, Toggle, inputCls } from "../kit";
import { hubName } from "../labels";

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

const EXAMPLES: ReadonlyArray<{ id: string; bn: string; en: string; text: string; trap?: boolean }> = [
  {
    id: "student",
    bn: "মিরপুর ১০ → মতিঝিল · স্টুডেন্ট · ৫৫৳",
    en: "Mirpur 10 → Motijheel · student · 55 BDT",
    text: "bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?",
  },
  {
    id: "fast",
    bn: "উত্তরা → শাহবাগ · দ্রুততম",
    en: "Uttara → Shahbagh · fastest",
    text: "Uttara theke Shahbagh fastest route, regular ticket, avoid Mohakhali",
  },
  {
    id: "trap",
    bn: "ফাঁদ: আন্ডারগ্রাউন্ড ফেরি",
    en: "Trap: underground ferry",
    text: "Trick LLM: Underground Ferry from Badda to Dhanmondi for 5 BDT",
    trap: true,
  },
];

export function PlannerCard() {
  const { lang, t, n } = useLang();
  const store = useDhakaPathStore();
  const { activeQuery, lastParse, interception, isParsing, options } = store;
  const [text, setText] = useState<string>(activeQuery.raw_query_text);
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);

  const run = useCallback((q: string, o = options) => void store.search(q, o), [store, options]);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => RecognitionLike;
      webkitSpeechRecognition?: new () => RecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "bn-BD";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const spoken = last?.[0]?.transcript ?? "";
      if (spoken) {
        setText(spoken);
        run(spoken);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setVoiceOk(true);
    // the recogniser is created once; `run` is read through the latest closure on each result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  const setOpt = (patch: Partial<typeof options>, reparse: boolean) => {
    const next = { ...options, ...patch };
    if (reparse) run(text, next);
    else store.setOptions(next);
  };

  const source = lastParse?.parser_source ?? "DETERMINISTIC_REGEX_FALLBACK";
  const latency = lastParse?.parse_latency_ms;

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[24px] font-extrabold leading-tight tracking-tight text-ink">{t("কোথায় যাবেন?", "Where to?")}</h2>
      <p className="mt-1 text-[14px] text-ink-soft">{t("বাংলা, বাংলিশ বা English-এ লিখুন বা বলুন।", "Type or speak in Bangla, Banglish or English.")}</p>

      <div className="mt-4 flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run(text);
            }
          }}
          rows={3}
          aria-label={t("যাত্রার অনুরোধ", "Trip request")}
          placeholder={t("যেমন: মিরপুর ১০ থেকে মতিঝিল, স্টুডেন্ট পাস আছে, ৫৫ টাকার মধ্যে", "e.g. Mirpur 10 to Motijheel, student pass, within 55 taka")}
          className={`${inputCls} resize-none`}
        />
        {voiceOk && (
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={listening}
            aria-label={listening ? t("শোনা বন্ধ করুন", "Stop listening") : t("বলে খুঁজুন", "Speak your request")}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-[1.5px] transition-colors ${listening ? "border-brand bg-brand text-white" : "border-line bg-white text-brand-dark hover:border-brand"}`}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
      </div>

      <Btn className="mt-3 w-full" busy={isParsing} icon={<Search className="h-5 w-5" />} onClick={() => run(text)}>
        {t("যাচাই করা রুট খুঁজুন", "Find verified routes")}
      </Btn>

      <div className="mt-4">
        <div className="text-[12px] font-bold uppercase tracking-wide text-ink-faint">{t("এক ট্যাপে চেষ্টা করুন", "Try one tap")}</div>
        <div className="mt-2 flex flex-col gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                setText(ex.text);
                run(ex.text);
              }}
              className={`flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-[14px] font-semibold transition-colors ${ex.trap ? "border-danger-line bg-danger-bg text-danger hover:bg-[#FEE2E2]" : "border-line bg-white text-ink hover:border-brand hover:bg-brand-mint"}`}
            >
              <span>{lang === "bn" ? ex.bn : ex.en}</span>
              {ex.trap && <ShieldAlert className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Toggle
          checked={options.forceStudent}
          onChange={(v) => setOpt({ forceStudent: v }, true)}
          icon={<GraduationCap className="h-5 w-5" />}
          label={t("স্টুডেন্ট পাস", "Student pass")}
          hint={t("বাসে ৫০% ছাড় (সর্বনিম্ন ১০৳); মেট্রোতে ছাড় নেই", "50% off buses (10 BDT floor); none on the metro")}
        />
        <Toggle
          checked={options.bypassFlooded}
          onChange={(v) => setOpt({ bypassFlooded: v }, true)}
          icon={<Waves className="h-5 w-5" />}
          label={t("বন্ধ এলাকা এড়িয়ে চলুন", "Avoid flooded / blocked hubs")}
          hint={t("নিশ্চিত অ্যালার্ট থাকা হাব বাদ দিন", "Skips hubs with a confirmed alert")}
        />
        <Toggle
          checked={options.allowWalkBridge}
          onChange={(v) => setOpt({ allowWalkBridge: v }, false)}
          icon={<Footprints className="h-5 w-5" />}
          label={t("হাঁটা-সেতু ব্যবহার (৪.৫ কিমি/ঘ)", "Allow walk-bridge (4.5 km/h)")}
          hint={t("যানবাহনের পথ বন্ধ হলে বিনা ভাড়ায় হেঁটে পার", "Free detour on foot when every vehicle route is cut")}
        />
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="text-[12px] font-bold uppercase tracking-wide text-ink-faint">{t("আমি যা বুঝেছি", "What I understood")}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill tone="green">{t("শুরু", "From")}: {hubName(activeQuery.origin_hub_id, lang)}</Pill>
          <Pill tone="green">{t("গন্তব্য", "To")}: {hubName(activeQuery.dest_hub_id, lang)}</Pill>
          <Pill tone={activeQuery.is_student ? "green" : "gray"}>
            {activeQuery.is_student ? t("স্টুডেন্ট: হ্যাঁ (১০৳ ফ্লোর)", "Student: yes (10 BDT floor)") : t("স্টুডেন্ট: না", "Student: no")}
          </Pill>
          <Pill tone="blue">{activeQuery.max_budget_bdt > 0 ? `${t("বাজেট ≤", "Budget ≤")} ${n(activeQuery.max_budget_bdt)} ৳` : t("বাজেট: সীমাহীন", "Budget: any")}</Pill>
          {activeQuery.avoid_hub_ids.length > 0 && (
            <Pill tone="amber">
              {t("এড়াবো", "Avoid")}: {activeQuery.avoid_hub_ids.map((h) => hubName(h, lang)).join(", ")}
            </Pill>
          )}
          <Pill tone="gray" title={source}>
            {source === "LLM_SANDBOX" ? "AI parser" : t("লোকাল লেক্সার", "Local lexer")}
            {latency !== undefined && ` · ${n(latency.toFixed(1))} ms`}
          </Pill>
        </div>
      </div>

      {interception && (
        <div role="alert" className="mt-4 rounded-2xl border border-danger-line bg-danger-bg p-4">
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-danger">
            <ShieldAlert className="h-5 w-5" />
            {t("এই রুট আসলে নেই — আটকানো হয়েছে", "That route does not exist — blocked")}
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
            {t("AI যা বানিয়ে বলেছিল তা আমাদের গ্রাফে নেই, তাই দেখানো হয়নি।", "The AI invented a leg that is not in our verified graph, so it was never shown.")}
          </p>
          <p className="mt-2 break-words font-mono text-[11.5px] text-danger">GROUNDING_INTERCEPTED · {interception.reason}</p>
          <p className="break-words font-mono text-[11px] text-ink-faint">{interception.clause}</p>
        </div>
      )}
    </Card>
  );
}
