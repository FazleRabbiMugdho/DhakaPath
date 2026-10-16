"use client";

// ==============================================================================
// src/shell/CounterfactualRoiLedger.tsx — ZONE 2 BOTTOM (Feature 4)
// Side-by-side Traditional Manual Baseline vs. DhakaPath Optimal Engine, with 3
// oversized hero delta tickers and the empirical latency benchmark badge.
// ==============================================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cn, clampFinite } from "@/lib/utils";
import type { CounterfactualRoiMetrics } from "@/contracts/schema";
import { SCENE_ART, SceneArt } from "./transitArt";
import { Clock, Wallet, ShieldOff, Timer, UserRound, Cpu, ArrowRight } from "lucide-react";

interface CounterfactualRoiLedgerProps {
  roi: CounterfactualRoiMetrics;
  className?: string;
}

/** Tabular count-up that settles on the exact value; static under reduced-motion. */
function Ticker({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState<number>(reduce ? value : 0);
  const prev = useRef<number>(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span className="tabular-nums">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function CounterfactualRoiLedger({ roi, className }: CounterfactualRoiLedgerProps) {
  const savedMin = useMemo(() => clampFinite(Math.round(roi.time_saved_ms / 60000), 0, 600, 0), [roi.time_saved_ms]);
  const savedBdt = useMemo(() => clampFinite(roi.cost_saved_bdt, 0, 500, 0), [roi.cost_saved_bdt]);
  const riskPct = useMemo(() => clampFinite(roi.risk_reduction_pct, 0, 99.9, 0), [roi.risk_reduction_pct]);
  const shadowMin = Math.round(roi.shadow_duration_ms / 60000);
  const optimalMin = Math.round((roi.shadow_duration_ms - roi.time_saved_ms) / 60000);
  const optimalBdt = roi.shadow_fare_bdt - roi.cost_saved_bdt;
  const manualSec = (roi.benchmark_manual_latency_ms / 1000).toFixed(0);
  const manualMin = (roi.benchmark_manual_latency_ms / 60000).toFixed(1);
  const engineSec = (roi.benchmark_engine_latency_ms / 1000).toFixed(1);

  const cards = [
    {
      key: "time",
      icon: <Clock className="h-4 w-4" />,
      label: "Commute Time Saved",
      ticker: <Ticker value={savedMin} prefix="+" suffix="m" />,
      sub: `${shadowMin} min flooded surface stall → ${optimalMin} min DhakaPath detour`,
      accent: "#10B981",
      glow: "rgba(16,185,129,0.22)",
    },
    {
      key: "fare",
      icon: <Wallet className="h-4 w-4" />,
      label: "Fare Saved (BDT)",
      ticker: <Ticker value={savedBdt} prefix="+" suffix=" ৳" />,
      sub: `${roi.shadow_fare_bdt} BDT regular/surge → ${optimalBdt} BDT student multi-leg`,
      accent: "#06B6D4",
      glow: "rgba(6,182,212,0.22)",
    },
    {
      key: "risk",
      icon: <ShieldOff className="h-4 w-4" />,
      label: "Blockade Risk Cut",
      ticker: <Ticker value={riskPct} decimals={1} prefix="−" suffix="%" />,
      sub: "Severed surface corridors avoided via grounded Pareto detour",
      accent: "#F43F5E",
      glow: "rgba(244,63,94,0.2)",
    },
  ];

  return (
    <section
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border-[1.5px] border-[#334155] bg-[#0F172A]",
        "shadow-[0_0_40px_-20px_rgba(6,182,212,0.4)]",
        className
      )}
    >
      {/* Faint duotone street scene for identity, kept well below text contrast */}
      <SceneArt src={SCENE_ART.streetStrip} alt="" imgClassName="opacity-[0.14]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/85 to-[#0F172A]/40" />

      <div className="relative flex items-center justify-between gap-2 border-b border-[#1E293B] px-3 py-2">
        <h2 className="font-sans text-sm font-bold tracking-tight text-[#E2E8F0]">
          Counterfactual Shadow ROI — <span className="text-[#64748B]">P_shadow</span> vs{" "}
          <span className="text-[#67E8F9]">P*</span>
        </h2>
        <div className="flex items-center gap-1.5 rounded-full border border-[#1E293B] bg-[#0B111F]/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#64748B]">
          <UserRound className="h-3 w-3" /> Manual FB check
          <ArrowRight className="h-3 w-3 text-[#06B6D4]" />
          <Cpu className="h-3 w-3 text-[#06B6D4]" /> DhakaPath
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-2.5 p-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.key}
              className="relative overflow-hidden rounded-2xl border-[1.5px] border-[#334155] bg-[#1E293B] p-3"
              style={{ borderTopColor: "rgba(255,255,255,0.15)", boxShadow: `0 0 28px -14px ${c.glow}` }}
            >
              <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide" style={{ color: c.accent }}>
                {c.icon}
                <span>{c.label}</span>
              </div>
              <div className="mt-1 font-mono text-[32px] font-extrabold leading-none text-white sm:text-[34px]" style={{ color: c.accent }}>
                {c.ticker}
              </div>
              <p className="mt-1.5 font-sans text-[12px] leading-snug text-[#CBD5E1]">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Latency benchmark badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1E293B] bg-[#0B111F]/70 px-3 py-2">
          <div className="flex items-center gap-2 font-mono text-[12px] tabular-nums text-[#CBD5E1]">
            <Timer className="h-4 w-4 text-[#06B6D4]" />
            <span className="text-[#94A3B8]">{manualMin} min ({manualSec}s) manual FB check</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span className="font-bold text-[#6EE7B7]">{engineSec} sec DhakaPath engine</span>
          </div>
          <span className="rounded-full border border-[#1E293B] bg-[#070B14]/60 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
            [Simulated Demo Benchmark]
          </span>
        </div>
      </div>
    </section>
  );
}
