"use client";

// ==============================================================================
// src/components/ui/DualCodedStatusPill.tsx — DUAL-CODED STATUS INDICATOR
// Icon + High-Contrast Border + Uppercase Label (Color-Blind & Projector-Safe)
// ==============================================================================

import React from "react";
import { cn } from "../../lib/utils";
import { ValidationStatus, AlertStatus } from "../../contracts/schema";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
  Ban,
  Activity,
  Layers,
} from "lucide-react";

export type PillVariant =
  | ValidationStatus
  | AlertStatus
  | "SIMULATED_DEMO_TELEMETRY"
  | "STUDENT_PASS_ACTIVE"
  | "WALK_BRIDGE_ACTIVE"
  | "RUSH_HOUR_SURGE";

interface DualCodedStatusPillProps {
  status: PillVariant | string;
  label?: string;
  subLabel?: string;
  className?: string;
  size?: "sm" | "md";
}

export function DualCodedStatusPill({
  status,
  label,
  subLabel,
  className,
  size = "md",
}: DualCodedStatusPillProps) {
  let icon = <Activity className="w-3.5 h-3.5" />;
  let text = label || status;
  let bgClass = "bg-[#1E293B]";
  let borderClass = "border-[#475569]";
  let textClass = "text-[#E2E8F0]";

  switch (status) {
    case ValidationStatus.GRAPH_GROUNDED:
      icon = <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />;
      text = label || "GRAPH_GROUNDED: 100% VERIFIED";
      bgClass = "bg-[#064E3B]/80";
      borderClass = "border-[#10B981]";
      textClass = "text-[#6EE7B7]";
      break;

    case ValidationStatus.ANOMALOUS_FARE_REJECTED:
      icon = <Ban className="w-3.5 h-3.5 text-[#F43F5E]" />;
      text = label || "ANOMALOUS_FARE_REJECTED";
      bgClass = "bg-[#4C0519]/80";
      borderClass = "border-[#F43F5E]";
      textClass = "text-[#FDA4AF]";
      break;

    case ValidationStatus.GROUNDING_INTERCEPTED:
      icon = <AlertOctagon className="w-3.5 h-3.5 text-[#F43F5E]" />;
      text = label || "GROUNDING_INTERCEPTED";
      bgClass = "bg-[#4C0519]/80";
      borderClass = "border-[#F43F5E]";
      textClass = "text-[#FDA4AF]";
      break;

    case AlertStatus.VERIFIED_ACTIVE:
      icon = <AlertOctagon className="w-3.5 h-3.5 text-[#F43F5E]" />;
      text = label || "VERIFIED ACTIVE DISRUPTION";
      bgClass = "bg-[#4C0519]/60";
      borderClass = "border-[#F43F5E]";
      textClass = "text-[#FDA4AF]";
      break;

    case AlertStatus.PENDING_CORROBORATION:
      icon = <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />;
      text = label || "PENDING CORROBORATION";
      bgClass = "bg-[#451A03]/80";
      borderClass = "border-[#F59E0B]";
      textClass = "text-[#FDE68A]";
      break;

    case AlertStatus.RESOLVED:
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />;
      text = label || "CORRIDOR RESTORED";
      bgClass = "bg-[#064E3B]/50";
      borderClass = "border-[#10B981]";
      textClass = "text-[#6EE7B7]";
      break;

    case AlertStatus.EXPIRED:
      icon = <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />;
      text = label || "ALERT EXPIRED";
      bgClass = "bg-[#1E293B]";
      borderClass = "border-[#475569]";
      textClass = "text-[#94A3B8]";
      break;

    case "SIMULATED_DEMO_TELEMETRY":
      icon = <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />;
      text = label || "SIMULATED DEMO TELEMETRY";
      bgClass = "bg-[#083344]/80";
      borderClass = "border-[#06B6D4]";
      textClass = "text-[#67E8F9]";
      break;

    case "STUDENT_PASS_ACTIVE":
      icon = <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />;
      text = label || "STUDENT PASS 50% (10 BDT FLOOR)";
      bgClass = "bg-[#064E3B]/70";
      borderClass = "border-[#10B981]";
      textClass = "text-[#A7F3D0]";
      break;

    case "WALK_BRIDGE_ACTIVE":
      icon = <Layers className="w-3.5 h-3.5 text-[#F59E0B]" />;
      text = label || "DETOUR: WALK-BRIDGE ACTIVE";
      bgClass = "bg-[#451A03]/70";
      borderClass = "border-[#F59E0B]";
      textClass = "text-[#FDE68A]";
      break;

    case "RUSH_HOUR_SURGE":
      icon = <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />;
      text = label || "1.8x WEATHER SURGE";
      bgClass = "bg-[#451A03]/80";
      borderClass = "border-[#F59E0B]";
      textClass = "text-[#FDE68A]";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-wide uppercase transition-all",
        "border-[1.5px]",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        bgClass,
        borderClass,
        textClass,
        className
      )}
    >
      {icon}
      <span>{text}</span>
      {subLabel && <span className="opacity-75 font-normal">({subLabel})</span>}
    </span>
  );
}
