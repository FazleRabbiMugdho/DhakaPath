"use client";

// ==============================================================================
// src/features/feature-3-trust-cms/TrustShieldAndCmsPanel.tsx
// WAVE 1 — TRACK 2: ZONE 3 TRUST SHIELD & BAYESIAN CMS PANEL
// Tactical Obsidian × Projector-Safe UI for Crowd Truth & Sanity Governance
// ==============================================================================

import React, { useState } from "react";
import { useTrustShieldCms } from "./useTrustShieldCms";
import { DualCodedStatusPill } from "../../components/ui/DualCodedStatusPill";
import { IdempotentActionButton } from "../../components/ui/IdempotentActionButton";
import { BayesianHalfLifeBar } from "../../components/ui/BayesianHalfLifeBar";
import { CANONICAL_HUBS } from "../../contracts/canonicalGraph";
import {
  ShieldAlert,
  AlertOctagon,
  Timer,
  UploadCloud,
  ThumbsUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface TrustShieldAndCmsPanelProps {
  className?: string;
}

export function TrustShieldAndCmsPanel({ className }: TrustShieldAndCmsPanelProps) {
  const {
    activeAlerts,
    interceptionLogs,
    ocrSelectedPreset,
    setOcrSelectedPreset,
    ocrCandidateEdges,
    ocrCommittedCount,
    signboardPresets,
    voteLockState,
    ocrLockState,
    handleVoteAlert,
    handleInjectSpoofedFare,
    handleSubmitUncorroboratedReport,
    handleOverrideDecayAndQuarantine,
    handleScanSignboard,
    handleCommitOcrEdges,
    handleDiscardOcrEdges,
  } = useTrustShieldCms();

  const [isSignboardOpen, setIsSignboardOpen] = useState<boolean>(true);

  return (
    <aside
      className={cn(
        "flex flex-col h-full space-y-4 p-4 rounded-2xl bg-[#0F172A]/90 border-[1.5px] border-[#334155] backdrop-blur-md shadow-2xl overflow-y-auto",
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#F43F5E]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Trust Shield & Bayesian CMS
            </h2>
          </div>
          <p className="text-[11px] font-mono text-[#94A3B8]">
            Zone 3: Role B — Adversarial Sanity & Truth Discovery
          </p>
        </div>
        <DualCodedStatusPill status="GRAPH_GROUNDED" label="SHIELD ACTIVE" size="sm" />
      </div>

      {/* SECTION 1: X-Ray Security & Sanity Audit Log */}
      <div className="space-y-2.5 p-3 rounded-xl bg-[#070B14]/80 border-[1.5px] border-[#334155]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FDA4AF] flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-[#F43F5E]" />
            Sanity Gate & Interception Logs
          </span>
          <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
            {interceptionLogs.length} Events Logged
          </span>
        </div>

        {/* Audit Log Badges Feed */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {interceptionLogs.slice(0, 4).map((log) => (
            <div
              key={log.event_id}
              className="p-2 rounded-lg bg-[#1E293B] border border-[#475569] text-xs font-mono space-y-1"
            >
              <div className="flex items-center justify-between">
                <DualCodedStatusPill status={log.status} size="sm" />
                <span className="text-[10px] text-[#94A3B8] tabular-nums">
                  ⚡ {log.execution_time_ms.toFixed(2)} ms
                </span>
              </div>
              <p className="text-[11px] text-[#CBD5E1] break-words leading-tight">
                {log.rejected_payload_summary}
              </p>
            </div>
          ))}
        </div>

        {/* 1-Click Judge Stress-Test Controls */}
        <div className="pt-2 border-t border-[#334155]/60 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] block">
            Judge Stress-Test Triggers (Instant Rejection Check):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <IdempotentActionButton
              variant="danger"
              className="text-[10px] py-1.5 px-2"
              onClick={() => handleInjectSpoofedFare(500)}
            >
              Inject 500 BDT Fare
            </IdempotentActionButton>

            <IdempotentActionButton
              variant="amber"
              className="text-[10px] py-1.5 px-2"
              onClick={handleSubmitUncorroboratedReport}
            >
              Shahbagh Report (+1)
            </IdempotentActionButton>
          </div>
        </div>
      </div>

      {/* SECTION 2: Bayesian Crowd Alert Feed with 30-Min Half-Life Decay */}
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E2E8F0] flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-[#06B6D4]" />
            Live Bayesian Disruption Feed
          </span>
          <span className="text-[11px] font-mono text-[#10B981] tabular-nums">
            λ = ln(2)/30m
          </span>
        </div>

        <div className="space-y-3">
          {activeAlerts.map((alert) => {
            const hubMeta = CANONICAL_HUBS[alert.hub_id];
            const hubNameEn = hubMeta?.name_en || alert.hub_id;
            const hubNameBn = hubMeta?.name_bn || "";

            return (
              <div
                key={alert.alert_id}
                className={cn(
                  "p-3 rounded-xl bg-[#1E293B] border-[1.5px] transition-all space-y-2.5",
                  alert.confidence_pct >= 85
                    ? "border-[#F43F5E] shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                    : alert.confidence_pct < 25
                    ? "border-[#475569] opacity-60"
                    : "border-[#F59E0B]"
                )}
              >
                {/* Alert Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span>{hubNameEn}</span>
                      {hubNameBn && (
                        <span className="text-[10px] text-[#94A3B8] font-normal font-sans">
                          ({hubNameBn})
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-mono text-[#F43F5E] uppercase tracking-wide">
                      {alert.incident_type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <DualCodedStatusPill status={alert.status} size="sm" />
                </div>

                {/* Bayesian Half-Life Bar */}
                <BayesianHalfLifeBar
                  confidencePct={alert.confidence_pct}
                  halfLifeRemainingMs={alert.half_life_remaining_ms}
                />

                {/* Corroboration Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    Votes: {alert.votes.length} ({alert.votes.filter((v) => v.direction === 1).length} +1)
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={voteLockState !== "IDLE" || alert.confidence_pct < 25}
                      onClick={() => handleVoteAlert(alert.alert_id, 1)}
                      className="px-2 py-1 rounded bg-[#064E3B] border border-[#10B981] text-[#6EE7B7] text-[10px] font-mono font-bold uppercase hover:bg-[#065F46] active:scale-95 disabled:opacity-50 flex items-center gap-1"
                      title="Corroborate this disruption (+1 vote)"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>+1 Confirm</span>
                    </button>

                    <button
                      disabled={voteLockState !== "IDLE"}
                      onClick={() => handleVoteAlert(alert.alert_id, -1)}
                      className="px-2 py-1 rounded bg-[#1E293B] border border-[#475569] text-[#E2E8F0] text-[10px] font-mono font-bold uppercase hover:border-[#F43F5E] hover:text-[#FDA4AF] active:scale-95 disabled:opacity-50 flex items-center gap-1"
                      title="Mark this corridor as cleared / resolved"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                      <span>-1 Cleared</span>
                    </button>
                  </div>
                </div>

                {/* Admin Quick Override */}
                {alert.confidence_pct >= 85 && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleOverrideDecayAndQuarantine(alert.alert_id)}
                      className="text-[10px] font-mono text-[#94A3B8] hover:text-[#FDA4AF] underline cursor-pointer"
                    >
                      [Admin: Override & Clear]
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Bonus 1 Signboard & Fare-Chart Vision Digitizer Drawer */}
      <div className="p-3 rounded-xl bg-[#070B14]/90 border-[1.5px] border-[#334155] space-y-2.5">
        <button
          onClick={() => setIsSignboardOpen((prev) => !prev)}
          className="w-full flex items-center justify-between text-left group"
        >
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5 text-[#06B6D4]" />
            Bonus 1: Signboard OCR Ingestor
          </span>
          <span className="text-[#94A3B8] group-hover:text-white">
            {isSignboardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {isSignboardOpen && (
          <div className="space-y-2.5 pt-1">
            <p className="text-[11px] text-[#94A3B8]">
              Digitize bus route signboards or printed fare charts into verified topological edges in G_0.
            </p>

            {/* Signboard Preset Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-[#94A3B8]">
                Select Demo Signboard Photo:
              </label>
              <select
                value={ocrSelectedPreset}
                onChange={(e) => setOcrSelectedPreset(e.target.value)}
                className="w-full bg-[#1E293B] border border-[#334155] text-xs font-mono text-[#E2E8F0] rounded-lg p-2 focus:outline-none focus:border-[#06B6D4]"
              >
                {Object.entries(signboardPresets).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scan Action CTA */}
            <div className="flex gap-2">
              <IdempotentActionButton
                variant="primary"
                className="w-full text-xs py-2"
                lockState={ocrLockState}
                onClick={() => handleScanSignboard(ocrSelectedPreset)}
              >
                Scan Bus Signboard
              </IdempotentActionButton>
            </div>

            {/* Extracted Candidate Edges Preview */}
            {ocrCandidateEdges.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[#1E293B] border border-[#10B981]/60 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#6EE7B7] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                    {ocrCandidateEdges.length} Grounded Edges Extracted
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    V(P) = 1 Grounded
                  </span>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {ocrCandidateEdges.map((edge) => (
                    <div
                      key={edge.edge_id}
                      className="p-1.5 rounded bg-[#0F172A] border border-[#334155] text-[11px] font-mono space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-white font-semibold">
                        <span>{edge.route_name}</span>
                        <span className="text-[#10B981]">{edge.base_fare_bdt} BDT</span>
                      </div>
                      <div className="flex items-center justify-between text-[#94A3B8] text-[10px]">
                        <span>
                          {edge.origin_hub_id} <ArrowRight className="inline w-2.5 h-2.5" /> {edge.dest_hub_id}
                        </span>
                        <span>{edge.distance_km} km</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Commit / Discard Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCommitOcrEdges}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#064E3B] border border-[#10B981] text-[#6EE7B7] text-xs font-mono font-bold hover:bg-[#065F46] active:scale-95"
                  >
                    Commit to Graph G_0
                  </button>
                  <button
                    onClick={handleDiscardOcrEdges}
                    className="py-1.5 px-2 rounded-lg bg-[#1E293B] border border-[#475569] text-[#94A3B8] text-xs font-mono hover:text-[#FDA4AF] active:scale-95"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {ocrCommittedCount > 0 && (
              <p className="text-[10px] font-mono text-[#10B981]">
                ✓ Total {ocrCommittedCount} OCR edges committed to in-memory graph.
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
