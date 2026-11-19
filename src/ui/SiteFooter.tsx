"use client";

// ==============================================================================
// src/ui/SiteFooter.tsx — the full dark footer from the landing page, shared by
// every route so /, /app and /admin all end with the same brand footer.
// ==============================================================================

import Link from "next/link";
import { Route, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";

const SOCIALS = [
  { name: "Facebook", d: "M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14v-2a1 1 0 0 1 1-1z" },
  { name: "Instagram", d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5-1.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z" },
  { name: "X", d: "M4 4h4l4 5.5L16.5 4H20l-6 7.8L20.5 20H16l-4.3-5.9L6.8 20H3.5l6.4-8.2z" },
];

const FOOTER_COLS = [
  { h: { bn: "প্ল্যাটফর্ম", en: "Platform" }, hrefs: ["/app#plan", "/app#plan", "/app#network", "/app#plan"], items: { bn: ["মাল্টি-লেগ রুট", "স্টুডেন্ট ফেয়ার", "মেট্রো MRT-6", "রাইড-শেয়ার পুল"], en: ["Multi-leg routing", "Student fares", "MRT-6 metro", "Ride-share pool"] } },
  { h: { bn: "ট্রাস্ট", en: "Trust" }, hrefs: ["/app#alerts", "/app#alerts", "/app#alerts", "/app#network"], items: { bn: ["ক্রাউড অ্যালার্ট", "বেইজিয়ান ডিকে", "ভাড়া যাচাই", "রুট গ্রাউন্ডিং"], en: ["Crowd alerts", "Bayesian decay", "Fare sanity check", "Route grounding"] } },
  { h: { bn: "অ্যাপ", en: "App" }, hrefs: ["/app#plan", "/app#alerts", "/app#network", "/app#plan"], items: { bn: ["ট্রিপ প্ল্যান", "লাইভ অ্যালার্ট", "ট্রানজিট নেটওয়ার্ক", "অফলাইন কার্ড"], en: ["Plan a trip", "Live alerts", "Transit network", "Offline card"] } },
];

const T = {
  footerTagline: {
    bn: "মাল্টি-অবজেক্টিভ স্প্যাটিও-টেম্পোরাল ট্রানজিট ইঞ্জিন ও জিরো-হ্যালুসিনেশন রুট ভেরিফায়ার। INIF 2026 স্মার্ট সিটি হ্যাকাথন।",
    en: "Multi-objective spatio-temporal transit engine and zero-hallucination route verifier. INIF 2026 Smart City Hackathon.",
  },
  copyright: { bn: "© ২০২৬ DhakaPath · INIF স্মার্ট সিটি হ্যাকাথন", en: "© 2026 DhakaPath · INIF Smart City Hackathon" },
  madeIn: { bn: "ঢাকায় 💚 দিয়ে তৈরি", en: "Made with 💚 in Dhaka" },
};

export function SiteFooter() {
  const { lang } = useLang();

  return (
    <footer className="bg-[#0B3321] text-[#B7D7C3]">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-14 sm:px-6 lg:pb-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1BA94B] text-white">
                <Route className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <span className="font-sans text-[19px] font-extrabold tracking-tight text-white">DhakaPath</span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#8FB8A0]">{T.footerTagline[lang]}</p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a key={s.name} href="#" aria-label={s.name} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-[#8FB8A0] transition-colors hover:border-[#1BA94B] hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d={s.d} /></svg>
                </a>
              ))}
            </div>
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
            <Sparkles className="h-3 w-3 text-[#34D399]" /> Simulated Demo Telemetry — Benchmark Replay
          </span>
          <span>{T.madeIn[lang]}</span>
        </div>
      </div>
    </footer>
  );
}
