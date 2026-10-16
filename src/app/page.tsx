"use client";

// ==============================================================================
// src/app/page.tsx — WAVE 2 PUBLIC LANDING (Pathao-style, light + green)
// Bilingual (বাংলা / English) super-app home. The language toggle swaps every
// string and applies the correct typeface (Hind Siliguri for Bangla so Bengali
// glyphs render properly; Plus Jakarta Sans for English). Green replaces Pathao
// red. Primary CTA opens the live 4-zone command center.
// ==============================================================================

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { animate, useReducedMotion } from "framer-motion";
import {
  Menu, X, ArrowRight, GraduationCap, ShieldCheck, WifiOff, Users,
  Route, Zap, Gauge, CheckCircle2, Languages,
  Clock, Wallet, ChevronRight, Sparkles,
} from "lucide-react";

type Lang = "bn" | "en";

// Western → Bangla digit localisation for dynamic numbers.
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function toBnDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
}
function locNum(s: string, lang: Lang): string {
  return lang === "bn" ? toBnDigits(s) : s;
}

// Authored brand glyphs (lucide brand icons are unavailable in this version).
const SOCIALS = [
  { name: "Facebook", d: "M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14v-2a1 1 0 0 1 1-1z" },
  { name: "Instagram", d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5-1.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z" },
  { name: "X", d: "M4 4h4l4 5.5L16.5 4H20l-6 7.8L20.5 20H16l-4.3-5.9L6.8 20H3.5l6.4-8.2z" },
];

// ---------------------------------------------------------------------------
// Bilingual content
// ---------------------------------------------------------------------------
const NAV: { href: string; bn: string; en: string }[] = [
  { href: "#services", bn: "সার্ভিস", en: "Services" },
  { href: "#modes", bn: "মোডসমূহ", en: "Modes" },
  { href: "#trust", bn: "নিরাপত্তা", en: "Safety" },
  { href: "#how", bn: "কিভাবে কাজ করে", en: "How it works" },
];

const MODES = [
  { icon: "/icons/mode-metro.svg", bn: "মেট্রো রেল", en: "MRT-6 Metro" },
  { icon: "/icons/mode-bus.svg", bn: "বাস", en: "BRTC Bus" },
  { icon: "/icons/mode-leguna.svg", bn: "লেগুনা", en: "Leguna" },
  { icon: "/icons/mode-rickshaw.svg", bn: "রিকশা", en: "Rickshaw" },
  { icon: "/icons/mode-cng.svg", bn: "সিএনজি", en: "CNG Auto" },
  { icon: "/icons/mode-bicycle.svg", bn: "ওয়াক-ব্রিজ", en: "Walk-Bridge" },
];

const SERVICES = [
  {
    icon: <Route className="h-5 w-5" />,
    art: "/icons/mode-metro.svg",
    tag: { bn: "মাল্টি-মোডাল রুট", en: "Multi-modal routing" },
    title: { bn: "যাচাই করা মাল্টি-লেগ ডিটোর", en: "Verified multi-leg detours" },
    body: {
      bn: "মনসুনে পানি উঠলে বা ব্লকেড হলে — বাস, মেট্রো আর শেয়ার্ড রিকশা মিলিয়ে গাণিতিকভাবে প্রমাণিত সেরা পথ, ঠিক ০.৭৮ মিলিসেকেন্ডে।",
      en: "When monsoon floods or blockades hit, buses, metro and shared rickshaws combine into a mathematically proven best path — in just 0.78 ms.",
    },
    bullets: {
      bn: ["Pareto label-setting Dijkstra", "১৬-বিট সাইকেল গার্ড", "১০০% গ্রাউন্ডেড রুট V(P*)=1"],
      en: ["Pareto label-setting Dijkstra", "16-bit cycle guard", "100% grounded route V(P*)=1"],
    },
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    art: "/icons/mode-bus.svg",
    tag: { bn: "স্টুডেন্ট ট্যারিফ", en: "Student tariff" },
    title: { bn: "স্টুডেন্ট হাফ-পাস, সঠিক ভাড়া", en: "Student half-pass, exact fare" },
    body: {
      bn: "লোকাল বাসে ৫০% ছাড় আর ১০ টাকা ফ্লোর, মেট্রোতে শূন্য ছাড় — প্রতিটি লেগের ভাড়া আইন মেনে আলাদা করে হিসাব।",
      en: "50% off on local buses with a 10 BDT floor, zero discount on the metro — every leg's fare computed separately, exactly per statute.",
    },
    bullets: {
      bn: ["max(10, ⌈0.5·ভাড়া⌉) ফ্লোর", "MRT-6: 20–100 BDT স্টেপ", "শূন্য LLM অ্যারিথমেটিক"],
      en: ["max(10, ⌈0.5·fare⌉) floor", "MRT-6: 20–100 BDT step", "Zero LLM arithmetic"],
    },
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    art: "/icons/mode-cng.svg",
    tag: { bn: "ক্রাউড ট্রাস্ট", en: "Crowd trust" },
    title: { bn: "ভুয়া অ্যালার্ট ছেঁকে ফেলা", en: "Filtering out fake alerts" },
    body: {
      bn: "ফেসবুক পোস্ট নয় — ক্রাউড-ভেরিফায়েড স্ট্রিট অ্যালার্ট, ৩০ মিনিট হাফ-লাইফ ডিকে আর বেইজিয়ান লগ-অডস দিয়ে সত্য যাচাই।",
      en: "Not Facebook posts — crowd-verified street alerts validated with a 30-minute half-life decay and Bayesian log-odds.",
    },
    bullets: {
      bn: ["λ = ln2/30 ডিকে কার্নেল", "ANOMALOUS_FARE_REJECTED", "স্পুফ ভোট কোয়ারেন্টাইন"],
      en: ["λ = ln2/30 decay kernel", "ANOMALOUS_FARE_REJECTED", "Spoof-vote quarantine"],
    },
  },
  {
    icon: <WifiOff className="h-5 w-5" />,
    art: "/icons/mode-bicycle.svg",
    tag: { bn: "অফলাইন সারভাইভাল", en: "Offline survival" },
    title: { bn: "ব্যাটারি শেষ? ইন্টারনেট নেই?", en: "Dead battery? No internet?" },
    body: {
      bn: "৪৫ কিলোবাইটের নিচে HTML5 ক্যানভাস রুট কার্ড আর জিরো-ব্যান্ডউইথ ভয়েস ব্রিফিং — ৩জি ড্রপ বা ৫% চার্জেও কাজ করে।",
      en: "A sub-45 KB HTML5 canvas route card and zero-bandwidth voice briefing — works on a 3G drop or at 5% charge.",
    },
    bullets: {
      bn: ["<45 KB PNG এক্সপোর্ট", "Web Speech ব্রিফিং", "জিরো এক্সটার্নাল ইমেজ"],
      en: ["<45 KB PNG export", "Web Speech briefing", "Zero external images"],
    },
  },
];

const STATS = [
  { value: { bn: "৪.৮", en: "4.8" }, suffix: " km/h", label: { bn: "পিক গ্রিডলক বাইপাস", en: "Peak gridlock bypassed" } },
  { value: { bn: "০.৭৮", en: "0.78" }, suffix: " ms", label: { bn: "Pareto গ্রাফ সার্চ", en: "Pareto graph search" } },
  { value: { bn: "১৫", en: "15" }, suffix: "", label: { bn: "ক্যানোনিকাল হাব", en: "Canonical hubs" } },
  { value: { bn: "৮.৫মি→১.৪সে", en: "8.5m→1.4s" }, suffix: "", label: { bn: "রুট ও ভাড়া যাচাই", en: "Route & fare verification" } },
];

const T = {
  headerCta: { bn: "লাইভ কমান্ড সেন্টার", en: "Live Command Center" },
  langLabel: { bn: "English", en: "বাংলা" }, // shows the OTHER language to switch to
  heroBadge: { bn: "দেশের ১ নম্বর ট্রানজিট ভেরিফায়ার", en: "Bangladesh's #1 transit verifier" },
  heroH1a: { bn: "ঢাকার পথ,", en: "Dhaka's routes," },
  heroH1green: { bn: "এক অ্যাপেই", en: "one app," },
  heroH1b: { bn: "সমাধান।", en: "one answer." },
  heroP: {
    bn: "বাংলিশে প্রশ্ন করুন — “মিরপুর ১০ থেকে মতিঝিল, স্টুডেন্ট পাস, ৫৫ টাকায়”। ক্রাউড-ভেরিফায়েড অ্যালার্ট আর আইনি ভাড়া মিলিয়ে সঠিক মাল্টি-লেগ রুট আর ভাড়ার ভাগ, মিলিসেকেন্ডে।",
    en: "Ask in Banglish — “Mirpur 10 to Motijheel, student pass, within 55 BDT”. Crowd-verified alerts and statutory fares combine into the right multi-leg route and fare split, in milliseconds.",
  },
  heroCta1: { bn: "লাইভ কমান্ড সেন্টার দেখুন", en: "See the Live Command Center" },
  heroCta2: { bn: "সার্ভিস জানুন", en: "Explore services" },
  heroNote: { bn: "কোনো লগইন নেই · ১০০% অফলাইন-সেফ · সিমুলেটেড ডেমো টেলিমেট্রি", en: "No login · 100% offline-safe · simulated demo telemetry" },
  modesEyebrow: { bn: "DhakaPath প্ল্যাটফর্ম", en: "DhakaPath platform" },
  modesTitle: { bn: "এক গ্রাফে ঢাকার সব মোড", en: "Every Dhaka mode in one graph" },
  servicesEyebrow: { bn: "সার্ভিসসমূহ", en: "Services" },
  servicesTitle: { bn: "যে সমস্যাগুলো DhakaPath সমাধান করে", en: "Problems DhakaPath solves" },
  trustEyebrow: { bn: "#আপনার পথে নির্ভরযোগ্য", en: "#HereOnYourRoute" },
  trustTitle: { bn: "ভুয়া রিপোর্ট নয়, যাচাই করা সত্য", en: "Not fake reports — verified truth" },
  trustP: {
    bn: "তিন-স্তরের প্রতিরক্ষা: রুল-ভিত্তিক স্যানিটি গেট, রিকার্সিভ বেইজিয়ান লগ-অডস, আর SAT-অনুপ্রাণিত সাবগ্রাফ গ্রাউন্ডিং। একটি স্পুফড ৫০০ টাকার বাস ভাড়া বা কাল্পনিক “আন্ডারগ্রাউন্ড ফেরি” মুহূর্তেই ইন্টারসেপ্ট হয়।",
    en: "Three tiers of defense: a rule-based sanity gate, recursive Bayesian log-odds, and SAT-inspired subgraph grounding. A spoofed 500 BDT bus fare or a fictional “underground ferry” is intercepted instantly.",
  },
  trustLink: { bn: "ট্রাস্ট শিল্ড দেখুন", en: "See the trust shield" },
  poolBadge: { bn: "হাব রাইড-শেয়ার পুল", en: "Hub ride-share pool" },
  poolTitle: { bn: "সার্জ করা ৯০ টাকার রিকশা, ভাগ করে ৩০ টাকা", en: "A surged 90 BDT rickshaw, split to 30 BDT" },
  poolP: {
    bn: "একই হাব থেকে সহযাত্রী খুঁজে পুল তৈরি করুন (২/৪ → ৩/৪)। মনসুন সার্জে লাস্ট-মাইল কানেক্টর ভাড়া নিমেষে কমে যায় — ডাবল-ক্লিক আইডেমপোটেন্সি লকসহ।",
    en: "Find co-riders at the same hub and form a pool (2/4 → 3/4). Monsoon-surged last-mile fares drop instantly — with a double-click idempotency lock.",
  },
  poolCta: { bn: "পুল জয়েন করুন", en: "Join a pool" },
  poolPer: { bn: "মাথাপিছু ভাড়া", en: "Per-person fare" },
  dlTitle: { bn: "ইন্টারনেট ছাড়াই পুরো রুট হাতে", en: "The full route in hand, no internet" },
  dlP: {
    bn: "৪৫ কিলোবাইটের নিচে ক্যানভাস রুট কার্ড ডাউনলোড করুন, কিংবা ভয়েস ব্রিফিং শুনুন — ৩জি ড্রপ বা ডেড ব্যাটারিতেও।",
    en: "Download a sub-45 KB canvas route card or hear a voice briefing — even on a 3G drop or a dead battery.",
  },
  dlCta1: { bn: "কমান্ড সেন্টার", en: "Command center" },
  dlCta2: { bn: "অফলাইন কার্ড ট্রাই করুন", en: "Try the offline card" },
  footerTagline: {
    bn: "মাল্টি-অবজেক্টিভ স্প্যাটিও-টেম্পোরাল ট্রানজিট ইঞ্জিন ও জিরো-হ্যালুসিনেশন রুট ভেরিফায়ার। INIF 2026 স্মার্ট সিটি হ্যাকাথন।",
    en: "Multi-objective spatio-temporal transit engine and zero-hallucination route verifier. INIF 2026 Smart City Hackathon.",
  },
  copyright: { bn: "© ২০২৬ DhakaPath · INIF স্মার্ট সিটি হ্যাকাথন", en: "© 2026 DhakaPath · INIF Smart City Hackathon" },
  madeIn: { bn: "ঢাকায় 💚 দিয়ে তৈরি", en: "Made with 💚 in Dhaka" },
};

const FOOTER_COLS = [
  { h: { bn: "প্ল্যাটফর্ম", en: "Platform" }, items: { bn: ["মাল্টি-লেগ রুট", "স্টুডেন্ট ফেয়ার", "মেট্রো MRT-6", "রাইড-শেয়ার পুল"], en: ["Multi-leg routing", "Student fares", "MRT-6 metro", "Ride-share pool"] } },
  { h: { bn: "ট্রাস্ট", en: "Trust" }, items: { bn: ["ক্রাউড অ্যালার্ট", "বেইজিয়ান ডিকে", "স্যানিটি গেট", "সাবগ্রাফ গ্রাউন্ডিং"], en: ["Crowd alerts", "Bayesian decay", "Sanity gate", "Subgraph grounding"] } },
  { h: { bn: "ট্র্যাক", en: "Tracks" }, items: { bn: ["Pareto ইঞ্জিন", "ট্রাস্ট CMS", "বাংলিশ কমিউট", "ম্যাপ শেল"], en: ["Pareto engine", "Trust CMS", "Banglish commute", "Map shell"] } },
];

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bn = lang === "bn";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div lang={lang} className={`relative z-10 w-full bg-[#F6FBF4] text-[#0E2A1A] ${bn ? "font-bangla" : "font-sans"}`}>
      {/* ===================== HEADER ===================== */}
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all ${
          scrolled ? "border-[#DCEDE2] bg-white/90 shadow-[0_6px_24px_-16px_rgba(16,42,26,0.4)] backdrop-blur-md" : "border-transparent bg-white/70 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1BA94B] text-white shadow-[0_6px_18px_-6px_rgba(27,169,75,0.7)]">
              <Route className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="font-sans text-[19px] font-extrabold tracking-tight text-[#0E2A1A]">
              Dhaka<span className="text-[#1BA94B]">Path</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[15px] font-semibold text-[#2C4536] transition-colors hover:bg-[#E3F4E9] hover:text-[#15863B]">
                {l[lang]}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(bn ? "en" : "bn")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#DCEDE2] px-3 py-2 text-[13px] font-semibold text-[#4C6356] transition-colors hover:border-[#1BA94B] hover:text-[#15863B]"
              aria-label="Toggle language"
            >
              <Languages className="h-3.5 w-3.5" /> {T.langLabel[lang]}
            </button>
            <Link href="/command-center" className="inline-flex items-center gap-1.5 rounded-full bg-[#1BA94B] px-4 py-2.5 text-[14px] font-bold text-white shadow-[0_10px_26px_-10px_rgba(27,169,75,0.8)] transition-all hover:bg-[#15863B] active:scale-95">
              {T.headerCta[lang]}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={() => setMenuOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-[#DCEDE2] text-[#2C4536] lg:hidden" aria-label="Menu" aria-expanded={menuOpen}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#DCEDE2] bg-white px-4 py-3 lg:hidden">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-semibold text-[#2C4536] hover:bg-[#E3F4E9]">
                {l[lang]}
                <ChevronRight className="h-4 w-4 text-[#9BB3A4]" />
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-[#1BA94B]/10 blur-3xl" />
          <div className="absolute -right-10 top-40 h-[360px] w-[360px] rounded-full bg-[#34D399]/10 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#CDEBD7] bg-[#E3F4E9] px-3.5 py-1.5 text-[13px] font-bold text-[#15863B]">
              <Sparkles className="h-3.5 w-3.5" /> {T.heroBadge[lang]}
            </span>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-[#0E2A1A] sm:text-[58px]">
              {T.heroH1a[lang]}<br />
              <span className="text-[#1BA94B]">{T.heroH1green[lang]}</span> {T.heroH1b[lang]}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#4C6356]">{T.heroP[lang]}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/command-center" className="group inline-flex items-center gap-2 rounded-full bg-[#1BA94B] px-6 py-3.5 text-[16px] font-bold text-white shadow-[0_16px_36px_-12px_rgba(27,169,75,0.85)] transition-all hover:bg-[#15863B] active:scale-95">
                {T.heroCta1[lang]}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#services" className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#CDEBD7] bg-white px-6 py-3.5 text-[16px] font-bold text-[#15863B] transition-all hover:border-[#1BA94B] active:scale-95">
                {T.heroCta2[lang]}
              </a>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[#6B8275]">
              <CheckCircle2 className="h-4 w-4 text-[#1BA94B]" />
              {T.heroNote[lang]}
            </div>
          </div>

          <HeroDevice lang={lang} />
        </div>
      </section>

      {/* ===================== STAT BAR ===================== */}
      <section className="border-y border-[#DCEDE2] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label.en} className="text-center">
              <div className={`text-[30px] font-extrabold tracking-tight text-[#1BA94B] sm:text-[34px] ${bn ? "" : "font-mono"}`}>
                {s.value[lang]}
                <span className="text-[18px] text-[#4C6356]">{s.suffix}</span>
              </div>
              <div className="mt-1 text-[14px] font-medium text-[#4C6356]">{s.label[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== MODE ROW ===================== */}
      <section id="modes" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHead eyebrow={T.modesEyebrow[lang]} title={T.modesTitle[lang]} />
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {MODES.map((m) => (
            <div key={m.en} className="group flex flex-col items-center gap-2 rounded-2xl border border-[#DCEDE2] bg-white p-4 transition-all hover:-translate-y-1 hover:border-[#1BA94B]/40 hover:shadow-[0_18px_40px_-20px_rgba(27,169,75,0.5)]">
              <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-[#F1FAF4]">
                <Image src={m.icon} alt={m.en} width={56} height={56} className="h-[85%] w-[85%] object-contain" unoptimized />
              </span>
              <div className="text-center">
                <div className="text-[14px] font-bold text-[#0E2A1A]">{m[lang]}</div>
                <div className="font-sans text-[11px] font-medium text-[#8AA294]">{m.en}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SERVICE BLOCKS ===================== */}
      <section id="services" className="bg-[#F1FAF4] py-6">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionHead eyebrow={T.servicesEyebrow[lang]} title={T.servicesTitle[lang]} />
          <div className="mt-10 space-y-8">
            {SERVICES.map((s, i) => (
              <ServiceBlock key={s.title.en} service={s} flip={i % 2 === 1} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TRUST / SAFETY ===================== */}
      <section id="trust" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-3">
              <TrustCard icon={<ShieldCheck className="h-5 w-5" />} value={locNum("≥3", lang) + (bn ? " ভোট" : " votes")} label={bn ? "ব্লকেড নিশ্চিত করতে" : "to confirm a blockade"} lang={lang} />
              <TrustCard icon={<Clock className="h-5 w-5" />} value={bn ? "৩০ মিনিট" : "30 min"} label={bn ? "হাফ-লাইফ ডিকে" : "half-life decay"} lang={lang} />
              <TrustCard icon={<Zap className="h-5 w-5" />} value="<0.1 ms" label={bn ? "ভুয়া ভাড়া ব্লক" : "fake fare blocked"} accent lang={lang} />
              <TrustCard icon={<Gauge className="h-5 w-5" />} value={bn ? "৯১.৮%" : "91.8%"} label={bn ? "Rₑ(t) সিভিয়ার থ্রেশহোল্ড" : "Rₑ(t) severe threshold"} lang={lang} />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-[13px] font-bold uppercase tracking-wider text-[#1BA94B]">{T.trustEyebrow[lang]}</span>
            <h2 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-[#0E2A1A] sm:text-[40px]">{T.trustTitle[lang]}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#4C6356]">{T.trustP[lang]}</p>
            <Link href="/command-center" className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-[#15863B] hover:gap-3">
              {T.trustLink[lang]} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== RIDE-SHARE BAND ===================== */}
      <section id="how" className="bg-[#F1FAF4]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-8 rounded-3xl border border-[#DCEDE2] bg-white p-8 shadow-[0_30px_80px_-50px_rgba(16,42,26,0.5)] sm:p-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E3F4E9] px-3 py-1.5 text-[13px] font-bold text-[#15863B]">
                <Users className="h-3.5 w-3.5" /> {T.poolBadge[lang]}
              </span>
              <h2 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight text-[#0E2A1A] sm:text-[38px]">{T.poolTitle[lang]}</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-[#4C6356]">{T.poolP[lang]}</p>
              <Link href="/command-center" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1BA94B] px-6 py-3 text-[15px] font-bold text-white shadow-[0_14px_32px_-12px_rgba(27,169,75,0.8)] transition-all hover:bg-[#15863B] active:scale-95">
                {T.poolCta[lang]} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PoolSplitCard lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== DOWNLOAD / CTA BAND ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B3321] px-8 py-12 text-white sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#1BA94B]/40 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="text-[30px] font-extrabold leading-tight tracking-tight sm:text-[38px]">{T.dlTitle[lang]}</h2>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[#B7D7C3]">{T.dlP[lang]}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/command-center" className="inline-flex items-center gap-2 rounded-full bg-[#1BA94B] px-6 py-3.5 text-[15px] font-bold text-white transition-all hover:bg-[#22C55E] active:scale-95">
                {T.dlCta1[lang]} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/track-4-map-shell" className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/25 px-6 py-3.5 text-[15px] font-bold text-white transition-all hover:border-white/60 active:scale-95">
                {T.dlCta2[lang]}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-[#0B3321] text-[#B7D7C3]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
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
                  {col.items[lang].map((it) => (
                    <li key={it}>
                      <Link href="/command-center" className="text-[14px] text-[#8FB8A0] transition-colors hover:text-white">{it}</Link>
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
    </div>
  );
}

// -----------------------------------------------------------------------------
function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <span className="text-[13px] font-bold uppercase tracking-wider text-[#1BA94B]">{eyebrow}</span>
      <h2 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-[#0E2A1A] sm:text-[40px]">{title}</h2>
    </div>
  );
}

// Hero device mock — a light phone frame previewing the live schematic + fares
function HeroDevice({ lang }: { lang: Lang }) {
  const bn = lang === "bn";
  const legs = [
    { icon: "/icons/mode-bicycle.svg", t: { bn: "ওয়াক-ব্রিজ", en: "Walk-bridge" }, f: { bn: "০ ৳", en: "0 ৳" }, c: "#94A3B8" },
    { icon: "/icons/mode-metro.svg", t: { bn: "MRT-6 মেট্রো", en: "MRT-6 Metro" }, f: { bn: "৩০ ৳", en: "30 ৳" }, c: "#1BA94B" },
    { icon: "/icons/mode-bus.svg", t: { bn: "বিহঙ্গ বাস (স্টুডেন্ট)", en: "Bihanga Bus (student)" }, f: { bn: "১৮ ৳", en: "18 ৳" }, c: "#3B82F6" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="pointer-events-none absolute inset-0 -z-10 translate-y-6 scale-95 rounded-[46px] bg-[#1BA94B]/20 blur-2xl" />
      <div className="rounded-[40px] border border-[#DCEDE2] bg-white p-3 shadow-[0_40px_90px_-40px_rgba(16,42,26,0.55)]">
        <div className="overflow-hidden rounded-[30px] bg-[#F1FAF4]">
          <div className="flex items-center justify-between bg-[#1BA94B] px-5 py-3 text-white">
            <span className="text-[13px] font-bold">{bn ? "মিরপুর ১০ → মতিঝিল" : "Mirpur 10 → Motijheel"}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">{bn ? "৪৮ ৳" : "48 ৳"}</span>
          </div>
          <div className="space-y-2.5 p-4">
            {legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#DCEDE2] bg-white p-2.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F1FAF4]">
                  <Image src={leg.icon} alt="" width={40} height={40} className="h-[82%] w-[82%] object-contain" unoptimized />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-[#0E2A1A]">{leg.t[lang]}</div>
                  <div className="h-1 w-full rounded-full" style={{ background: leg.c, opacity: 0.25 }} />
                </div>
                <span className="text-[14px] font-extrabold" style={{ color: leg.c }}>{leg.f[lang]}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl bg-[#E3F4E9] px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#15863B]">
                <CheckCircle2 className="h-4 w-4" /> GRAPH_GROUNDED · {bn ? "১০০%" : "100%"}
              </span>
              <span className="text-[13px] font-extrabold text-[#15863B]">{bn ? "৪৮ মিনিট" : "48 min"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-4 flex items-center gap-2 rounded-2xl border border-[#DCEDE2] bg-white px-4 py-2.5 shadow-[0_18px_40px_-20px_rgba(16,42,26,0.5)]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E3F4E9] text-[#15863B]"><Wallet className="h-4 w-4" /></span>
        <div>
          <div className="text-[15px] font-extrabold leading-none text-[#1BA94B]">{bn ? "+২৮ ৳" : "+28 ৳"}</div>
          <div className="font-sans text-[11px] font-medium text-[#8AA294]">{bn ? "সাশ্রয়" : "saved"}</div>
        </div>
      </div>
    </div>
  );
}

function ServiceBlock({ service, flip, lang }: { service: (typeof SERVICES)[number]; flip: boolean; lang: Lang }) {
  const bn = lang === "bn";
  return (
    <div className="grid items-center gap-6 rounded-3xl border border-[#DCEDE2] bg-white p-6 shadow-[0_24px_60px_-44px_rgba(16,42,26,0.5)] sm:p-8 lg:grid-cols-[1.2fr_1fr]">
      <div className={flip ? "lg:order-2" : ""}>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#E3F4E9] px-3 py-1.5 text-[13px] font-bold text-[#15863B]">
          {service.icon} {service.tag[lang]}
        </span>
        <h3 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-[#0E2A1A] sm:text-[30px]">{service.title[lang]}</h3>
        <p className="mt-3 text-[16px] leading-relaxed text-[#4C6356]">{service.body[lang]}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {service.bullets[lang].map((b) => (
            <li key={b} className={`inline-flex items-center gap-1.5 rounded-full border border-[#DCEDE2] bg-[#F6FBF4] px-3 py-1.5 text-[12px] font-semibold text-[#2C4536] ${bn ? "" : "font-mono"}`}>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#1BA94B]" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={`relative grid place-items-center ${flip ? "lg:order-1" : ""}`}>
        <div className="relative grid h-52 w-full place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#E3F4E9] to-[#F6FBF4]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(27,169,75,0.12),transparent_60%)]" />
          <Image src={service.art} alt="" width={200} height={200} className="h-[72%] w-auto object-contain drop-shadow-[0_18px_28px_rgba(16,42,26,0.25)]" unoptimized />
        </div>
      </div>
    </div>
  );
}

function TrustCard({ icon, value, label, accent, lang }: { icon: React.ReactNode; value: string; label: string; accent?: boolean; lang: Lang }) {
  const bn = lang === "bn";
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-[#FCA5A5] bg-[#FEF2F2]" : "border-[#DCEDE2] bg-white"}`}>
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${accent ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#E3F4E9] text-[#15863B]"}`}>{icon}</span>
      <div className={`mt-3 text-[22px] font-extrabold ${bn ? "" : "font-mono"} ${accent ? "text-[#DC2626]" : "text-[#0E2A1A]"}`}>{value}</div>
      <div className="mt-0.5 text-[13px] font-medium text-[#4C6356]">{label}</div>
    </div>
  );
}

const POOL_FARES: Record<number, number> = { 2: 45, 3: 30, 4: 23 };

function PoolSplitCard({ lang }: { lang: Lang }) {
  const reduce = useReducedMotion();
  const bn = lang === "bn";
  const [count, setCount] = useState(2);
  const fareRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = fareRef.current;
    if (!el) return;
    const target = POOL_FARES[count];
    const render = (n: number) => (el.textContent = locNum(String(Math.round(n)), lang));
    if (reduce) { render(target); return; }
    const from = Number((el.textContent || "").replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))) || target;
    const c = animate(from, target, { duration: 0.5, ease: [0.16, 1, 0.3, 1], onUpdate: render });
    return () => c.stop();
  }, [count, lang, reduce]);

  return (
    <>
      <div className="col-span-2 rounded-2xl border border-[#DCEDE2] bg-[#F6FBF4] p-5 text-center">
        <div className="text-[13px] font-semibold text-[#4C6356]">{bn ? "মাথাপিছু ভাড়া" : "Per-person fare"}</div>
        <div className="mt-1 text-[44px] font-extrabold leading-none text-[#1BA94B]">
          <span ref={fareRef}>{locNum("45", lang)}</span> <span className="text-[22px] text-[#4C6356]">৳</span>
        </div>
        <div className="mt-1 text-[12px] font-medium text-[#8AA294]">
          {bn ? `সার্জ ৯০ ৳ রিকশা · পুল ${toBnDigits(String(count))}/৪` : `Surge 90 ৳ rickshaw · pool ${count}/4`}
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center gap-2">
        {[2, 3, 4].map((n) => (
          <button key={n} onClick={() => setCount(n)} className={`rounded-full px-4 py-2 text-[14px] font-bold transition-all ${count === n ? "bg-[#1BA94B] text-white shadow-[0_8px_20px_-8px_rgba(27,169,75,0.8)]" : "border border-[#DCEDE2] bg-white text-[#2C4536] hover:border-[#1BA94B]"}`}>
            {bn ? `${toBnDigits(String(n))}/৪ পুল` : `${n}/4 pool`}
          </button>
        ))}
      </div>
    </>
  );
}
