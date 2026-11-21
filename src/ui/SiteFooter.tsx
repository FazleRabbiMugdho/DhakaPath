"use client";

// ==============================================================================
// src/ui/SiteFooter.tsx — the full dark footer from the landing page, shared by
// every route so /, /app and /admin all end with the same brand footer.
// ==============================================================================

import Link from "next/link";
import { Route, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";

const FOOTER_COLS = [
  { h: { bn: "প্ল্যাটফর্ম", en: "Platform" }, hrefs: ["/app#plan", "/app#plan", "/app#network", "/app#plan"], items: { bn: ["মাল্টি-লেগ রুট", "স্টুডেন্ট ফেয়ার", "মেট্রো MRT-6", "রাইড-শেয়ার পুল"], en: ["Multi-leg routing", "Student fares", "MRT-6 metro", "Ride-share pool"] } },
  { h: { bn: "ট্রাস্ট", en: "Trust" }, hrefs: ["/app#alerts", "/app#alerts", "/app#alerts", "/app#network"], items: { bn: ["ক্রাউড অ্যালার্ট", "বেইজিয়ান ডিকে", "ভাড়া যাচাই", "রুট গ্রাউন্ডিং"], en: ["Crowd alerts", "Bayesian decay", "Fare sanity check", "Route grounding"] } },
  { h: { bn: "অ্যাপ", en: "App" }, hrefs: ["/app#plan", "/app#alerts", "/app#network", "/app#plan"], items: { bn: ["ট্রিপ প্ল্যান", "লাইভ অ্যালার্ট", "ট্রানজিট নেটওয়ার্ক", "অফলাইন কার্ড"], en: ["Plan a trip", "Live alerts", "Transit network", "Offline card"] } },
];

const T = {
  footerTagline: {
    bn: "মাল্টি-অবজেক্টিভ স্প্যাটিও-টেম্পোরাল ট্রানজিট ইঞ্জিন ও জিরো-হ্যালুসিনেশন রুট ভেরিফায়ার। স্মার্ট সিটি ট্রানজিট প্ল্যাটফর্ম।",
    en: "Multi-objective spatio-temporal transit engine and zero-hallucination route verifier. Smart City Transit Platform.",
  },
  copyright: { bn: "© ২০২৬ DhakaPath · স্মার্ট সিটি ট্রানজিট প্ল্যাটফর্ম", en: "© 2026 DhakaPath · Smart City Transit Platform" },
  madeIn: { bn: "ঢাকায় 💚 দিয়ে তৈরি", en: "Made with 💚 in Dhaka" },
};

export function SiteFooter() {
  const { lang } = useLang();

  return (
    <footer className="text-[#B7D7C3]">
      {/* Dhaka rises out of the footer: a pale far range behind the deep near range. */}
      <div aria-hidden className="relative h-20 sm:h-28 overflow-hidden">
        <div className="dp-motif dp-motif-ridge absolute inset-x-0 bottom-0 h-[115%] bg-[#0B3321]/[0.13] [--ridge-offset:-1180px]" />
        <div className="dp-motif dp-motif-ridge absolute inset-x-0 bottom-0 h-full bg-[#0B3321]" />
      </div>
      <div className="bg-[#0B3321]">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 lg:pb-14">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1BA94B] text-white">
                  <Route className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <span className="font-sans text-[19px] font-extrabold tracking-tight text-white">DhakaPath</span>
              </div>
              <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#8FB8A0]">{T.footerTagline[lang]}</p>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.h.en}>
                <h3 className="text-[14px] font-bold uppercase tracking-wide text-white">{col.h[lang]}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.items[lang].map((it, idx) => (
                    <li key={it}>
                      <Link href={col.hrefs[idx]} className="text-[14px] text-[#8FB8A0] transition-colors hover:text-white">{it}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-[#7FA891] sm:flex-row">
            <span>{T.copyright[lang]}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wide">
              <Sparkles className="h-3 w-3 text-[#34D399]" /> Live Transit Simulation — Benchmark Replay
            </span>
            <span>{T.madeIn[lang]}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
