"use client";

// Floating "Ask DhakaPath" assistant, available on every tab. A FAB opens a slide-over panel
// holding the multi-turn conversational engine — the alternative interaction layer (Part 5)
// that sits alongside the visual app without crowding it.

import React, { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AskDhakaPathChat } from "../plan/AskDhakaPathChat";
import { cn } from "@/lib/utils";

export function AssistantDock() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Ctrl+/ toggles the assistant
      if (e.ctrlKey && e.key === "/") { e.preventDefault(); setOpen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("সহকারী খুলুন", "Open assistant")}
        className={cn(
          "fixed bottom-20 right-4 z-[70] inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 font-bold text-white shadow-cta transition-all hover:bg-brand-dark active:scale-95 lg:bottom-6",
          open && "hidden"
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">{t("জিজ্ঞাসা করুন", "Ask")}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-[#0B3321]/35 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("সহকারী", "Assistant")}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-white shadow-card animate-[slidein_0.25s_ease-out] sm:max-w-md"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[15px] font-extrabold text-ink">{t("Ask DhakaPath", "Ask DhakaPath")}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("বন্ধ করুন", "Close")} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft hover:border-brand hover:text-brand-dark">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <AskDhakaPathChat fill />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
