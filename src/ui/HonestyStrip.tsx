"use client";

// Persistent honesty badge required on every screen: all telemetry here is a benchmark replay.

import { useLang } from "@/lib/i18n";

export function HonestyStrip() {
  const { t } = useLang();
  return (
    <div
      role="note"
      className="sticky top-0 z-[60] flex h-8 shrink-0 items-center justify-center gap-2 bg-brand-deep px-3 text-center text-[11px] font-semibold tracking-wide text-[#B7D7C3] sm:text-xs"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" aria-hidden="true" />
      <span className="truncate">
        [SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY]
        <span className="hidden sm:inline"> · {t("ডেমো সিমুলেশন, প্রকৃত লাইভ ডেটা নয়", "demo simulation, not real live data")}</span>
      </span>
    </div>
  );
}
