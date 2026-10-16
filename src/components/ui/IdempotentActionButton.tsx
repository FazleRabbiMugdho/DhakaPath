"use client";

// ==============================================================================
// src/components/ui/IdempotentActionButton.tsx — ACTION BUTTON WITH LOCK STATE
// Prevents Double-Click Race Conditions with High-Agency Micro-Copy
// ==============================================================================

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { ActionLockState } from "../../contracts/schema";
import { Loader2, Check } from "lucide-react";

interface IdempotentActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  lockState?: ActionLockState;
  variant?: "primary" | "secondary" | "danger" | "amber" | "outline";
  onAction?: () => Promise<void> | void;
  icon?: React.ReactNode;
  successLabel?: string;
  autoResetMs?: number;
}

export function IdempotentActionButton({
  children,
  lockState = ActionLockState.IDLE,
  variant = "primary",
  onAction,
  icon,
  successLabel = "Action Completed",
  autoResetMs = 1200,
  className,
  disabled,
  onClick,
  ...props
}: IdempotentActionButtonProps) {
  const [internalState, setInternalState] = useState<ActionLockState>(lockState);
  const activeState = lockState !== ActionLockState.IDLE ? lockState : internalState;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (activeState === ActionLockState.PROCESSING) return;

    if (onAction) {
      setInternalState(ActionLockState.PROCESSING);
      try {
        await onAction();
        setInternalState(ActionLockState.RESOLVED);
        setTimeout(() => {
          setInternalState(ActionLockState.IDLE);
        }, autoResetMs);
      } catch {
        setInternalState(ActionLockState.IDLE);
      }
    } else if (onClick) {
      onClick(e);
    }
  };

  const variantStyles = {
    primary:
      "bg-[#06B6D4] text-[#083344] font-bold hover:bg-[#22D3EE] border-transparent shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    secondary:
      "bg-[#1E293B] text-[#F1F5F9] hover:bg-[#334155] border-[#475569] shadow-md",
    danger:
      "bg-[#4C0519] text-[#FDA4AF] border-[#F43F5E] hover:bg-[#881337] shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    amber:
      "bg-[#451A03] text-[#FDE68A] border-[#F59E0B] hover:bg-[#78350F] shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    outline:
      "bg-transparent text-[#CBD5E1] border-[#334155] hover:border-[#06B6D4] hover:text-white",
  }[variant];

  const isProcessing = activeState === ActionLockState.PROCESSING;
  const isResolved = activeState === ActionLockState.RESOLVED;

  return (
    <button
      {...props}
      disabled={disabled || isProcessing}
      onClick={handleClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider",
        "border-[1.5px] transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles,
        isProcessing && "border-[#06B6D4] ring-2 ring-[#06B6D4]/40 cursor-wait",
        className
      )}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : isResolved ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#10B981]" />
          <span>{successLabel}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
