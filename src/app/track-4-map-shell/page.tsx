"use client";

// ==============================================================================
// src/app/track-4-map-shell/page.tsx — TRACK 4 STANDALONE VERIFICATION HARNESS
// Exercises Zone 0 (Scenario Injector + hotkeys), Zone 2 (Dual-Layer Map + ROI
// Ledger), the X-Ray Math Drawer, and the Bonus 2 offline canvas/speech export
// in one tactical viewport — no integration dependencies on other tracks.
// ==============================================================================

import React, { useState } from "react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { ScenarioInjectorBar } from "@/shell/ScenarioInjectorBar";
import { TopologicalMap } from "@/shell/TopologicalMap";
import { CounterfactualRoiLedger } from "@/shell/CounterfactualRoiLedger";
import { XRayMathDrawer } from "@/shell/XRayMathDrawer";
import { useScenarioInjector } from "@/shell/useScenarioInjector";
import { useTopologicalRoi } from "@/shell/useTopologicalRoi";
import { exportOfflineBriefingCard, playOfflineVoiceBriefing, type OfflineBriefingResult } from "@/shell/offlineBriefingExporter";
import { SCENE_ART, SceneArt, TransitModeIcon, MODE_VISUALS } from "@/shell/transitArt";
import { TransportMode } from "@/contracts/schema";
import { IdempotentActionButton } from "@/components/ui/IdempotentActionButton";
import { DualCodedStatusPill } from "@/components/ui/DualCodedStatusPill";
import { Download, Volume2, FileImage, CheckCircle2, ListChecks } from "lucide-react";

export default function Track4MapShellPage() {
  const store = useDhakaPathStore();
  const injector = useScenarioInjector();
  const roiState = useTopologicalRoi();

  const [exportResult, setExportResult] = useState<OfflineBriefingResult | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  const handleExport = () => {
    if (!store.selectedRoute) return;
    const res = exportOfflineBriefingCard(store.selectedRoute, store.activeQuery, roiState.roi);
    setExportResult(res);
  };

  const handleSpeak = () => {
    if (!store.selectedRoute) return;
    setTranscript(playOfflineVoiceBriefing(store.selectedRoute, store.activeQuery));
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-y-auto lg:h-screen lg:overflow-hidden">
      {/* Zone 0 — Top Global Bar */}
      <ScenarioInjectorBar injector={injector} />

      {/* Body */}
      <main className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[1fr_320px]">
        {/* Zone 2 — Map (top) + ROI ledger (bottom) */}
        <div className="relative grid min-h-0 gap-3 lg:grid-rows-[1.55fr_1fr]">
          <div className="relative min-h-[440px] lg:min-h-0">
            <TopologicalMap roiState={roiState} />
            {/* X-Ray drawer overlays the map body */}
            <XRayMathDrawer open={injector.xrayOpen} onClose={() => injector.setXray(false)} roiState={roiState} />
          </div>
          <div className="min-h-[300px] lg:min-h-0">
            <CounterfactualRoiLedger roi={roiState.roi} />
          </div>
        </div>

        {/* Right rail — Offline export + mode legend + verification */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          {/* Offline briefing exporter */}
          <section className="relative overflow-hidden rounded-2xl border-[1.5px] border-[#334155] bg-[#0F172A] p-3" style={{ borderTopColor: "rgba(255,255,255,0.15)" }}>
            <SceneArt src={SCENE_ART.skylineHorizon} alt="" imgClassName="opacity-[0.16]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/70 to-[#0F172A]" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-[#06B6D4]" />
                <h2 className="font-sans text-sm font-bold text-[#E2E8F0]">Offline Survival Briefing</h2>
              </div>
              <p className="mt-1 font-sans text-[12px] leading-snug text-[#94A3B8]">
                Zero-bandwidth HTML5 canvas card (&lt;45 KB) + native Web Speech readout for 3G dropouts &amp; dead batteries.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <IdempotentActionButton variant="primary" icon={<Download className="h-3.5 w-3.5" />} onAction={handleExport} successLabel="PNG Downloaded" className="w-full">
                  Export Offline Card (&lt;45 KB)
                </IdempotentActionButton>
                <IdempotentActionButton variant="secondary" icon={<Volume2 className="h-3.5 w-3.5" />} onAction={handleSpeak} successLabel="Briefing Spoken" className="w-full">
                  Play Voice Briefing
                </IdempotentActionButton>
              </div>
              {exportResult && (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-[#064E3B] bg-[#064E3B]/40 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#6EE7B7]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {exportResult.filename} · {exportResult.fileSizeKb} KB
                </div>
              )}
              {transcript && (
                <p className="mt-2 rounded-xl border border-[#1E293B] bg-[#070B14]/60 p-2 font-mono text-[11px] leading-relaxed text-[#CBD5E1]">
                  {transcript}
                </p>
              )}
            </div>
          </section>

          {/* Mode legend with stickers */}
          <section className="rounded-2xl border-[1.5px] border-[#334155] bg-[#0F172A] p-3" style={{ borderTopColor: "rgba(255,255,255,0.15)" }}>
            <h2 className="mb-2 font-sans text-sm font-bold text-[#E2E8F0]">5 Transport Modes</h2>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.values(TransportMode).map((m) => (
                <div key={m} className="flex items-center gap-2.5 rounded-xl border border-[#1E293B] bg-[#1E293B]/50 p-1.5">
                  <TransitModeIcon mode={m} size={42} />
                  <div className="min-w-0">
                    <div className="font-sans text-[13px] font-semibold text-[#E2E8F0]">{MODE_VISUALS[m].label}</div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#94A3B8]">
                      <svg width="20" height="6" aria-hidden="true">
                        <line x1="1" y1="3" x2="19" y2="3" stroke={MODE_VISUALS[m].color} strokeWidth={Math.min(4, MODE_VISUALS[m].strokeWidth)} strokeDasharray={MODE_VISUALS[m].dashArray || undefined} strokeLinecap="round" />
                      </svg>
                      {m}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Verification checklist */}
          <section className="rounded-2xl border-[1.5px] border-[#334155] bg-[#0F172A] p-3" style={{ borderTopColor: "rgba(255,255,255,0.15)" }}>
            <div className="mb-2 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[#06B6D4]" />
              <h2 className="font-sans text-sm font-bold text-[#E2E8F0]">Track 4 Checklist</h2>
            </div>
            <ul className="space-y-1.5 font-sans text-[12px] text-[#CBD5E1]">
              {[
                "Alt+1/2/3 switch scenario; Alt+R resets G₀",
                "Peak Crisis flashes crimson severed rings on Farmgate + Malibagh",
                "Ctrl+Shift+D toggles the 3-line X-Ray drawer",
                "Offline card downloads a non-tainted PNG < 45 KB + speaks briefing",
                "[Tactical Grid] toggle survives OSM tile dropout",
              ].map((t) => (
                <li key={t} className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <DualCodedStatusPill status="SIMULATED_DEMO_TELEMETRY" label="SIMULATED DEMO TELEMETRY" size="sm" />
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
