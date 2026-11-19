"use client";

// Shared dashboard footer. Rendered once from the root layout so every route
// gets the same attribution without duplicating markup on individual pages.

import { useLang } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLang();

  return (
    <footer className="hidden border-t border-line bg-white py-5 text-center text-[13px] text-ink-faint lg:block">
      © 2026 DhakaPath · {t("INIF স্মার্ট সিটি হ্যাকাথন", "INIF Smart City Hackathon")} ·{" "}
      {t("ঢাকায় তৈরি", "Made in Dhaka")}
    </footer>
  );
}
