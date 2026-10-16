"use client";

// Counterfactual ROI: what DhakaPath's verified route saves against the naive surface route
// through the disrupted corridor. Three headline numbers + the latency benchmark.

import React, { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock, ShieldOff, Timer, Wallet } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { clampFinite } from "@/lib/utils";
import { Card } from "../kit";

function Ticker({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const reduce = useReducedMotion();
  const { n } = useLang();
  const [shown, setShown] = useState<number>(value);
  const from = useRef<number>(value);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      from.current = value;
      return;
    }
    const c = animate(from.current, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1], onUpdate: setShown });
    from.current = value;
    return () => c.stop();
  }, [value, reduce]);
  return (
    <span className="tabular-nums">
      {prefix}
      {n(shown.toFixed(decimals))}
      {suffix}
    </span>
  );
}

export function RoiStrip() {
  const { t, n } = useLang();
  const { roi, selectedRoute } = useDhakaPathStore();
  const minutes = clampFinite(Math.round(roi.time_saved_ms / 60000), 0, 600, 0);
  const bdt = clampFinite(roi.cost_saved_bdt, 0, 500, 0);
  const risk = clampFinite(roi.risk_reduction_pct, 0, 100, 0);
  const shadowMin = Math.round(roi.shadow_duration_ms / 60000);
  const optimalMin = selectedRoute ? Math.round(selectedRoute.total_duration_ms / 60000) : 0;

  const cards = [
    {
      key: "t",
      icon: <Clock className="h-4 w-4" />,
      label: t("সময় সাশ্রয়", "Time saved"),
      value: <Ticker value={minutes} prefix="+" suffix={t(" মিনিট", " min")} />,
      sub: selectedRoute ? `${n(shadowMin)} ${t("মি. জ্যামে আটকে → ", "min stuck in traffic → ")}${n(optimalMin)} ${t("মি. DhakaPath", "min DhakaPath")}` : "—",
    },
    {
      key: "b",
      icon: <Wallet className="h-4 w-4" />,
      label: t("ভাড়া সাশ্রয়", "Fare saved"),
      value: <Ticker value={bdt} prefix="+" suffix=" ৳" />,
      sub: selectedRoute ? `${n(roi.shadow_fare_bdt)} ৳ ${t("সাধারণ/সার্জ → ", "regular/surge → ")}${n(selectedRoute.total_effective_fare_bdt)} ৳` : "—",
    },
    {
      key: "r",
      icon: <ShieldOff className="h-4 w-4" />,
      label: t("ব্লকেড ঝুঁকি কমেছে", "Blockade risk cut"),
      value: <Ticker value={risk} decimals={1} prefix="−" suffix="%" />,
      sub: t("বন্ধ রাস্তা এড়িয়ে যাচাইকৃত রুট", "verified route avoids closed corridors"),
    },
  ];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-extrabold text-ink">{t("DhakaPath না থাকলে কী হতো?", "What if you had not used DhakaPath?")}</h2>
        <span className="rounded-full border border-line bg-brand-mint px-2.5 py-1 text-[11px] font-bold text-ink-soft">[SIMULATED DEMO BENCHMARK]</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.key} className="rounded-2xl border border-line bg-brand-mint p-4">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-brand-dark">
              {c.icon}
              {c.label}
            </div>
            <div className="mt-1 text-[32px] font-extrabold leading-none tracking-tight text-brand">{c.value}</div>
            <p className="mt-2 text-[12.5px] leading-snug text-ink-soft">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-soft">
        <Timer className="h-4 w-4 text-brand" />
        <span>
          {n((roi.benchmark_manual_latency_ms / 60000).toFixed(1))} {t("মিনিট (ফেসবুক গ্রুপে খোঁজা)", "min (checking Facebook groups)")}
        </span>
        <ArrowRight className="h-4 w-4 text-brand" />
        <span className="font-extrabold text-brand-dark">
          {n((roi.benchmark_engine_latency_ms / 1000).toFixed(1))} {t("সেকেন্ড DhakaPath", "sec DhakaPath")}
        </span>
      </div>
    </Card>
  );
}
