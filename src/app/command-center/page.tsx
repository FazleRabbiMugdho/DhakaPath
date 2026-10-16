"use client";

// ==============================================================================
// src/app/command-center/page.tsx — WAVE 2 UNIFIED 4-ZONE COMMAND CENTER
// Assembles all four Wave 1 tracks into one 100vw×100vh synchronized viewport and
// wires the live deterministic route delegate (Track 1) into the shared store so
// every zone reacts in < 1ms. Zone 0 top bar + X-Ray drawer, Zone 1 commute, Zone
// 2 map + ROI ledger, Zone 3 trust/CMS. Responsive mobile tabs under 1024px.
// ==============================================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { registerRouteDelegate } from "@/contracts/adapter";
import { executeParetoSearch } from "@/engine/paretoRouter";
import { ScenarioInjectorBar } from "@/shell/ScenarioInjectorBar";
import { TopologicalMap } from "@/shell/TopologicalMap";
import { CounterfactualRoiLedger } from "@/shell/CounterfactualRoiLedger";
import { XRayMathDrawer } from "@/shell/XRayMathDrawer";
import { useScenarioInjector } from "@/shell/useScenarioInjector";
import { useTopologicalRoi } from "@/shell/useTopologicalRoi";
import { CommuteCommandPanel } from "@/features/feature-1-commute/CommuteCommandPanel";
import { TrustShieldAndCmsPanel } from "@/features/feature-3-trust-cms/TrustShieldAndCmsPanel";
import { PitchIntroOverlay } from "./PitchIntroOverlay";
import { ArrowLeft, Sparkles, UserRound, Map, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileTab = "commute" | "map" | "trust";

export default function CommandCenterPage() {
  const injector = useScenarioInjector();
  const roiState = useTopologicalRoi();
  const [pitchOpen, setPitchOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");

  // Wire the live Track 1 Pareto engine into the shared adapter (replaces the
  // deterministic mock route provider). Track 2 already self-registers alerts + pool.
  useEffect(() => {
    registerRouteDelegate(async (query, preset) => executeParetoSearch(query, preset).routes);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-y-auto lg:h-screen lg:overflow-hidden">
      {/* Zone 0 — Top Global Bar + pitch + back */}
      <div className="relative z-30 flex items-stretch">
        <ScenarioInjectorBar injector={injector} className="flex-1" />
        <div className="hidden items-center gap-2 border-b-[1.5px] border-[#1E293B] bg-[#0B111F]/85 px-3 backdrop-blur-md sm:flex">
          <button
            type="button"
            onClick={() => setPitchOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#06B6D4]/50 bg-[#083344]/50 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-[#67E8F9] transition-all hover:border-[#06B6D4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
          >
            <Sparkles className="h-3.5 w-3.5" /> Pitch Story
          </button>
          <Link
            href="/"
            className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-[#334155] bg-[#0F172A] text-[#94A3B8] transition-all hover:border-[#06B6D4]/60 hover:text-white"
            title="Back to DhakaPath home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="flex items-stretch gap-1 border-b border-[#1E293B] bg-[#0B111F]/80 p-1.5 lg:hidden">
        {(
          [
            { id: "commute" as const, label: "Commute", icon: <UserRound className="h-4 w-4" /> },
            { id: "map" as const, label: "Map + ROI", icon: <Map className="h-4 w-4" /> },
            { id: "trust" as const, label: "Trust", icon: <ShieldCheck className="h-4 w-4" /> },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMobileTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 font-sans text-[13px] font-semibold transition-all",
              mobileTab === t.id ? "bg-[#06B6D4] text-[#070B14]" : "text-[#94A3B8] hover:text-[#E2E8F0]"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Body — desktop 28/44/28, mobile single-tab */}
      <main className="grid flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[28fr_44fr_28fr]">
        {/* Zone 1 */}
        <section className={cn("min-h-0", mobileTab === "commute" ? "block" : "hidden", "lg:block")}>
          <CommuteCommandPanel className="h-full" />
        </section>

        {/* Zone 2 */}
        <section className={cn("relative grid min-h-0 gap-3 lg:grid-rows-[1.55fr_1fr]", mobileTab === "map" ? "grid" : "hidden", "lg:grid")}>
          <div className="relative min-h-[440px] lg:min-h-0">
            <TopologicalMap roiState={roiState} />
            <XRayMathDrawer open={injector.xrayOpen} onClose={() => injector.setXray(false)} roiState={roiState} />
          </div>
          <div className="min-h-[300px] lg:min-h-0">
            <CounterfactualRoiLedger roi={roiState.roi} />
          </div>
        </section>

        {/* Zone 3 */}
        <section className={cn("min-h-0", mobileTab === "trust" ? "block" : "hidden", "lg:block")}>
          <TrustShieldAndCmsPanel className="h-full" />
        </section>
      </main>

      <PitchIntroOverlay open={pitchOpen} onClose={() => setPitchOpen(false)} />
    </div>
  );
}
