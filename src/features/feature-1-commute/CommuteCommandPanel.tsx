"use client";

// ==============================================================================
// src/features/feature-1-commute/CommuteCommandPanel.tsx
// Zone 1 Left Column UI — Banglish NL Parser, SAT Subgraph Verifier, Pareto Cards
// INIF 2026 DhakaPath — Track 3 (Dev 3: AI, NLP & Vision Engineer)
// ==============================================================================

import React, { useState } from "react";
import {
  Mic,
  Search,
  Users,
  Download,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Train,
  Bus,
  Footprints,
  Car,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  HubId,
  TransportMode,
  ValidationStatus,
  ActionLockState,
} from "../../contracts/schema";
import { DualCodedStatusPill } from "../../components/ui/DualCodedStatusPill";
import { IdempotentActionButton } from "../../components/ui/IdempotentActionButton";
import { useCommuteCommand } from "./useCommuteCommand";

export function CommuteCommandPanel({ className }: { className?: string }) {
  const {
    inputText,
    setInputText,
    isParsing,
    isListening,
    speechActiveTranscript,
    toggleVoiceInput,
    forceStudentPass,
    setForceStudentPass,
    bypassFloodedHubs,
    setBypassFloodedHubs,
    unlockWalkBridge,
    setUnlockWalkBridge,
    parseResult,
    activeInterceptionAlert,
    poolLocked,
    handleTogglePool,
    isOfflineDrawerOpen,
    setIsOfflineDrawerOpen,
    exportedCanvasPng,
    exportedPngKb,
    isSpeakingOffline,
    handleExportOfflineBriefing,
    speakPhoneticTranscript,
    handleExecuteSearch,
    handleChipClick,
    demoChips,
    store,
  } = useCommuteCommand();

  const [expandedRouteId, setExpandedRouteId] = useState<string>(
    store.selectedRouteId || "route_optimal_mirpur_motijheel_pstar"
  );

  const selectedRoute =
    store.paretoRoutes.find((r) => r.route_id === store.selectedRouteId) ||
    store.paretoRoutes[0];

  const getLegIcon = (mode: TransportMode) => {
    switch (mode) {
      case TransportMode.METRO:
        return <Train className="w-4 h-4 text-[#06B6D4]" />;
      case TransportMode.BUS:
        return <Bus className="w-4 h-4 text-[#10B981]" />;
      case TransportMode.WALK:
        return <Footprints className="w-4 h-4 text-[#94A3B8]" />;
      case TransportMode.RICKSHAW:
      case TransportMode.LEGUNA:
        return <Car className="w-4 h-4 text-[#F59E0B]" />;
      default:
        return <ArrowRight className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-[#070B14] border-r border-[#1E293B] text-[#F8FAFC] select-none overflow-hidden",
        className
      )}
    >
      {/* ---------------------------------------------------------------------- */}
      {/* SECTION 1: TOP 30% — BANGLISH INPUT, 1-TAP JUDGE CHIPS & X-RAY PILLS   */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-4 border-b border-[#1E293B] bg-[#0A0F1D]/90 backdrop-blur-md space-y-3 shrink-0">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-pulse" />
            <span className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
              Commute Command // Zone 1
            </span>
          </div>

          {/* Parser Source & Latency Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[10px] font-mono">
            <span className={parseResult.parser_source === "LLM_SANDBOX" ? "text-[#06B6D4]" : "text-[#10B981]"}>
              {parseResult.parser_source === "LLM_SANDBOX" ? "LLM_SANDBOX (Groq/Gemini)" : "LOCAL PHONETIC LEXER"}
            </span>
            <span className="text-[#64748B]">•</span>
            <span suppressHydrationWarning className="text-[#CBD5E1] tabular-nums">{parseResult.parse_latency_ms}ms</span>
          </div>
        </div>

        {/* Banglish & Bangla Voice/Text Input Box */}
        <div className="relative group">
          <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] focus-within:border-[#06B6D4] rounded-lg p-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.05)]">
            <Search className="w-4 h-4 text-[#64748B] ml-1 shrink-0" />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleExecuteSearch();
              }}
              placeholder="e.g. Mirpur 10 theke Motijheel jabo, student id ache, 55 BDT..."
              className="w-full bg-transparent text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none font-sans"
            />

            {/* Mic Button for Web Speech Recognition */}
            <button
              onClick={toggleVoiceInput}
              title={isListening ? "Listening... Click to stop" : "Speak Banglish / Bangla query"}
              className={cn(
                "p-1.5 rounded transition-all shrink-0",
                isListening
                  ? "bg-[#F43F5E] text-white animate-pulse"
                  : "bg-[#1E293B] text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#334155]"
              )}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Search Execute Button */}
            <IdempotentActionButton
              onAction={() => handleExecuteSearch()}
              lockState={isParsing ? ActionLockState.PROCESSING : ActionLockState.IDLE}
              variant="primary"
              className="py-1 px-3 text-xs whitespace-nowrap shrink-0"
            >
              {isParsing ? "Verifying..." : "Detour"}
            </IdempotentActionButton>
          </div>

          {/* Active Voice Transcript Indicator */}
          {speechActiveTranscript && (
            <div className="absolute left-0 right-0 -bottom-6 text-[11px] font-mono text-[#06B6D4] bg-[#0A0F1D] px-2 py-0.5 rounded border border-[#06B6D4]/30 z-10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-ping" />
              <span>Hearing: {speechActiveTranscript}</span>
            </div>
          )}
        </div>

        {/* 1-Tap Human-in-the-Loop Override Toggles */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
          {/* Toggle 1: Force Student Pass */}
          <button
            onClick={() => {
              const next = !forceStudentPass;
              setForceStudentPass(next);
              store.updateCommuterQuery({ is_student: next });
            }}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-all shrink-0",
              forceStudentPass
                ? "bg-[#064E3B]/70 border-[#10B981] text-[#6EE7B7]"
                : "bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:border-[#64748B]"
            )}
          >
            <span>Force Student:</span>
            <span className="font-bold">{forceStudentPass ? "ON" : "OFF"}</span>
          </button>

          {/* Toggle 2: Bypass Flooded Hubs */}
          <button
            onClick={() => {
              const next = !bypassFloodedHubs;
              setBypassFloodedHubs(next);
              store.updateCommuterQuery({
                avoid_hub_ids: next ? [HubId.H_FARMGATE] : [],
              });
            }}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-all shrink-0",
              bypassFloodedHubs
                ? "bg-[#78350F]/70 border-[#F59E0B] text-[#FDE68A]"
                : "bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:border-[#64748B]"
            )}
          >
            <span>Bypass Floods:</span>
            <span className="font-bold">{bypassFloodedHubs ? "ACTIVE" : "OFF"}</span>
          </button>

          {/* Toggle 3: Unlock Walk Bridge */}
          <button
            onClick={() => setUnlockWalkBridge(!unlockWalkBridge)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-all shrink-0",
              unlockWalkBridge
                ? "bg-[#1E293B] border-[#06B6D4] text-[#67E8F9]"
                : "bg-[#0F172A] border-[#334155] text-[#94A3B8]"
            )}
          >
            <span>Walk-Bridge (4.5 km/h):</span>
            <span className="font-bold">{unlockWalkBridge ? "UNLOCKED" : "LOCKED"}</span>
          </button>
        </div>

        {/* 3 One-Tap Demo Query Chips */}
        <div className="space-y-1.5 pt-0.5">
          <div className="text-[10px] font-mono uppercase text-[#64748B] flex items-center justify-between">
            <span>One-Tap Judge Presets (Click to Replay):</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {demoChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip)}
                className={cn(
                  "w-full text-left p-2 rounded border transition-all flex items-start gap-2 text-xs",
                  chip.isAdversarial
                    ? "bg-[#4C0519]/40 border-[#F43F5E]/60 hover:border-[#F43F5E] text-[#FECDD3]"
                    : "bg-[#0F172A]/80 border-[#1E293B] hover:border-[#06B6D4]/60 text-[#CBD5E1]"
                )}
              >
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 mt-0.5",
                    chip.isAdversarial
                      ? "bg-[#E11D48] text-white"
                      : "bg-[#0284C7] text-white"
                  )}
                >
                  {chip.badge}
                </span>
                <span className="line-clamp-1 italic text-[11px] font-sans">
                  &ldquo;{chip.queryText}&rdquo;
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Extracted Constraints Pill Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
          <div className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[#94A3B8]">
            Origin: <span className="text-[#06B6D4] font-bold">{parseResult.origin_hub_id}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[#94A3B8]">
            Dest: <span className="text-[#06B6D4] font-bold">{parseResult.dest_hub_id}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[#94A3B8]">
            Student:{" "}
            <span className={parseResult.is_student ? "text-[#10B981] font-bold" : "text-[#64748B]"}>
              {parseResult.is_student ? "YES (10 BDT Floor)" : "NO"}
            </span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[#94A3B8]">
            Budget: <span className="text-[#F59E0B] font-bold tabular-nums">&le; {parseResult.max_budget_bdt} BDT</span>
          </div>
          {parseResult.avoid_hub_ids.length > 0 && (
            <div className="px-2 py-0.5 rounded bg-[#78350F]/40 border border-[#F59E0B] text-[#FDE68A]">
              Avoid: {parseResult.avoid_hub_ids.join(", ")}
            </div>
          )}
        </div>

        {/* Adversarial Hallucination Interception Alert Banner */}
        {activeInterceptionAlert && (
          <div className="p-2.5 rounded-lg bg-[#4C0519] border border-[#F43F5E] text-[#FECDD3] text-xs space-y-1 animate-pulse">
            <div className="flex items-center gap-1.5 font-mono font-bold text-[#FDA4AF]">
              <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
              <span>GROUNDING INTERCEPTED // V(P) = 0</span>
            </div>
            <p className="text-[11px] font-mono leading-relaxed text-[#FFE4E6]">
              {activeInterceptionAlert.reason}
            </p>
            <div className="text-[10px] font-mono text-[#F43F5E] bg-[#1E1B4B]/80 px-2 py-1 rounded">
              Clause: {activeInterceptionAlert.clause}
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* SECTION 2: BOTTOM 70% — RANKED PARETO MULTI-LEG ROUTE CARDS            */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-[#94A3B8]">
            Ranked Non-Dominated Pareto Detours (G_0 Grounded)
          </span>
          <span className="text-[10px] font-mono text-[#64748B]">
            {store.paretoRoutes.length} Frontier Options
          </span>
        </div>

        {/* Render Pareto Route Cards */}
        {store.paretoRoutes.map((route, idx) => {
          const isSelected = store.selectedRouteId === route.route_id;
          const isExpanded = expandedRouteId === route.route_id;

          let badgeTitle = "Optimal Balanced P*";
          if (idx === 1) {
            badgeTitle = "Lowest BDT (Budget Detour)";
          } else if (idx === 2) {
            badgeTitle = "Fastest Grade-Separated";
          }

          return (
            <div
              key={route.route_id}
              onClick={() => {
                store.selectRoute(route.route_id);
                setExpandedRouteId(route.route_id);
              }}
              className={cn(
                "rounded-xl border transition-all cursor-pointer overflow-hidden",
                isSelected
                  ? "bg-[#0F172A] border-[#06B6D4] shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-[#06B6D4]/50"
                  : "bg-[#0F172A]/60 border-[#1E293B] hover:border-[#334155]"
              )}
            >
              {/* Card Header Strip */}
              <div className="p-3 bg-[#131D31] border-b border-[#1E293B] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1E293B] text-[11px] font-mono font-bold flex items-center justify-center text-[#06B6D4]">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#E2E8F0]">
                    {badgeTitle}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DualCodedStatusPill
                    status={ValidationStatus.GRAPH_GROUNDED}
                    label="V(P*)=1"
                    size="sm"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRouteId(isExpanded ? "" : route.route_id);
                    }}
                    className="text-[#94A3B8] hover:text-[#F8FAFC]"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Card Hero Fare & Latency Summary */}
              <div className="p-3.5 space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-[#10B981] tabular-nums">
                        {route.total_effective_fare_bdt}
                      </span>
                      <span className="text-sm font-mono text-[#6EE7B7]">BDT</span>
                      {route.total_regular_fare_bdt > route.total_effective_fare_bdt && (
                        <span className="text-xs font-mono text-[#64748B] line-through tabular-nums">
                          {route.total_regular_fare_bdt} BDT Reg
                        </span>
                      )}
                    </div>
                    {route.total_regular_fare_bdt > route.total_effective_fare_bdt && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#10B981] bg-[#064E3B]/60 rounded">
                        SAVE {route.total_regular_fare_bdt - route.total_effective_fare_bdt} BDT (Student Pass)
                      </span>
                    )}
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="flex items-center gap-1 text-sm font-mono text-[#F8FAFC]">
                      <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span className="font-bold tabular-nums">
                        {Math.round(route.total_duration_ms / 60000)} mins
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#94A3B8]">
                      {route.transfers_count} {route.transfers_count === 1 ? "Transfer" : "Transfers"}
                    </div>
                  </div>
                </div>

                {/* Expanded Multi-Leg Timeline */}
                {isExpanded && (
                  <div className="pt-2 border-t border-[#1E293B] space-y-2.5">
                    <div className="text-[10px] font-mono uppercase text-[#64748B]">
                      Ground Truth Leg Trajectory ({route.legs.length} Legs):
                    </div>

                    <div className="space-y-2">
                      {route.legs.map((leg, legIdx) => (
                        <div
                          key={leg.edge_id + legIdx}
                          className="p-2 rounded bg-[#070B14] border border-[#1E293B] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {getLegIcon(leg.mode)}
                              <span className="font-mono font-bold text-[#E2E8F0]">
                                Leg {legIdx + 1}: {leg.mode}
                              </span>
                              <span className="text-[#64748B] text-[11px]">
                                ({Math.round(leg.effective_duration_ms / 60000)}m)
                              </span>
                            </div>

                            <div className="font-mono text-right">
                              <span className="font-bold text-[#10B981] tabular-nums">
                                {leg.effective_fare_bdt} BDT
                              </span>
                              {leg.regular_fare_bdt > leg.effective_fare_bdt && (
                                <span className="text-[10px] text-[#64748B] line-through ml-1.5">
                                  {leg.regular_fare_bdt}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-[11px] text-[#94A3B8] flex items-center justify-between">
                            <span>{leg.route_name}</span>
                            <span className="text-[10px] font-mono text-[#06B6D4]">
                              {leg.origin_hub_id} &rarr; {leg.dest_hub_id}
                            </span>
                          </div>

                          <div className="text-[10px] font-sans text-[#64748B] flex items-center gap-1">
                            <span>Board:</span>
                            <span className="text-[#94A3B8] italic">{leg.boarding_landmark}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Embedded Action Loop Footer */}
                    <div className="pt-3 border-t border-[#1E293B] space-y-2">
                      {/* Action 1: Hub Ride-Share Pool Split CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const lastLeg = route.legs[route.legs.length - 1];
                          handleTogglePool(lastLeg?.edge_id || "E_RICK_MOTIJHEEL_LASTMILE");
                        }}
                        className={cn(
                          "w-full py-2 px-3 rounded-lg font-mono text-xs font-bold border transition-all flex items-center justify-between",
                          poolLocked
                            ? "bg-[#064E3B] border-[#10B981] text-[#A7F3D0]"
                            : "bg-[#0F172A] border-[#06B6D4] text-[#67E8F9] hover:bg-[#06B6D4]/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#06B6D4]" />
                          <span>
                            {poolLocked
                              ? "Pool Locked (3/4 Active • 30 BDT Saved)"
                              : "Join Hub Pool (2/4 -> 3/4) • Lock 30 BDT Split"}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase underline">
                          {poolLocked ? "Leave / Solo (90 BDT)" : "1-Tap Join"}
                        </span>
                      </button>

                      {/* Action 2: Export Offline Card (<45 KB) + Audio CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportOfflineBriefing(route);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-xs font-mono font-medium text-[#F8FAFC] flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-[#06B6D4]" />
                          <span>Export Offline Card + Audio</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-[#070B14] text-[10px] text-[#10B981] font-bold">
                          &lt; 45 KB PNG
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* OFFLINE BRIEFING CANVAS & AUDIO DRAWER                                 */}
      {/* ---------------------------------------------------------------------- */}
      {isOfflineDrawerOpen && selectedRoute && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#06B6D4] rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#06B6D4]" />
                <span className="font-mono font-bold text-sm text-[#F8FAFC]">
                  Offline Crisis Boarding Card & Voiceover
                </span>
              </div>
              <button
                onClick={() => setIsOfflineDrawerOpen(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Preview Image */}
            {exportedCanvasPng && (
              <div className="space-y-2">
                <div className="rounded-lg overflow-hidden border border-[#334155] bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exportedCanvasPng}
                    alt="Offline DhakaPath Boarding Card"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                  <span>Optimized Standalone PNG: {exportedPngKb} KB</span>
                  <a
                    href={exportedCanvasPng}
                    download={`dhakapath-ticket-${Date.now()}.png`}
                    className="text-[#06B6D4] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Ticket
                  </a>
                </div>
              </div>
            )}

            {/* Audio Voiceover Section */}
            <div className="p-3 rounded-lg bg-[#070B14] border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#E2E8F0]">
                  High-Contrast Audio Voiceover (Web Speech API)
                </span>
                <button
                  onClick={() => speakPhoneticTranscript(selectedRoute)}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-[#06B6D4] text-[#083344] font-mono text-xs font-bold hover:bg-[#22D3EE]"
                >
                  {isSpeakingOffline ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeakingOffline ? "Stop Speech" : "Play Voiceover"}</span>
                </button>
              </div>
              <p className="text-[11px] font-sans text-[#94A3B8] italic">
                &ldquo;DhakaPath Verified Route. From Mirpur 10 to Motijheel. Total fare 48 Taka. Leg 1: Footbridge. Leg 2: Metro MRT 6. Leg 3: Bihanga Bus. Grounding verified.&rdquo;
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsOfflineDrawerOpen(false)}
                className="px-4 py-1.5 rounded bg-[#1E293B] text-xs font-mono text-[#E2E8F0] hover:bg-[#334155]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
