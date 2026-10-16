"use client";

// ==============================================================================
// src/app/track-1-engine/page.tsx — TRACK 1 ENGINE VERIFICATION CONSOLE
// WAVE 1 — TRACK 1 (Dev 1: Systems & Graph Architect)
// Interactive Pareto Dijkstra, Piecewise Tariff & Idempotency Benchmark
// ==============================================================================

import React, { useState, useMemo, useCallback } from "react";
import {
  HubId,
  ScenarioPreset,
  TransportMode,
  ValidationStatus,
  CommuterQuery,
} from "../../contracts/schema";
import { CANONICAL_HUBS, CANONICAL_GRAPH_G0 } from "../../contracts/canonicalGraph";
import { executeParetoSearch, ParetoSearchResult } from "../../engine/paretoRouter";
import { computeCounterfactualRoi } from "../../engine/shadowBaseline";
import { projectScenario } from "../../engine/scenarioStore";
import { MetricCard } from "../../components/ui/MetricCard";
import { DualCodedStatusPill } from "../../components/ui/DualCodedStatusPill";
import { IdempotentActionButton } from "../../components/ui/IdempotentActionButton";
import { TimeMachineDecaySlider } from "../../components/ui/TimeMachineDecaySlider";
import {
  Zap,
  Cpu,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  Scale,
  TrendingUp,
} from "lucide-react";

export default function Track1EngineVerificationPage() {
  const [originHub, setOriginHub] = useState<HubId>(HubId.H_MIRPUR10);
  const [destHub, setDestHub] = useState<HubId>(HubId.H_MOTIJHEEL);
  const [isStudent, setIsStudent] = useState<boolean>(true);
  const [budgetBdt, setBudgetBdt] = useState<number>(55);
  const [preset, setPreset] = useState<ScenarioPreset>(ScenarioPreset.PEAK_CRISIS_SURGE);
  const [simOffsetMs, setSimOffsetMs] = useState<number>(0);
  const [stressTestLogs, setStressTestLogs] = useState<string[]>([]);
  const [stressSuccess, setStressSuccess] = useState<boolean | null>(null);

  // 1. Pure functional scenario projection
  const scenario = useMemo(() => {
    return projectScenario(preset, simOffsetMs);
  }, [preset, simOffsetMs]);

  // 2. Build active query object
  const activeQuery: CommuterQuery = useMemo(() => {
    return {
      action_id: `VERIFY_QUERY_${Date.now()}`,
      raw_query_text: `${originHub} to ${destHub}`,
      origin_hub_id: originHub,
      dest_hub_id: destHub,
      is_student: isStudent,
      max_budget_bdt: budgetBdt,
      avoid_hub_ids: preset === ScenarioPreset.PEAK_CRISIS_SURGE ? [HubId.H_FARMGATE] : [],
      timestamp_ms: Date.now(),
    };
  }, [originHub, destHub, isStudent, budgetBdt, preset]);

  // 3. Execute Pareto Search deterministically
  const searchResult: ParetoSearchResult = useMemo(() => {
    return executeParetoSearch(activeQuery, preset, scenario.active_alerts);
  }, [activeQuery, preset, scenario.active_alerts]);

  const optimalRoute = searchResult.routes[0] || null;

  // 4. Compute Counterfactual Shadow Baseline ROI
  const roiMetrics = useMemo(() => {
    return computeCounterfactualRoi(
      optimalRoute,
      activeQuery,
      preset,
      scenario.active_alerts
    );
  }, [optimalRoute, activeQuery, preset, scenario.active_alerts]);

  // Handler for 5x Rapid Click Stress Test
  const runIdempotencyStressTest = useCallback(() => {
    const logs: string[] = [];
    const testFares: number[] = [];

    logs.push("Starting 5x Rapid Trigger Idempotency Stress Test...");

    for (let i = 1; i <= 5; i++) {
      const proj = projectScenario(ScenarioPreset.PEAK_CRISIS_SURGE, 0);
      const res = executeParetoSearch(
        {
          action_id: `STRESS_TEST_${i}`,
          raw_query_text: "Stress Test Query",
          origin_hub_id: HubId.H_MIRPUR10,
          dest_hub_id: HubId.H_MOTIJHEEL,
          is_student: true,
          max_budget_bdt: 55,
          avoid_hub_ids: [HubId.H_FARMGATE],
          timestamp_ms: Date.now(),
        },
        ScenarioPreset.PEAK_CRISIS_SURGE,
        proj.active_alerts
      );

      const topFare = res.routes[0]?.total_effective_fare_bdt ?? -1;
      testFares.push(topFare);
      logs.push(
        `[Pass ${i}/5] Latency: ${res.execution_time_ms.toFixed(2)}ms | Optimal Fare: ${topFare} BDT`
      );
    }

    // Verify all fares match exactly with zero compounding drift
    const allMatch = testFares[0] > 0 && testFares.every((f) => f === testFares[0]);
    if (allMatch) {
      logs.push("VERIFIED: Zero cumulative fare drift. Pure functional projection G(t) is immutable.");
      setStressSuccess(true);
    } else {
      logs.push("FAILED: Detected fare drift or mismatch across consecutive triggers.");
      setStressSuccess(false);
    }

    setStressTestLogs(logs);
  }, []);

  // Preset quick triggers
  const setFareCheck = () => {
    setOriginHub(HubId.H_MIRPUR10);
    setDestHub(HubId.H_MOTIJHEEL);
    setIsStudent(true);
    setBudgetBdt(55);
    setPreset(ScenarioPreset.PEAK_CRISIS_SURGE);
    setSimOffsetMs(0);
  };

  const hubOptions = Object.values(CANONICAL_HUBS).sort((a, b) => a.index - b.index);

  return (
    <main className="min-h-screen bg-[#070B14] text-[#F8FAFC] p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0F172A] border-[1.5px] border-[#334155] shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-[#06B6D4]" />
              <span>Track 1 Engine Verification Console</span>
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#083344] text-[#06B6D4] border border-[#06B6D4]/40">
              DEV 1: SYSTEMS & GRAPH ARCHITECT
            </span>
            <DualCodedStatusPill status="SIMULATED_DEMO_TELEMETRY" size="sm" />
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-sans">
            Multi-Criteria Label-Setting Dijkstra (<span className="text-[#06B6D4] font-mono">O(1)</span> 16-Bit Cycle Guard) • Piecewise Student Tariff Engine • Counterfactual ROI Synthesizer
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <IdempotentActionButton
            variant="primary"
            onAction={setFareCheck}
            icon={<Sparkles className="w-4 h-4" />}
          >
            [1-Tap Fare Estimate]
          </IdempotentActionButton>
          <IdempotentActionButton
            variant="outline"
            onAction={runIdempotencyStressTest}
            icon={<Zap className="w-4 h-4 text-[#F59E0B]" />}
          >
            [Run 5x Stress Test]
          </IdempotentActionButton>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[#CBD5E1]">
        MRT-6 uses DMTCL station-pair ticket fares. Non-AC diesel bus fares are
        estimates from the announced BRTA city rate of 2.70 BDT/km; route distances
        and other modes remain demo graph data, not an operator fare quote.
      </p>

      {/* Top Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          title="Engine Latency"
          value={`${searchResult.execution_time_ms.toFixed(2)} ms`}
          subtext="Target: < 0.80 ms"
          trend="positive"
          icon={<Zap className="w-4 h-4" />}
        />
        <MetricCard
          title="Surface Velocity"
          value={`${scenario.surface_velocity_kmh.toFixed(1)} km/h`}
          subtext={preset === ScenarioPreset.PEAK_CRISIS_SURGE ? "Collapse (Gridlock)" : "Normal Corridor"}
          trend={preset === ScenarioPreset.PEAK_CRISIS_SURGE ? "negative" : "neutral"}
          icon={<Clock className="w-4 h-4" />}
        />
        <MetricCard
          title="Pareto Options"
          value={`${searchResult.routes.length} Paths`}
          subtext={searchResult.walk_bridge_active ? "Walk-Bridge Fallback Active" : "Non-Dominated Labels"}
          trend="neutral"
          icon={<Layers className="w-4 h-4" />}
        />
        <MetricCard
          title="Graph Dimension"
          value={`${CANONICAL_GRAPH_G0.length} Edges`}
          subtext={`${Object.keys(CANONICAL_HUBS).length} Hubs | Frozen G_0`}
          trend="positive"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
      </div>

      {/* Interactive Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Routing Constraints */}
        <div className="rounded-2xl bg-[#0F172A] p-5 border-[1.5px] border-[#334155] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#06B6D4]" />
            <span>Interactive Constraint Form</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#CBD5E1] block mb-1">
                Origin Hub (15 Canonical Hubs)
              </label>
              <select
                value={originHub}
                onChange={(e) => setOriginHub(e.target.value as HubId)}
                className="w-full rounded-xl bg-[#1E293B] border border-[#334155] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06B6D4] font-medium"
              >
                {hubOptions.map((h) => (
                  <option key={h.hub_id} value={h.hub_id}>
                    {h.index}. {h.name_en} ({h.name_bn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#CBD5E1] block mb-1">
                Destination Hub
              </label>
              <select
                value={destHub}
                onChange={(e) => setDestHub(e.target.value as HubId)}
                className="w-full rounded-xl bg-[#1E293B] border border-[#334155] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06B6D4] font-medium"
              >
                {hubOptions.map((h) => (
                  <option key={h.hub_id} value={h.hub_id}>
                    {h.index}. {h.name_en} ({h.name_bn})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-[#334155]/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#CBD5E1] block">
                  Student 50% Pass
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Enforces statutory 10 BDT floor
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsStudent(!isStudent)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  isStudent
                    ? "bg-[#064E3B] text-[#6EE7B7] border border-[#10B981]"
                    : "bg-[#334155] text-[#94A3B8]"
                }`}
              >
                {isStudent ? "[STUDENT: ON]" : "[REGULAR: OFF]"}
              </button>
            </div>

            <div className="pt-2 border-t border-[#334155]/60">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-[#CBD5E1]">
                  Commuter Cash Budget
                </span>
                <span className="text-xs font-mono font-bold text-[#06B6D4]">
                  {budgetBdt} BDT
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={budgetBdt}
                onChange={(e) => setBudgetBdt(Number(e.target.value))}
                className="w-full accent-[#06B6D4] cursor-pointer"
              />
              <span className="text-[11px] text-[#94A3B8] block">
                Note: Direct MRT-6 (60 BDT) is pruned when budget &lt;= 55 BDT.
              </span>
            </div>

            <div className="pt-2 border-t border-[#334155]/60">
              <label className="text-xs font-semibold text-[#CBD5E1] block mb-1">
                Scenario Regime
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: ScenarioPreset.NORMAL_BASELINE, label: "1. Normal Baseline" },
                  { id: ScenarioPreset.PEAK_CRISIS_SURGE, label: "2. Peak Crisis Surge (Farmgate Severed)" },
                  { id: ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT, label: "3. Adversarial / Stale Telemetry" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPreset(s.id)}
                    className={`text-left px-3 py-2 text-xs font-mono font-bold rounded-xl transition-all border ${
                      preset === s.id
                        ? "bg-[#083344] text-[#06B6D4] border-[#06B6D4]"
                        : "bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#334155]/60">
              <TimeMachineDecaySlider
                currentOffsetMs={simOffsetMs}
                onChangeOffsetMs={setSimOffsetMs}
              />
            </div>
          </div>
        </div>

        {/* Center & Right Column: Calculated Pareto Routes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              <span>Ranked Non-Dominated Pareto Route Cards</span>
            </h2>
            <div className="text-xs font-mono text-[#06B6D4]">
              Normalized Generalized Cost J(P)
            </div>
          </div>

          {searchResult.routes.length === 0 ? (
            <div className="rounded-2xl bg-[#1E293B] p-8 border border-[#334155] text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-[#F59E0B] mx-auto" />
              <div className="text-sm font-bold text-white">No Feasible Route Within Budget</div>
              <div className="text-xs text-[#94A3B8]">
                Try increasing commuter budget or toggling off avoided corridors.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResult.routes.map((route, idx) => {
                const isOptimal = idx === 0;
                return (
                  <div
                    key={route.route_id}
                    className={`rounded-2xl p-5 border-[1.5px] transition-all relative ${
                      isOptimal
                        ? "bg-[#0F172A] border-[#06B6D4] shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                        : "bg-[#0F172A]/80 border-[#334155]"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#334155]/70">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#1E293B] text-[#CBD5E1] border border-[#334155]">
                          Rank #{idx + 1} {isOptimal ? "(Optimal P*)" : ""}
                        </span>
                        <DualCodedStatusPill
                          status={ValidationStatus.GRAPH_GROUNDED}
                          label="GRAPH-GROUNDED ROUTE"
                          size="sm"
                        />
                        <span className="text-xs font-mono text-[#94A3B8]">
                          J(P): <strong className="text-white">{route.generalized_cost_score}</strong>
                        </span>
                      </div>

                      <div className="flex items-baseline gap-3">
                        {route.total_regular_fare_bdt > route.total_effective_fare_bdt && (
                          <span className="text-xs font-mono text-[#94A3B8] line-through">
                            {route.total_regular_fare_bdt} BDT
                          </span>
                        )}
                        <span className="text-2xl font-extrabold font-mono text-[#10B981] tabular-nums">
                          {route.total_effective_fare_bdt} BDT
                        </span>
                        <span className="text-sm font-mono text-[#E2E8F0]">
                          • {Math.round(route.total_duration_ms / 60000)} mins
                        </span>
                        <span className="text-xs font-mono text-[#94A3B8]">
                          ({route.transfers_count} {route.transfers_count === 1 ? "transfer" : "transfers"})
                        </span>
                      </div>
                    </div>

                    {/* Step-by-Step Legs */}
                    <div className="mt-4 space-y-2.5">
                      {route.legs.map((leg, legIdx) => {
                        const modeColor = {
                          [TransportMode.METRO]: "text-[#22C55E] bg-[#052E16] border-[#22C55E]/40",
                          [TransportMode.BUS]: "text-[#3B82F6] bg-[#1E3A8A] border-[#3B82F6]/40",
                          [TransportMode.LEGUNA]: "text-[#A855F7] bg-[#3B0764] border-[#A855F7]/40",
                          [TransportMode.RICKSHAW]: "text-[#F59E0B] bg-[#451A03] border-[#F59E0B]/40",
                          [TransportMode.WALK]: "text-[#94A3B8] bg-[#1E293B] border-[#94A3B8]/40",
                        }[leg.mode];

                        return (
                          <div
                            key={`${leg.edge_id}_${legIdx}`}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#1E293B]/60 border border-[#334155]/50 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold uppercase border text-[11px] ${modeColor}`}
                              >
                                {leg.mode}
                              </span>
                              <div>
                                <div className="font-semibold text-white">
                                  {leg.route_name}
                                </div>
                                <div className="text-[11px] text-[#94A3B8]">
                                  {CANONICAL_HUBS[leg.origin_hub_id]?.name_en} → {CANONICAL_HUBS[leg.dest_hub_id]?.name_en} • <span className="text-[#CBD5E1]">{leg.boarding_landmark}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-mono flex-shrink-0">
                              <div className="font-bold text-[#E2E8F0]">
                                {leg.effective_fare_bdt} BDT
                              </div>
                              <div className="text-[11px] text-[#94A3B8]">
                                {Math.round(leg.effective_duration_ms / 60000)} mins
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Counterfactual Shadow ROI Ledger */}
          <div className="rounded-2xl p-5 bg-[#0F172A] border-[1.5px] border-[#334155] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#06B6D4]" />
                <span>Counterfactual Shadow Baseline vs. DhakaPath Optimal Detour</span>
              </h3>
              <span className="text-xs font-mono text-[#10B981] font-semibold">
                Graph-based comparison
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl p-3.5 bg-[#1E293B] border border-[#334155]">
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase">
                  Time Saved
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#10B981] tabular-nums mt-0.5">
                  +{Math.round(roiMetrics.time_saved_ms / 60000)} mins
                </div>
                <div className="text-[11px] text-[#CBD5E1] mt-0.5">
                  Surface baseline: {Math.round(roiMetrics.shadow_duration_ms / 60000)}m vs Route: {optimalRoute ? Math.round(optimalRoute.total_duration_ms / 60000) : 0}m
                </div>
              </div>

              <div className="rounded-xl p-3.5 bg-[#1E293B] border border-[#334155]">
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase">
                  Estimated Fare Difference
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#10B981] tabular-nums mt-0.5">
                  +{roiMetrics.cost_saved_bdt} BDT
                </div>
                <div className="text-[11px] text-[#CBD5E1] mt-0.5">
                  Bus-first baseline: {roiMetrics.shadow_fare_bdt} BDT vs Route: {optimalRoute?.total_effective_fare_bdt ?? 0} BDT
                </div>
              </div>

              <div className="rounded-xl p-3.5 bg-[#1E293B] border border-[#334155]">
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase">
                  Alert Exposure Reduction
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#06B6D4] tabular-nums mt-0.5">
                  -{roiMetrics.risk_reduction_pct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-[#CBD5E1] mt-0.5">
                  Demo benchmark: Manual 8.5m → Engine 1.4s
                </div>
              </div>
            </div>
          </div>

          {/* Stress Test Log Window (If Triggered) */}
          {stressTestLogs.length > 0 && (
            <div className="rounded-2xl p-4 bg-[#070B14] border border-[#334155] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[#94A3B8] border-b border-[#334155]/60 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>5x Rapid Trigger Idempotency Log</span>
                </span>
                <span className={stressSuccess ? "text-[#10B981]" : "text-[#F43F5E]"}>
                  {stressSuccess ? "PASSED: ZERO DRIFT" : "DRIFT DETECTED"}
                </span>
              </div>
              <div className="space-y-1 text-[#CBD5E1]">
                {stressTestLogs.map((log, lIdx) => (
                  <div key={lIdx}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
