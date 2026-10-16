"use client";

// ==============================================================================
// src/lib/i18n.tsx — SHARED LANGUAGE CONTEXT (বাংলা / English)
// One toggle drives the landing page and the whole app. Bangla is the default;
// the choice persists in localStorage. `t(bn, en)` picks the active string and
// `n()` localises digits so numbers match the surrounding script.
// ==============================================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "bn" | "en";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const STORAGE_KEY = "dhakapath.lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (bn: string, en: string) => string;
  n: (value: number | string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "bn" || saved === "en") setLangState(saved);
    } catch {
      // localStorage unavailable: stay on the default language
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failure
    }
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang(lang === "bn" ? "en" : "bn"),
      t: (bn, en) => (lang === "bn" ? bn : en),
      n: (v) => (lang === "bn" ? String(v).replace(/[0-9]/g, (d) => BN_DIGITS[+d]) : String(v)),
    }),
    [lang, setLang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within a LangProvider");
  return ctx;
}
