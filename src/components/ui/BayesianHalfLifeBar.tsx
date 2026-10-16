"use client";

// ==============================================================================
// src/components/ui/BayesianHalfLifeBar.tsx — BAYESIAN DECAY PROGRESS BAR
// Displays Posterior Truth Confidence R_e(t) & 30-Minute Exponential Decay Bar
// ==============================================================================

import React from "react";
import { cn } from "../../lib/utils";
import { Timer, AlertCircle } from "lucide-react";

interface BayesianHalfLifeBarProps {
  confidencePct: number; // 0 to 100
  halfLifeRemainingMs?: number; // Integer _ms (defaults to 1800000ms = 30m)
  totalHalfLifeMs?: number; // 1800000ms
  className?: string;
  showNumericTrace?: boolean;
}

export function BayesianHalfLifeBar({
  confidencePct,
  halfLifeRemainingMs = 1800000,
  totalHalfLifeMs = 1800000,
  className,
  showNumericTrace = true,
}: BayesianHalfLifeBarProps) {
  const safeConfidence = Math.min(100, Math.max(0, confidencePct));
  const remainingFraction = Math.min(1, Math.max(0, halfLifeRemainingMs / totalHalfLifeMs));
  const remainingMinutes = Math.round(halfLifeRemainingMs / 60000);

  // Status color based on threshold (85% severing, 25% expiring)
  let statusColor = "bg-[#F43F5E]"; // Crimson for critical severe disruption
  let textColor = "text-[#FDA4AF]";
  let statusText = "CRITICAL BLOCKADE (SEVERED)";

  if (safeConfidence < 25.0) {
    statusColor = "bg-[#64748B]";
    textColor = "text-[#94A3B8]";
    statusText = "EXPIRED / CORRIDOR RESTORED";
  } else if (safeConfidence < 85.0) {
    statusColor = "bg-[#F59E0B]";
    textColor = "text-[#FDE68A]";
    statusText = "PENDING CORROBORATION";
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs font-mono font-semibold">
        <span className={cn("flex items-center gap-1", textColor)}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{statusText}</span>
        </span>
        <span className="text-[#E2E8F0] tabular-nums">
          R_e: <strong className={textColor}>{safeConfidence.toFixed(1)}%</strong>
        </span>
      </div>

      {/* Main confidence fill bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#0F172A] border border-[#334155]">
        <div
          className={cn("h-full transition-all duration-300 rounded-full", statusColor)}
          style={{ width: `${safeConfidence}%` }}
        />
      </div>

      {/* Sub-bar for 30-min exponential decay half-life countdown */}
      {showNumericTrace && (
        <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3 text-[#06B6D4]" />
            <span>Decay Window: {remainingMinutes}m / 30m Half-Life</span>
          </span>
          <span className="text-[#64748B]">
            exp(-λΔt) = {remainingFraction.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
