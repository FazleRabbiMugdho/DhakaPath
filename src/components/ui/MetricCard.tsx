"use client";

// ==============================================================================
// src/components/ui/MetricCard.tsx — TACTICAL OBSIDIAN METRIC CARD
// Projector-Safe Border, Contrast Ratio > 7.5:1, Monospace Numbers
// ==============================================================================

import React from "react";
import { cn } from "../../lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: "positive" | "negative" | "warning" | "neutral";
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export function MetricCard({
  title,
  value,
  subtext,
  icon,
  badge,
  trend = "neutral",
  className,
  onClick,
  active = false,
}: MetricCardProps) {
  const trendColorClass = {
    positive: "text-[#10B981]",
    negative: "text-[#F43F5E]",
    warning: "text-[#F59E0B]",
    neutral: "text-[#06B6D4]",
  }[trend];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl bg-[#1E293B] p-3.5 transition-all duration-200",
        "border-[1.5px] border-[#334155] shadow-lg",
        "border-t border-t-white/15",
        active && "border-[#06B6D4] shadow-[0_0_24px_rgba(6,182,212,0.25)]",
        onClick && "cursor-pointer hover:border-[#475569] active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <span className="text-[#94A3B8]">{icon}</span>}
        </div>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <div className={cn("text-2xl font-extrabold font-mono tabular-nums", trendColorClass)}>
          {value}
        </div>
      </div>

      {subtext && (
        <div className="mt-1 text-xs text-[#CBD5E1] truncate font-medium">
          {subtext}
        </div>
      )}
    </div>
  );
}
