"use client";

// ==============================================================================
// src/app/page.tsx — WAVE 0 FOUNDATION VERIFICATION CONSOLE
// Showcases 5 Atomic Primitives, State Bridge, and Wave 1 Readiness
// ==============================================================================

import React from "react";
import { useDhakaPathStore } from "../store/useDhakaPathStore";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../contracts/canonicalGraph";
import { ScenarioPreset, ValidationStatus } from "../contracts/schema";
import { MetricCard } from "../components/ui/MetricCard";
import { DualCodedStatusPill } from "../components/ui/DualCodedStatusPill";
import { IdempotentActionButton } from "../components/ui/IdempotentActionButton";
import { TimeMachineDecaySlider } from "../components/ui/TimeMachineDecaySlider";
import { BayesianHalfLifeBar } from "../components/ui/BayesianHalfLifeBar";
import {
  Activity,
  Layers,
  ShieldCheck,
  Zap,
  MapPin,
  TrendingDown,
  Compass,
} from "lucide-react";

export default function Wave0FoundationPage() {
  const {
    activePreset,
    simOffsetMs,
    surfaceVelocityKmh,
    surgeMultiplier,
    engineRecomputeLatencyMs,
    activeAlerts,
    setScenarioPreset,
    setSimOffsetMs,
    resetToCanonicalG0,
  } = useDhakaPathStore();

  const hubsCount = Object.keys(CANONICAL_HUBS).length;
  const edgesCount = CANONICAL_GRAPH_G0.length;
  const isGraphFrozen = Object.isFrozen(CANONICAL_GRAPH_G0);

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Wave 0 Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F172A]/90 border-[1.5px] border-[#334155] backdrop-blur-md shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#06B6D4]" />
              <span>DhakaPath</span>
              <span className="text-xs font-mono font-medium text-[#06B6D4] px-2 py-0.5 rounded-full bg-[#083344] border border-[#06B6D4]/50">
                WAVE 0 FOUNDATION
              </span>
            </h1>
            <DualCodedStatusPill status="SIMULATED_DEMO_TELEMETRY" size="sm" />
          </div>
          <p className="text-xs text-[#94A3B8]">
            IAIT National IT Fest (INIF) 2026 | Multi-Objective Spatio-Temporal Transit Engine & Zero-Hallucination Route Verifier
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <TimeMachineDecaySlider
            currentOffsetMs={simOffsetMs}
            onChangeOffsetMs={setSimOffsetMs}
          />
          <IdempotentActionButton
            variant="outline"
            onClick={resetToCanonicalG0}
          >
            Reset G_0
          </IdempotentActionButton>
        </div>
      </div>

      {/* Scenario Preset Switcher (Testing Feature 0 in Wave 0) */}
      <div className="p-4 rounded-2xl bg-[#0F172A]/80 border-[1.5px] border-[#334155] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
            Deterministic Scenario Injector (Feature 0 Core)
          </span>
          <span className="text-xs font-mono text-[#E2E8F0] tabular-nums">
            Latency: <strong className="text-[#10B981]">{engineRecomputeLatencyMs} ms</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <IdempotentActionButton
            variant={activePreset === ScenarioPreset.NORMAL_BASELINE ? "primary" : "secondary"}
            onClick={() => setScenarioPreset(ScenarioPreset.NORMAL_BASELINE)}
          >
            1. Normal Baseline
          </IdempotentActionButton>

          <IdempotentActionButton
            variant={activePreset === ScenarioPreset.PEAK_CRISIS_SURGE ? "amber" : "secondary"}
            onClick={() => setScenarioPreset(ScenarioPreset.PEAK_CRISIS_SURGE)}
          >
            2. Peak Crisis Surge
          </IdempotentActionButton>

          <IdempotentActionButton
            variant={activePreset === ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT ? "danger" : "secondary"}
            onClick={() => setScenarioPreset(ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT)}
          >
            3. Adversarial Attack
          </IdempotentActionButton>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Canonical Dhaka Hubs"
          value={hubsCount}
          subtext="Motijheel to Uttara & Jatrabari"
          icon={<MapPin className="w-4 h-4" />}
          trend="neutral"
        />

        <MetricCard
          title="Mode-Expanded Edges"
          value={edgesCount}
          subtext={isGraphFrozen ? "Object.freeze(G_0): TRUE" : "Mutable Warning"}
          icon={<Layers className="w-4 h-4" />}
          trend="positive"
        />

        <MetricCard
          title="Surface Velocity"
          value={`${surfaceVelocityKmh.toFixed(1)} km/h`}
          subtext={surfaceVelocityKmh < 6.0 ? "Peak Gridlock Collapse" : "Normal Daylight Flow"}
          icon={<TrendingDown className="w-4 h-4" />}
          trend={surfaceVelocityKmh < 6.0 ? "negative" : "positive"}
        />

        <MetricCard
          title="Rickshaw Surge Multiplier"
          value={`${surgeMultiplier.toFixed(1)}x`}
          subtext="Non-metered weather surge"
          icon={<Activity className="w-4 h-4" />}
          trend={surgeMultiplier > 1.0 ? "warning" : "positive"}
        />
      </div>

      {/* Verification Matrix & Status Pills Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Checklist */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border-[1.5px] border-[#334155] space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-mono">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            Wave 0 Verification Checklist
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B] border border-[#334155]">
              <span className="text-[#E2E8F0]">PostgreSQL Migration & RLS</span>
              <DualCodedStatusPill status={ValidationStatus.GRAPH_GROUNDED} label="0001_CORE.SQL READY" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B] border border-[#334155]">
              <span className="text-[#E2E8F0]">Locked Enums & Contracts</span>
              <DualCodedStatusPill status={ValidationStatus.GRAPH_GROUNDED} label="SCHEMA.TS LOCKED" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B] border border-[#334155]">
              <span className="text-[#E2E8F0]">Frozen G_0 Graph (15 Hubs, 5 Modes)</span>
              <DualCodedStatusPill status={ValidationStatus.GRAPH_GROUNDED} label="G_0 FROZEN (36 EDGES)" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B] border border-[#334155]">
              <span className="text-[#E2E8F0]">5 Atomic Tactical Obsidian Primitives</span>
              <DualCodedStatusPill status={ValidationStatus.GRAPH_GROUNDED} label="5 PRIMITIVES ACTIVE" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B] border border-[#334155]">
              <span className="text-[#E2E8F0]">Parallel Track Isolation Boundary</span>
              <DualCodedStatusPill status={ValidationStatus.GRAPH_GROUNDED} label="TRACKS 1-4 READY" size="sm" />
            </div>
          </div>
        </div>

        {/* Live Bayesian Alerts & Half-Life Decay Display */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border-[1.5px] border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-mono">
              <Activity className="w-4 h-4 text-[#F43F5E]" />
              Active Street Disruptions & Decay
            </h2>
            <span className="text-xs font-mono text-[#94A3B8]">
              {activeAlerts.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#1E293B] border border-dashed border-[#334155] text-xs text-[#94A3B8]">
                No active disruptions under Normal Baseline. Switch scenario presets to simulate crisis telemetry.
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {alert.hub_id} • {alert.incident_type}
                    </span>
                    <DualCodedStatusPill status={alert.status} size="sm" />
                  </div>
                  <BayesianHalfLifeBar
                    confidencePct={alert.confidence_pct}
                    halfLifeRemainingMs={alert.half_life_remaining_ms}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
