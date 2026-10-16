"use client";

// ==============================================================================
// src/shell/ScenarioInjectorBar.tsx — ZONE 0 TOP GLOBAL BAR (64px, Feature 0)
// Stage Time-Machine & Chaos Injector: brand + live velocity, 3 preset segments
// with a 150ms debounce lock, stepped decay scrub, and the clickable X-Ray trace.
// ==============================================================================

import React from "react";
import { cn } from "@/lib/utils";
import { ScenarioPreset } from "@/contracts/schema";
import { DualCodedStatusPill } from "@/components/ui/DualCodedStatusPill";
import { TimeMachineDecaySlider } from "@/components/ui/TimeMachineDecaySlider";
import { SCENARIO_PRESETS, type ScenarioInjectorApi } from "./useScenarioInjector";
import { Gauge, Zap, RotateCcw, Keyboard, Loader2, Radio } from "lucide-react";

interface ScenarioInjectorBarProps {
  injector: ScenarioInjectorApi;
  className?: string;
}

export function ScenarioInjectorBar({ injector, className }: ScenarioInjectorBarProps) {
  const {
    activePreset,
    simOffsetMs,
    isLocked,
    surfaceVelocityKmh,
    surgeMultiplier,
    engineLatencyMs,
    xrayOpen,
    selectPreset,
    setOffsetMs,
    reset,
    toggleXray,
  } = injector;

  const isCrisis = activePreset === ScenarioPreset.PEAK_CRISIS_SURGE;
  const velocityTone = surfaceVelocityKmh <= 6 ? "#F43F5E" : surfaceVelocityKmh <= 10 ? "#F59E0B" : "#10B981";
  const latency = Number.isFinite(engineLatencyMs) ? engineLatencyMs.toFixed(2) : "0.78";

  return (
    <header
      className={cn(
        "relative z-30 flex min-h-16 w-full flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-4",
        "border-b-[1.5px] border-[#1E293B] bg-[#0B111F]/85 backdrop-blur-md",
        "shadow-[0_8px_30px_-12px_rgba(0,0,0,0.9)]",
        className
      )}
    >
      {/* Left 25% — Brand and live velocity; the disclosure lives in RootLayout. */}
      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-[1.5px] border-[#06B6D4]/60 bg-[#06B6D4]/10 text-[#06B6D4] shadow-[0_0_18px_rgba(6,182,212,0.25)]">
            <Radio className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <div className="font-sans text-[15px] font-extrabold tracking-tight text-white">
              DhakaPath <span className="font-mono text-[11px] font-semibold text-[#67E8F9]">{"// INIF-26"}</span>
            </div>
            <div
              className="flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums"
              style={{ color: velocityTone }}
            >
              <Gauge className="h-3 w-3" />
              Peak Velocity: {surfaceVelocityKmh.toFixed(1)} km/h
            </div>
          </div>
        </div>
      </div>

      {/* Center 50% — Preset segments + decay scrub */}
      <div className="flex flex-[1.4] items-center justify-center gap-2.5">
        <div
          className={cn(
            "flex items-center gap-1 rounded-full border-[1.5px] border-[#334155] bg-[#0F172A] p-1",
            isLocked && "ring-2 ring-[#06B6D4]/40"
          )}
          role="radiogroup"
          aria-label="Stage scenario preset"
        >
          {SCENARIO_PRESETS.map((p) => {
            const active = activePreset === p.preset;
            return (
              <button
                key={p.preset}
                type="button"
                role="radio"
                aria-checked={active}
                title={`${p.label} (${p.hotkey})`}
                disabled={isLocked}
                onClick={() => selectPreset(p.preset)}
                className={cn(
                  "group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-wide transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] disabled:cursor-wait",
                  active ? "text-[#070B14]" : "text-[#94A3B8] hover:text-[#E2E8F0]"
                )}
                style={active ? { backgroundColor: p.accent, boxShadow: `0 0 18px ${p.accent}55` } : undefined}
              >
                <span className="grid h-4 w-4 place-items-center">
                  {isLocked && active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="font-extrabold">{p.index}</span>
                  )}
                </span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            );
          })}
        </div>

        <TimeMachineDecaySlider
          currentOffsetMs={simOffsetMs}
          onChangeOffsetMs={setOffsetMs}
          className="hidden 2xl:flex"
        />
      </div>

      {/* Right 25% — X-Ray trace pill + reset + hotkeys */}
      <div className="flex min-w-[220px] flex-1 items-center justify-end gap-2">
        <button
          type="button"
          onClick={toggleXray}
          aria-pressed={xrayOpen}
          title="Toggle X-Ray math drawer (Ctrl+Shift+D)"
          className={cn(
            "group hidden items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 font-mono text-[11px] font-semibold tabular-nums transition-all duration-150 2xl:inline-flex",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]",
            xrayOpen
              ? "border-[#06B6D4] bg-[#083344]/70 text-[#67E8F9] shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              : "border-[#334155] bg-[#0F172A] text-[#CBD5E1] hover:border-[#06B6D4]/60 hover:text-white"
          )}
        >
          <Zap className="h-3.5 w-3.5 shrink-0 text-[#06B6D4]" />
          <span className="text-[#67E8F9]">ENGINE {latency}ms</span>
          <span className="text-[#475569]">|</span>
          <span className="hidden text-[#CBD5E1] lg:inline">|V|75 |E|240</span>
          <span className="hidden text-[#475569] lg:inline">|</span>
          <span className="text-[#A7F3D0]">J(P*) 0.241</span>
          <span className="hidden text-[#475569] xl:inline">|</span>
          <span className={cn("hidden xl:inline", isCrisis ? "text-[#FDA4AF]" : "text-[#94A3B8]")}>
            R_Farmgate {isCrisis ? "91.8%→∞" : "—"}
          </span>
          <span className="text-[#475569]">|</span>
          <span className="text-[#6EE7B7]">V(P*)=1</span>
        </button>

        <span
          className="hidden items-center gap-1 rounded-full border border-[#334155] bg-[#0F172A]/70 px-2 py-1 font-mono text-[10px] font-medium text-[#64748B] 2xl:inline-flex"
          title="Alt+1/2/3 presets · Ctrl+Shift+D X-Ray · Alt+R reset"
        >
          <Keyboard className="h-3 w-3" />
          Alt+1·2·3 / Ctrl+⇧+D / Alt+R
        </span>

        {surgeMultiplier > 1.01 && (
          <DualCodedStatusPill
            status="RUSH_HOUR_SURGE"
            label={`${surgeMultiplier.toFixed(1)}x SURGE`}
            size="sm"
            className="hidden sm:inline-flex"
          />
        )}

        <button
          type="button"
          onClick={reset}
          title="Reset to Canonical G_0 (Alt+R)"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-[#334155] bg-[#0F172A] text-[#94A3B8] transition-all duration-150 hover:border-[#06B6D4]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
