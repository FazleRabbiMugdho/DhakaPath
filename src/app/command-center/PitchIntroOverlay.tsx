"use client";

// ==============================================================================
// src/app/command-center/PitchIntroOverlay.tsx — HOLOGRAPHIC NIGHT CITY PITCH
// 25-second stage intro: glowing thesis badge, tight-tracked headline with a
// gradient word, a 3D-tilted glass telemetry frame, 3 animated proof counters,
// and a primary "Enter Live Command Center" button that closes the overlay.
// ==============================================================================

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, animate } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Gauge, ShieldCheck, X } from "lucide-react";

interface PitchIntroOverlayProps {
  open: boolean;
  onClose: () => void;
}

function ProofCounter({ to, decimals, suffix, label, icon, accent }: { to: number; decimals: number; suffix: string; label: string; icon: React.ReactNode; accent: string }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState<number>(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => c.stop();
  }, [to, reduce]);
  return (
    <div className="rounded-2xl border-[1.5px] border-[#1E293B] bg-[#0F172A]/70 p-4" style={{ borderTopColor: "rgba(255,255,255,0.12)" }}>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: accent }}>
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 font-mono text-[30px] font-extrabold tabular-nums text-white">
        {v.toFixed(decimals)}
        <span className="text-[18px]" style={{ color: accent }}>{suffix}</span>
      </div>
    </div>
  );
}

export function PitchIntroOverlay({ open, onClose }: PitchIntroOverlayProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[#050811]/92 p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="DhakaPath pitch intro"
        >
          {/* aurora glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-[#3B82F6]/20 blur-[140px]" />
            <div className="absolute top-1/3 -right-20 h-[560px] w-[560px] rounded-full bg-[#06B6D4]/20 blur-[150px]" />
          </div>

          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 28, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-2 right-0 grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-[#334155] bg-[#0F172A] text-[#94A3B8] transition-all hover:border-[#06B6D4]/60 hover:text-white"
              aria-label="Close pitch overlay"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#06B6D4]/50 bg-[#083344]/60 px-3 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-wide text-[#67E8F9] shadow-[0_0_24px_rgba(6,182,212,0.3)]">
                  <Sparkles className="h-3.5 w-3.5" /> Deterministic Spatio-Temporal Engine for Bangladesh
                </span>
                <h1 className="mt-5 font-sans text-[44px] font-extrabold leading-[1.02] tracking-tight text-white sm:text-[60px]">
                  Dhaka moves at{" "}
                  <span className="bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] bg-clip-text text-transparent">4.8 km/h.</span>
                  <br />
                  DhakaPath routes around it.
                </h1>
                <p className="mt-4 max-w-xl font-sans text-[16px] leading-relaxed text-[#94A3B8]">
                  Crowd-verified street alerts, statutory student fares, and Banglish trip queries become a mathematically grounded multi-leg detour and exact BDT split — in milliseconds, fully offline-safe.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#06B6D4] px-6 py-3 font-sans text-[15px] font-bold text-[#083344] shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all hover:bg-[#22D3EE] active:scale-95"
                >
                  Enter Live 15-Hub Command Center
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* 3D-tilted glass telemetry frame */}
              <div className="[perspective:1400px]">
                <motion.div
                  initial={reduce ? { opacity: 0 } : { rotateY: -14, rotateX: 8, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { rotateY: -9, rotateX: 6, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-3xl border-[1.5px] border-[#06B6D4]/40 bg-[#0B1220]/80 p-4 shadow-[0_40px_120px_-30px_rgba(6,182,212,0.5)] backdrop-blur-xl"
                  style={{ borderTopColor: "rgba(255,255,255,0.18)" }}
                >
                  <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-[#67E8F9]">
                    <span>⚡ ENGINE 0.78ms</span>
                    <span>V(P*)=1</span>
                  </div>
                  <div className="space-y-2.5">
                    <ProofCounter to={4.8} decimals={1} suffix=" km/h" label="Peak Gridlock Bypassed" icon={<Gauge className="h-3.5 w-3.5" />} accent="#F43F5E" />
                    <ProofCounter to={0.78} decimals={2} suffix=" ms" label="Pareto Graph Search" icon={<Zap className="h-3.5 w-3.5" />} accent="#06B6D4" />
                    <ProofCounter to={1.4} decimals={1} suffix=" sec" label="Route + Fare Verification" icon={<ShieldCheck className="h-3.5 w-3.5" />} accent="#10B981" />
                  </div>
                  <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-wide text-[#475569]">
                    8.5 min manual → 1.4 sec · simulated demo benchmark
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
