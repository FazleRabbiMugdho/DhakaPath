"use client";

// Demo story: the 25-second stage opener. Three proof counters and one button into the live app.

import React, { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Gauge, ShieldCheck, Sparkles, Timer, X } from "lucide-react";
import { useLang } from "@/lib/i18n";

function Counter({ to, decimals, suffix, label, icon }: { to: number; decimals: number; suffix: string; label: string; icon: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { n } = useLang();
  const [v, setV] = useState<number>(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, to, { duration: 1.3, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => c.stop();
  }, [to, reduce]);
  return (
    <div className="rounded-2xl border border-line bg-brand-mint p-4">
      <div className="flex items-center gap-1.5 text-[13px] font-bold text-brand-dark">{icon}{label}</div>
      <div className="mt-1 text-[34px] font-extrabold leading-none tabular-nums text-brand">
        {n(v.toFixed(decimals))}
        <span className="text-[18px] text-ink-soft">{suffix}</span>
      </div>
    </div>
  );
}

export function PitchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
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
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#0B3321]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t("ডেমো স্টোরি", "Demo story")}
          onClick={onClose}
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl border border-line bg-white p-6 shadow-card sm:p-9"
          >
            <button type="button" onClick={onClose} aria-label={t("বন্ধ করুন", "Close")} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft hover:border-brand hover:text-brand-dark">
              <X className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#CDEBD7] bg-brand-soft px-3.5 py-1.5 text-[13px] font-bold text-brand-dark">
              <Sparkles className="h-3.5 w-3.5" />
              {t("বাংলাদেশের জন্য নির্ণায়ক ট্রানজিট ইঞ্জিন", "Deterministic transit engine for Bangladesh")}
            </span>
            <h2 className="mt-4 text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[46px]">
              {t("ঢাকা চলে ৪.৮ কিমি/ঘ-এ।", "Dhaka crawls at 4.8 km/h.")}
              <br />
              <span className="text-brand">{t("DhakaPath পথ খুঁজে দেয়।", "DhakaPath finds the way.")}</span>
            </h2>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink-soft">
              {t("ভুয়া অ্যালার্ট ছেঁকে, স্টুডেন্ট ভাড়া ঠিকঠাক হিসাব করে, যাচাই করা রুট — মিলিসেকেন্ডে, ইন্টারনেট ছাড়াও।", "Fake alerts filtered, student fares exact, every route verified — in milliseconds, even offline.")}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Counter to={4.8} decimals={1} suffix={t(" কিমি/ঘ", " km/h")} label={t("জ্যাম এড়ানো গতি", "Gridlock bypassed")} icon={<Gauge className="h-4 w-4" />} />
              <Counter to={0.78} decimals={2} suffix=" ms" label={t("রুট সার্চ", "Route search")} icon={<Timer className="h-4 w-4" />} />
              <Counter to={1.4} decimals={1} suffix={t(" সে.", " sec")} label={t("যাচাই করা রুট", "Verified route")} icon={<ShieldCheck className="h-4 w-4" />} />
            </div>
            <button type="button" onClick={onClose} className="group mt-7 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-[16px] font-bold text-white shadow-cta transition-all hover:bg-brand-dark active:scale-95">
              {t("লাইভ অ্যাপে যান", "Enter the live app")}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
