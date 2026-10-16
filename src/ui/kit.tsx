"use client";

// ==============================================================================
// src/ui/kit.tsx — DhakaPath design primitives (light, white + green, Pathao grammar)
// White rounded cards, mint tags, pill buttons, soft green shadows. Status is always
// dual-coded: an icon + a text label + a tone, never colour alone.
// ==============================================================================

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("rounded-3xl border border-line bg-white shadow-card", className)}>
      {children}
    </div>
  );
}

export type Tone = "green" | "amber" | "red" | "blue" | "gray";

const TONE: Record<Tone, string> = {
  green: "border-[#CDEBD7] bg-brand-soft text-brand-dark",
  amber: "border-warn-line bg-warn-bg text-warn",
  red: "border-danger-line bg-danger-bg text-danger",
  blue: "border-info-line bg-info-bg text-info",
  gray: "border-line bg-[#F1F5F2] text-ink-soft",
};

export function Pill({
  tone = "gray",
  icon,
  className,
  children,
  title,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold leading-none", TONE[tone], className)}
    >
      {icon}
      {children}
    </span>
  );
}

type Variant = "primary" | "outline" | "soft" | "danger" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-cta hover:bg-brand-dark",
  outline: "border-[1.5px] border-line bg-white text-brand-dark hover:border-brand",
  soft: "bg-brand-soft text-brand-dark hover:bg-[#D3EDDC]",
  danger: "border border-danger-line bg-danger-bg text-danger hover:bg-[#FEE2E2]",
  ghost: "text-ink-soft hover:bg-brand-soft hover:text-brand-dark",
};

export function Btn({
  variant = "primary",
  size = "md",
  busy,
  icon,
  className,
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "sm";
  busy?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-55",
        size === "md" ? "px-5 py-3 text-[15px]" : "px-3.5 py-2 text-[13px]",
        VARIANT[variant],
        className
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  icon,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
        checked ? "border-[#CDEBD7] bg-brand-mint" : "border-line bg-white hover:border-[#BFDCC9]"
      )}
    >
      {icon && <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", checked ? "bg-brand-soft text-brand-dark" : "bg-[#F1F5F2] text-ink-soft")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-tight text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">{hint}</span>}
      </span>
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-brand" : "bg-[#CBD5CF]")} aria-hidden="true">
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: React.ReactNode; title?: string; disabled?: boolean }>;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex flex-wrap gap-1 rounded-full border border-line bg-white p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3.5 py-2 text-[13px] font-bold transition-all disabled:cursor-wait",
              active ? "bg-brand text-white shadow-cta" : "text-ink-soft hover:bg-brand-soft hover:text-brand-dark"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[22px] font-extrabold leading-tight tracking-tight text-ink sm:text-[26px]">{title}</h2>
        {sub && <p className="mt-1 text-[14px] leading-snug text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Meter({ pct, tone = "green", label }: { pct: number; tone?: "green" | "amber" | "red" | "gray"; label: string }) {
  const safe = Math.min(100, Math.max(0, Number.isFinite(pct) ? pct : 0));
  const fill = { green: "bg-brand", amber: "bg-[#F59E0B]", red: "bg-danger", gray: "bg-[#B6C4BB]" }[tone];
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safe)} className="h-2 w-full overflow-hidden rounded-full bg-[#E8F1EA]">
      <div className={cn("h-full rounded-full transition-all duration-500", fill)} style={{ width: `${safe}%` }} />
    </div>
  );
}

export const inputCls =
  "w-full rounded-2xl border-[1.5px] border-line bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint transition-colors focus:border-brand focus:outline-none";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-faint">{hint}</span>}
    </label>
  );
}
