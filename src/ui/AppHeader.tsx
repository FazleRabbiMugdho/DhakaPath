"use client";

// App chrome: sticky white header with the tabs (desktop) and a Pathao-style bottom nav (mobile).

import React from "react";
import Link from "next/link";
import { Bell, Languages, Network, RotateCcw, Route, Sigma, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { cn } from "@/lib/utils";

export type TabId = "plan" | "alerts" | "network";

export function useTabs() {
  const { t } = useLang();
  const { disruptedHubIds } = useDhakaPathStore();
  return [
    { id: "plan" as const, label: t("ট্রিপ প্ল্যান", "Plan trip"), icon: <Route className="h-5 w-5" />, badge: 0 },
    { id: "alerts" as const, label: t("লাইভ অ্যালার্ট", "Live alerts"), icon: <Bell className="h-5 w-5" />, badge: disruptedHubIds.length },
    { id: "network" as const, label: t("নেটওয়ার্ক", "Network"), icon: <Network className="h-5 w-5" />, badge: 0 },
  ];
}

export function AppHeader({
  tab,
  onTab,
  onMath,
  onStory,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  onMath: () => void;
  onStory: () => void;
}) {
  const { t, toggleLang, lang } = useLang();
  const { resetAll } = useDhakaPathStore();
  const tabs = useTabs();

  return (
    <header className="sticky top-8 z-50 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="DhakaPath">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-cta">
            <Route className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="font-sans text-[19px] font-extrabold tracking-tight text-ink">
            Dhaka<span className="text-brand">Path</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t("প্রধান মেনু", "Main menu")}>
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-current={tab === x.id ? "page" : undefined}
              onClick={() => onTab(x.id)}
              className={cn("relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-bold transition-colors", tab === x.id ? "bg-brand-soft text-brand-dark" : "text-ink-soft hover:bg-brand-mint hover:text-brand-dark")}
            >
              {x.icon}
              {x.label}
              {x.badge > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-extrabold text-white">{x.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onStory} className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[13px] font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark sm:inline-flex">
            <Sparkles className="h-4 w-4" />
            {t("ডেমো স্টোরি", "Demo story")}
          </button>
          <button type="button" onClick={onMath} title="Ctrl+Shift+D" className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[13px] font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark md:inline-flex">
            <Sigma className="h-4 w-4" />
            {t("গণিত", "Math")}
          </button>
          <button type="button" onClick={toggleLang} aria-label={t("ভাষা বদলান", "Switch language")} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[13px] font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark">
            <Languages className="h-4 w-4" />
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
          <button type="button" onClick={resetAll} title="Alt+R" aria-label={t("রিসেট", "Reset")} className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand hover:text-brand-dark">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ tab, onTab }: { tab: TabId; onTab: (t: TabId) => void }) {
  const tabs = useTabs();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      {tabs.map((x) => (
        <button key={x.id} type="button" aria-current={tab === x.id ? "page" : undefined} onClick={() => onTab(x.id)} className={cn("relative flex flex-col items-center gap-0.5 py-2.5 text-[12px] font-bold", tab === x.id ? "text-brand" : "text-ink-faint")}>
          <span className="relative">
            {x.icon}
            {x.badge > 0 && <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">{x.badge}</span>}
          </span>
          {x.label}
        </button>
      ))}
    </nav>
  );
}
