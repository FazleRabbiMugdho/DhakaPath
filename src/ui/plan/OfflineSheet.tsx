"use client";

// Result of the offline export: preview of the PNG, its size, and the spoken transcript so the
// briefing still works on a phone with no text-to-speech voice installed.

import React, { useEffect } from "react";
import { Download, Volume2, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { OfflineBriefingResult } from "@/lib/offlineBriefing";
import { Btn, Pill } from "../kit";

export function OfflineSheet({
  result,
  transcript,
  onClose,
  onReplay,
}: {
  result: OfflineBriefingResult;
  transcript: string;
  onClose: () => void;
  onReplay: () => void;
}) {
  const { t, n } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-[#0B3321]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("অফলাইন কার্ড", "Offline card")}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-line bg-white p-5 shadow-card sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-extrabold text-ink">{t("আপনার অফলাইন কার্ড তৈরি", "Your offline card is ready")}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Pill tone="green">{n(result.fileSizeKb.toFixed(1))} KB</Pill>
              <span className="font-mono text-[11.5px] text-ink-faint">{result.filename}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t("বন্ধ করুন", "Close")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink-soft hover:border-brand hover:text-brand-dark">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[260px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.dataUrl} alt={t("রুট কার্ডের প্রিভিউ", "Route card preview")} className="w-full rounded-2xl border border-line" />
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide text-ink-faint">{t("অডিও ট্রান্সক্রিপ্ট", "Audio transcript")}</div>
            <p className="mt-2 rounded-2xl border border-line bg-brand-mint p-4 text-[16px] font-semibold leading-relaxed text-ink">{transcript}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn variant="soft" size="sm" icon={<Volume2 className="h-4 w-4" />} onClick={onReplay}>
                {t("আবার শুনুন", "Play again")}
              </Btn>
              <a href={result.dataUrl} download={result.filename} className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-3.5 py-2 text-[13px] font-bold text-brand-dark hover:border-brand">
                <Download className="h-4 w-4" />
                {t("আবার ডাউনলোড", "Download again")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
