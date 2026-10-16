"use client";

// Scenario simulator as a compact dropdown. A slim always-visible status row (speed, surge,
// engine latency) with a "Change" button that opens a popover to switch scenario and scrub the
// clock. Everything on every tab recomputes from this, so it sits above the tab content.

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, CloudRainWind, FastForward, Gauge, ShieldAlert, Sun, Zap } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { ScenarioPreset } from "@/contracts/schema";
import { Pill, Segmented } from "./kit";
import { cn } from "@/lib/utils";

const STEPS = [0, 15, 45, 90];

function presetMeta(preset: ScenarioPreset) {
  switch (preset) {
    case ScenarioPreset.PEAK_CRISIS_SURGE:
      return { icon: <CloudRainWind className="h-4 w-4" />, bn: "পিক সংকট", en: "Peak crisis", tone: "red" as const };
    case ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT:
      return { icon: <ShieldAlert className="h-4 w-4" />, bn: "ভুয়া ইনপুট পরীক্ষা", en: "Fake-input test", tone: "amber" as const };
    default:
      return { icon: <Sun className="h-4 w-4" />, bn: "স্বাভাবিক দিন", en: "Normal day", tone: "green" as const };
  }
}

export function ScenarioBar() {
  const { t, n } = useLang();
  const s = useDhakaPathStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const crisis = s.activePreset === ScenarioPreset.PEAK_CRISIS_SURGE;
  const meta = presetMeta(s.activePreset);
  const offsetMin = Math.round(s.simOffsetMs / 60000);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative z-30 rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-bold transition-colors",
            crisis ? "border-danger-line bg-danger-bg text-danger" : meta.tone === "amber" ? "border-warn-line bg-warn-bg text-warn" : "border-[#CDEBD7] bg-brand-soft text-brand-dark"
          )}
        >
          {meta.icon}
          {t("পরিস্থিতি", "Scenario")}: {t(meta.bn, meta.en)}
          {offsetMin > 0 && <span className="font-mono">· +{n(offsetMin)}m</span>}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>

        <Pill tone={crisis ? "red" : "green"} icon={<Gauge className="h-3.5 w-3.5" />}>
          {n(s.surfaceVelocityKmh.toFixed(1))} {t("কিমি/ঘ", "km/h")}
        </Pill>
        <Pill tone={s.surgeMultiplier > 1.01 ? "amber" : "gray"}>{t("সার্জ", "Surge")} ×{n(s.surgeMultiplier.toFixed(1))}</Pill>
        <Pill tone="green" icon={<Zap className="h-3.5 w-3.5" />}>{n(s.engineLatencyMs.toFixed(2))} ms</Pill>
        <span className="ml-auto hidden font-mono text-[11px] text-ink-faint lg:inline">Alt+1/2/3 · Alt+R · Ctrl+Shift+D</span>
      </div>

      {open && (
        <div className="absolute left-3 right-3 top-full z-40 mt-1 rounded-2xl border border-line bg-white p-4 shadow-lift sm:left-4 sm:right-auto sm:w-[420px]">
          <div className="text-[12px] font-bold uppercase tracking-wide text-ink-faint">{t("পরিস্থিতি বেছে নিন", "Choose scenario")}</div>
          <div className="mt-2 grid gap-1.5">
            {[ScenarioPreset.NORMAL_BASELINE, ScenarioPreset.PEAK_CRISIS_SURGE, ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT].map((pre, i) => {
              const m = presetMeta(pre);
              const active = s.activePreset === pre;
              return (
                <button
                  key={pre}
                  type="button"
                  onClick={() => { s.setScenarioPreset(pre); }}
                  className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[14px] font-semibold transition-colors", active ? "border-brand bg-brand-mint text-brand-dark" : "border-line hover:border-brand hover:bg-brand-mint")}
                >
                  <span className={cn("grid h-8 w-8 place-items-center rounded-lg", active ? "bg-brand text-white" : "bg-[#F1F5F2] text-ink-soft")}>{m.icon}</span>
                  {t(m.bn, m.en)}
                  <span className="ml-auto font-mono text-[11px] text-ink-faint">Alt+{i + 1}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-[12px] font-bold uppercase tracking-wide text-ink-faint">{t("টাইম-মেশিন", "Time machine")}</div>
          <Segmented<number>
            ariaLabel={t("সময়", "Time offset")}
            className="mt-2 w-full"
            value={offsetMin}
            onChange={(m) => s.setSimOffsetMs(m * 60000)}
            options={STEPS.map((m) => ({ value: m, label: m === 0 ? <span className="inline-flex items-center gap-1"><FastForward className="h-3.5 w-3.5" />{t("এখন", "Now")}</span> : `+${n(m)}m` }))}
          />
        </div>
      )}
    </div>
  );
}
