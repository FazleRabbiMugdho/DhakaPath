"use client";

// ==============================================================================
// src/components/ui/TimeMachineDecaySlider.tsx — TIME-MACHINE SCRUB CONTROL
// Stepped Time Slider (+0m, +15m, +45m, +90m) for Live Bayesian Decay Verification
// ==============================================================================

import React from "react";
import { cn } from "../../lib/utils";
import { FastForward, Clock } from "lucide-react";

export interface TimeStep {
  label: string;
  minutes: number;
  offsetMs: number;
}

export const TIME_STEPS: ReadonlyArray<TimeStep> = [
  { label: "+0m", minutes: 0, offsetMs: 0 },
  { label: "+15m", minutes: 15, offsetMs: 15 * 60 * 1000 },
  { label: "+45m", minutes: 45, offsetMs: 45 * 60 * 1000 },
  { label: "+90m", minutes: 90, offsetMs: 90 * 60 * 1000 },
];

interface TimeMachineDecaySliderProps {
  currentOffsetMs: number;
  onChangeOffsetMs: (offsetMs: number) => void;
  className?: string;
}

export function TimeMachineDecaySlider({
  currentOffsetMs,
  onChangeOffsetMs,
  className,
}: TimeMachineDecaySliderProps) {
  const currentStep =
    TIME_STEPS.find((s) => s.offsetMs === currentOffsetMs) || TIME_STEPS[0];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl bg-[#0F172A] p-1.5 border-[1.5px] border-[#334155]",
        className
      )}
    >
      <div className="flex items-center gap-1.5 pl-2 pr-1 text-xs font-mono font-medium text-[#94A3B8]">
        <FastForward className="w-3.5 h-3.5 text-[#06B6D4]" />
        <span className="hidden sm:inline">Time-Machine:</span>
      </div>

      <div className="flex items-center gap-1 bg-[#1E293B] rounded-xl p-0.5 border border-[#334155]">
        {TIME_STEPS.map((step) => {
          const isActive = step.offsetMs === currentOffsetMs;
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => onChangeOffsetMs(step.offsetMs)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all duration-150",
                isActive
                  ? "bg-[#06B6D4] text-[#083344] shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#334155]"
              )}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      <div className="hidden md:flex items-center gap-1 pl-1 pr-2 text-[11px] font-mono text-[#64748B]">
        <Clock className="w-3 h-3" />
        <span>Decay: {currentStep.minutes}m / 30m Half-Life</span>
      </div>
    </div>
  );
}
