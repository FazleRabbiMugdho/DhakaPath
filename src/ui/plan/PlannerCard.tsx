"use client";

// Trip search: type or speak a Banglish / Bangla / English request, tap an example, and tune the
// three human-in-the-loop preferences. Shows exactly what the parser understood, and the
// "fake route blocked" notice when a prompt asks for a route that does not exist.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Footprints, GraduationCap, Info, LocateFixed, MessageCircle, Mic, MicOff, Search, ShieldAlert, Waves, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { DEFAULT_BUDGET_BDT, HubId, ScenarioPreset } from "@/contracts/schema";
import { CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import { Btn, Card, Pill, Toggle, inputCls } from "../kit";
import { HUB_IDS, hubName } from "../labels";

function nearestHub(lat: number, lng: number): HubId {
  let best = HubId.H_MIRPUR10;
  let bestD = Infinity;
  for (const h of Object.values(CANONICAL_HUBS)) {
    const d = (h.lat - lat) ** 2 + (h.lng - lng) ** 2;
    if (d < bestD) { bestD = d; best = h.hub_id; }
  }
  return best;
}

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

const COMMUTE_EXAMPLES: ReadonlyArray<{ id: string; bn: string; en: string; text: string }> = [
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
];

const TRAP_EXAMPLE = {
  id: "trap",
  bn: "ফাঁদ: আন্ডারগ্রাউন্ড ফেরি",
  en: "Trap: underground ferry",
  text: "Trick LLM: Underground Ferry from Badda to Dhanmondi for 5 BDT",
};

/** Small clear button inside a constraint chip (24px target). */
function ChipRemove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-6 w-6 place-items-center rounded-full transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <X className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function LocateButton({ onLocate }: { onLocate: (hub: HubId) => void }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const locate = () => {
    if (!("geolocation" in navigator)) { setErr(t("লোকেশন সাপোর্ট নেই", "Location not supported")); return; }
    setBusy(true); setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setBusy(false); onLocate(nearestHub(pos.coords.latitude, pos.coords.longitude)); },
      () => { setBusy(false); setErr(t("লোকেশন পাওয়া যায়নি", "Could not get location")); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };
  return (
    <div className="flex items-center gap-1.5">
      {err && <span className="text-[10px] font-semibold text-warn">{err}</span>}
      <button
        type="button"
        onClick={locate}
        disabled={busy}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand-dark transition-colors disabled:opacity-60"
        title={t("আমার বর্তমান অবস্থান শনাক্ত করুন", "Detect current location")}
      >
        <LocateFixed className={`h-3 w-3 ${busy ? "animate-spin text-brand" : ""}`} />
        <span>{t("আমার অবস্থান", "My location")}</span>
      </button>
    </div>
  );
}

export function PlannerCard() {
  const { lang, t, n } = useLang();
  const store = useDhakaPathStore();
  const { activeQuery, lastParse, interception, searchNotice, isParsing, options, activePreset, disruptedHubIds, rankedRoutes, selectRoute, selectedRouteId, updateCommuterQuery } = store;
  const allAvoidedHubs = Array.from(new Set([
    ...activeQuery.avoid_hub_ids,
    ...(options.bypassFlooded ? disruptedHubIds.filter((h) => h !== activeQuery.origin_hub_id && h !== activeQuery.dest_hub_id) : []),
  ]));
  const [showTrap, setShowTrap] = useState(false);
  const isAdversarialMode = activePreset === ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT;
  const shouldShowTrap = isAdversarialMode || Boolean(interception) || showTrap;
  const [text, setText] = useState<string>(activeQuery.raw_query_text);
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);

  const run = useCallback((q: string, o = options) => void store.search(q, o), [store, options]);

  const handleFindRoutes = useCallback(() => {
    const originName = CANONICAL_HUBS[activeQuery.origin_hub_id]?.name_en ?? "";
    const destName = CANONICAL_HUBS[activeQuery.dest_hub_id]?.name_en ?? "";
    const defaultHubText = `${originName} to ${destName}`;
    if (text.trim() && text.trim().toLowerCase() !== defaultHubText.toLowerCase()) {
      run(text.trim(), options);
    } else {
      store.planDirect(activeQuery.origin_hub_id, activeQuery.dest_hub_id);
    }
  }, [activeQuery.origin_hub_id, activeQuery.dest_hub_id, text, options, run, store]);

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

  const source = lastParse?.parser_source ?? "DETERMINISTIC_REGEX_FALLBACK";
  const latency = lastParse?.parse_latency_ms;

  const selectedRoute = rankedRoutes.find(r => r.route.route_id === selectedRouteId)?.route;

  return (
    <Card className="p-5 sm:p-6 shadow-card border border-line">
      {/* 1. Header */}
      <div>
        <h2 className="text-[22px] font-black leading-tight tracking-tight text-ink">
          {t("কোথায় যাবেন?", "Where to?")}
        </h2>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {t("হাব বেছে নিন অথবা বাংলায়/বাংলিশে যাত্রার অনুরোধ লিখুন।", "Pick transit hubs or describe your commute in plain words.")}
        </p>
      </div>

      {/* 2. Professional Route Selector (Origin & Destination with vertical transit path) */}
      <div className="relative mt-4 rounded-2xl border border-line bg-[#FAFDFB] p-3 shadow-2xs">
        {/* Vertical Transit Connector line */}
        <div className="absolute left-[23px] top-[28px] bottom-[28px] w-[2px] border-l-2 border-dashed border-[#B8DBC4] pointer-events-none z-0" />

        {/* Origin Row */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 ring-2 ring-emerald-500/20">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between pr-1">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-ink-faint">
                {t("শুরু (Origin)", "From (Origin)")}
              </span>
              <LocateButton
                onLocate={(hub) => {
                  store.planDirect(hub, activeQuery.dest_hub_id);
                  setText(`${CANONICAL_HUBS[hub].name_en} to ${CANONICAL_HUBS[activeQuery.dest_hub_id].name_en}`);
                }}
              />
            </div>
            <select
              aria-label={t("শুরুর হাব", "Origin hub")}
              value={activeQuery.origin_hub_id}
              onChange={(e) => {
                const origin = e.target.value as HubId;
                store.planDirect(origin, activeQuery.dest_hub_id);
                setText(`${CANONICAL_HUBS[origin].name_en} to ${CANONICAL_HUBS[activeQuery.dest_hub_id].name_en}`);
              }}
              className="mt-0.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-[14px] font-bold text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none truncate shadow-2xs cursor-pointer"
            >
              {HUB_IDS.map((h) => (
                <option key={h} value={h} disabled={h === activeQuery.dest_hub_id}>
                  {hubName(h, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Floating Swap Button */}
        <div className="relative my-0.5 flex justify-end pr-2 z-20">
          <button
            type="button"
            aria-label={t("শুরু ও গন্তব্য অদল-বদল", "Swap origin and destination")}
            onClick={() => {
              store.planDirect(activeQuery.dest_hub_id, activeQuery.origin_hub_id);
              setText(`${CANONICAL_HUBS[activeQuery.dest_hub_id].name_en} to ${CANONICAL_HUBS[activeQuery.origin_hub_id].name_en}`);
            }}
            className="group -my-3 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-xs transition-all hover:scale-110 hover:border-brand hover:bg-brand-mint hover:text-brand-dark active:scale-95 cursor-pointer"
            title={t("অদল-বদল", "Swap start and destination")}
          >
            <ArrowLeftRight className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 duration-200" />
          </button>
        </div>

        {/* Destination Row */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 ring-2 ring-slate-400/20">
            <div className="h-2.5 w-2.5 rounded-sm bg-slate-800" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-ink-faint">
              {t("গন্তব্য (Destination)", "To (Destination)")}
            </span>
            <select
              aria-label={t("গন্তব্য হাব", "Destination hub")}
              value={activeQuery.dest_hub_id}
              onChange={(e) => {
                const dest = e.target.value as HubId;
                store.planDirect(activeQuery.origin_hub_id, dest);
                setText(`${CANONICAL_HUBS[activeQuery.origin_hub_id].name_en} to ${CANONICAL_HUBS[dest].name_en}`);
              }}
              className="mt-0.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-[14px] font-bold text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none truncate shadow-2xs cursor-pointer"
            >
              {HUB_IDS.map((h) => (
                <option key={h} value={h} disabled={h === activeQuery.origin_hub_id}>
                  {hubName(h, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Integrated Natural Language / Voice Prompt Bar */}
      <div className="relative mt-3 rounded-2xl border border-line bg-white p-2.5 shadow-2xs focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 transition-all">
        <div className="flex items-start gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFindRoutes();
              }
            }}
            rows={2}
            aria-label={t("যাত্রার অনুরোধ", "Trip request")}
            placeholder={t(
              "বাংলিশ বা বাংলায় লিখুন (যেমন: মিরপুর ১০ থেকে মতিঝিল, স্টুডেন্ট, ৫৫৳)",
              "Describe trip (e.g. Mirpur 10 to Motijheel, student pass, within 55 taka)"
            )}
            className="w-full resize-none border-0 bg-transparent p-1 text-[13px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {voiceOk && (
            <button
              type="button"
              onClick={toggleMic}
              aria-pressed={listening}
              aria-label={listening ? t("শোনা বন্ধ করুন", "Stop listening") : t("বলে খুঁজুন", "Speak request")}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-all cursor-pointer",
                listening
                  ? "bg-red-600 text-white animate-pulse shadow-xs"
                  : "text-slate-400 hover:text-brand hover:bg-brand-soft"
              )}
              title={t("ভয়েস ইনপুট", "Voice input")}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 4. Action Area: Commanding Primary Button & Balanced Secondary Button */}
      <div className="mt-3.5 space-y-2">
        <button
          type="button"
          disabled={isParsing}
          onClick={handleFindRoutes}
          className="group relative flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand font-extrabold text-white shadow-cta transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {isParsing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
          )}
          <span className="text-[14.5px] tracking-wide">
            {t("যাচাই করা রুট খুঁজুন", "Find Verified Routes")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-ask-dhakapath"))}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand/25 bg-[#F0FDF4] px-4 text-[13px] font-bold text-brand-dark transition-all hover:border-brand hover:bg-[#DCFCE7] active:scale-[0.99] shadow-2xs cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 text-brand" />
          <span>{t("সহকারীর সাথে চ্যাট করুন (Ask DhakaPath)", "Chat with AI Assistant (Ask DhakaPath)")}</span>
        </button>
      </div>

      {searchNotice && (
        <div role="status" className="mt-3 flex items-start gap-2 rounded-2xl border border-warn-line bg-warn-bg p-3 text-[12.5px] text-warn">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("জায়গার নাম বুঝতে পারিনি। উপর থেকে শুরু ও গন্তব্য বেছে নিন।", "Could not recognise those place names. Select start and destination above.")}</span>
        </div>
      )}

      {/* 5. Quick Route Presets */}
      <div className="mt-4 pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-faint">
            {t("এক ট্যাপে চেষ্টা করুন", "Quick route presets")}
          </span>
          {!isAdversarialMode && !interception && (
            <button
              type="button"
              onClick={() => setShowTrap((v) => !v)}
              className="text-[10.5px] font-bold text-ink-faint hover:text-danger transition-colors flex items-center gap-1 cursor-pointer"
              title={t("ভুয়া ইনপুট ফাঁদ পরীক্ষা", "Test adversarial trap")}
            >
              <ShieldAlert className="h-3 w-3" />
              <span>{showTrap ? t("লুকান", "Hide") : t("ফাঁদ পরীক্ষা", "Trap test")}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {COMMUTE_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                setText(ex.text);
                run(ex.text);
              }}
              className="group flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-semibold text-ink transition-all hover:border-brand/50 hover:bg-[#F7FCF9] hover:shadow-2xs active:scale-[0.99] cursor-pointer"
            >
              <span className="truncate pr-2">{lang === "bn" ? ex.bn : ex.en}</span>
              <span className="text-slate-300 group-hover:text-brand transition-colors text-[13px] font-bold">→</span>
            </button>
          ))}

          {shouldShowTrap && (
            <button
              type="button"
              onClick={() => {
                setText(TRAP_EXAMPLE.text);
                run(TRAP_EXAMPLE.text);
              }}
              className="flex items-center justify-between rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-left text-[13px] font-semibold text-danger transition-colors hover:bg-[#FEE2E2] cursor-pointer"
            >
              <span className="truncate pr-2">{lang === "bn" ? TRAP_EXAMPLE.bn : TRAP_EXAMPLE.en}</span>
              <ShieldAlert className="h-4 w-4 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* 6. Live Interactive Options Toggles */}
      <div className="mt-4 space-y-2">
        <Toggle
          checked={options.forceStudent}
          onChange={(v) => store.setOptions({ ...options, forceStudent: v })}
          icon={<GraduationCap className="h-5 w-5" />}
          label={t("স্টুডেন্ট পাস", "Student pass")}
          hint={t("বাসে ৫০% ছাড় (সর্বনিম্ন ১০৳); মেট্রোতে ছাড় নেই", "50% off buses (10 BDT floor); none on the metro")}
        />
        <Toggle
          checked={options.bypassFlooded}
          onChange={(v) => store.setOptions({ ...options, bypassFlooded: v })}
          icon={<Waves className="h-5 w-5" />}
          label={t("বন্ধ এলাকা এড়িয়ে চলুন", "Avoid flooded / blocked hubs")}
          hint={t("নিশ্চিত অ্যালার্ট থাকা হাব বাদ দিন", "Skips hubs with a confirmed alert")}
        />
        <Toggle
          checked={options.allowWalkBridge}
          onChange={(v) => store.setOptions({ ...options, allowWalkBridge: v })}
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
          {activeQuery.max_budget_bdt > 0 ? (
            <Pill tone="blue" className="pr-1">
              {t("বাজেট ≤", "Budget ≤")} {n(activeQuery.max_budget_bdt)} ৳
              <ChipRemove
                label={t("বাজেটের সীমা সরান", "Remove budget limit")}
                onClick={() => updateCommuterQuery({ max_budget_bdt: DEFAULT_BUDGET_BDT })}
              />
            </Pill>
          ) : (
            <Pill tone="blue">{t("বাজেট: সীমাহীন", "Budget: any")}</Pill>
          )}
          {activeQuery.avoid_hub_ids.map((hub) => (
            <Pill key={hub} tone="amber" className="pr-1">
              {t("এড়াবো", "Avoid")}: {hubName(hub, lang)}
              <ChipRemove
                label={t(`${hubName(hub, lang)} এড়ানো বাদ দিন`, `Stop avoiding ${hubName(hub, lang)}`)}
                onClick={() => updateCommuterQuery({ avoid_hub_ids: activeQuery.avoid_hub_ids.filter((h) => h !== hub) })}
              />
            </Pill>
          ))}
          {options.bypassFlooded && disruptedHubIds
            .filter((h) => h !== activeQuery.origin_hub_id && h !== activeQuery.dest_hub_id)
            .filter((h) => !activeQuery.avoid_hub_ids.includes(h))
            .map((hub) => (
              <Pill key={hub} tone="amber" className="pr-1 opacity-70">
                {t("এড়াবো (ফ্লাড)", "Avoid (flood)")}: {hubName(hub, lang)}
              </Pill>
            ))}
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