"use client";

// Scenario simulator: switch the city between a normal day, a peak monsoon crisis and a fake-input
// stress test, and scrub the clock forward to watch crowd alerts decay. Everything on every tab
// recomputes from this, so it is shared above the tab content.

import React from "react";
import { CloudRainWind, FastForward, Gauge, ShieldAlert, Sun, Zap } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { ScenarioPreset } from "@/contracts/schema";
import { Card, Pill, Segmented } from "./kit";

const STEPS = [0, 15, 45, 90];

export function ScenarioBar() {
  const { t, n } = useLang();
  const s = useDhakaPathStore();
  const crisis = s.activePreset === ScenarioPreset.PEAK_CRISIS_SURGE;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="text-[12px] font-bold uppercase tracking-wide text-ink-faint">{t("পরিস্থিতি সিমুলেশন", "Scenario simulator")}</div>
          <Segmented<ScenarioPreset>
            ariaLabel={t("পরিস্থিতি", "Scenario")}
            value={s.activePreset}
            onChange={s.setScenarioPreset}
            options={[
              { value: ScenarioPreset.NORMAL_BASELINE, title: "Alt+1", label: <span className="inline-flex items-center gap-1.5"><Sun className="h-4 w-4" />{t("স্বাভাবিক দিন", "Normal day")}</span> },
              { value: ScenarioPreset.PEAK_CRISIS_SURGE, title: "Alt+2", label: <span className="inline-flex items-center gap-1.5"><CloudRainWind className="h-4 w-4" />{t("পিক সংকট (বৃষ্টি + জ্যাম)", "Peak crisis (rain + gridlock)")}</span> },
              { value: ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT, title: "Alt+3", label: <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" />{t("ভুয়া ইনপুট পরীক্ষা", "Fake-input test")}</span> },
            ]}
          />
        </div>

        <div className="space-y-2">
          <div className="text-[12px] font-bold uppercase tracking-wide text-ink-faint">{t("টাইম-মেশিন: সময় এগিয়ে দেখুন", "Time machine: fast-forward")}</div>
          <Segmented<number>
            ariaLabel={t("সময়", "Time offset")}
            value={Math.round(s.simOffsetMs / 60000)}
            onChange={(m) => s.setSimOffsetMs(m * 60000)}
            options={STEPS.map((m) => ({ value: m, label: m === 0 ? <span className="inline-flex items-center gap-1.5"><FastForward className="h-4 w-4" />{t("এখন", "Now")}</span> : `+${n(m)} ${t("মি.", "min")}` }))}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Pill tone={crisis ? "red" : "green"} icon={<Gauge className="h-3.5 w-3.5" />}>
          {t("গাড়ির গড় গতি", "Avg road speed")} {n(s.surfaceVelocityKmh.toFixed(1))} {t("কিমি/ঘ", "km/h")}
        </Pill>
        <Pill tone={s.surgeMultiplier > 1.01 ? "amber" : "gray"}>
          {t("রিকশা সার্জ", "Rickshaw surge")} ×{n(s.surgeMultiplier.toFixed(1))}
        </Pill>
        <Pill tone="green" icon={<Zap className="h-3.5 w-3.5" />}>
          {t("রুট হিসাব", "Route search")} {n(s.engineLatencyMs.toFixed(2))} ms
        </Pill>
        <span className="ml-auto hidden font-mono text-[11px] text-ink-faint md:inline">Alt+1/2/3 · Alt+R · Ctrl+Shift+D</span>
      </div>
    </Card>
  );
}
