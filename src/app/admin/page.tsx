"use client";

// Admin console at /admin. A passcode gate (NEXT_PUBLIC_ADMIN_PASSCODE, default "dhakapath2026")
// unlocks the CMS (network links + signboard digitiser) and the moderation tools (alert feed,
// override, fare sanity, safety log). Separate from the anonymous public /app.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, LogOut, Network, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { Btn, Card, Field, SectionTitle, inputCls } from "@/ui/kit";
import { ScenarioBar } from "@/ui/ScenarioBar";
import { NetworkTab } from "@/ui/network/NetworkTab";
import { AlertsTab } from "@/ui/alerts/AlertsTab";
import { HUB_IDS } from "@/ui/labels";
import { CANONICAL_GRAPH_G0 } from "@/contracts/canonicalGraph";

const PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "dhakapath2026";
const SESSION_KEY = "dhakapath.admin";

function LoginForm({ onAuth }: { onAuth: () => void }) {
  const { t } = useLang();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === PASSCODE) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
      onAuth();
    } else {
      setErr(true);
    }
  };

  return (
    <div className="grid min-h-[80vh] place-items-center px-4">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-cta">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-ink">{t("অ্যাডমিন লগইন", "Admin login")}</h1>
        <p className="mt-1 text-[14px] text-ink-soft">{t("নেটওয়ার্ক ও রিপোর্ট পরিচালনা করতে পাসকোড দিন।", "Enter the passcode to manage the network and reports.")}</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Field label={t("পাসকোড", "Passcode")}>
            <input
              type="password"
              autoFocus
              value={code}
              onChange={(e) => { setCode(e.target.value); setErr(false); }}
              className={inputCls}
              placeholder="••••••••"
              aria-label={t("পাসকোড", "Passcode")}
            />
          </Field>
          {err && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-[13px] font-semibold text-danger">{t("ভুল পাসকোড", "Wrong passcode")}</p>}
          <Btn type="submit" className="w-full" icon={<ShieldCheck className="h-5 w-5" />}>{t("প্রবেশ করুন", "Sign in")}</Btn>
        </form>
        <Link href="/app" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-soft hover:text-brand-dark">
          <ArrowLeft className="h-4 w-4" /> {t("পাবলিক অ্যাপে ফিরুন", "Back to the public app")}
        </Link>
      </Card>
    </div>
  );
}

function AdminStats() {
  const { t, n } = useLang();
  const { extraEdges, alerts, disruptedHubIds, interceptionLogs } = useDhakaPathStore();
  const stats = [
    { label: t("হাব", "Hubs"), value: HUB_IDS.length },
    { label: t("লিংক", "Links"), value: CANONICAL_GRAPH_G0.length + extraEdges.length },
    { label: t("সক্রিয় অ্যালার্ট", "Active alerts"), value: alerts.filter((a) => a.status === "VERIFIED_ACTIVE" || a.status === "PENDING_CORROBORATION").length },
    { label: t("বন্ধ হাব", "Blocked hubs"), value: disruptedHubIds.length },
    { label: t("অডিট লগ", "Audit events"), value: interceptionLogs.length },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label} className="p-4">
          <div className="text-[28px] font-extrabold tabular-nums text-brand">{n(s.value)}</div>
          <div className="mt-0.5 text-[13px] font-medium text-ink-soft">{s.label}</div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { t, toggleLang, lang } = useLang();
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setAuthed(sessionStorage.getItem(SESSION_KEY) === "1"); } catch { /* ignore */ }
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!authed) return <LoginForm onAuth={() => setAuthed(true)} />;

  const logout = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setAuthed(false);
  };

  return (
    <div className="min-h-screen bg-brand-canvas">
      <header className="sticky top-8 z-50 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-white"><Network className="h-5 w-5" /></span>
            <span className="truncate text-[16px] font-extrabold tracking-tight text-ink sm:text-[18px]">DhakaPath <span className="hidden text-ink-soft sm:inline">{t("অ্যাডমিন", "Admin")}</span></span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link href="/app" title={t("পাবলিক অ্যাপ", "Public app")} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft hover:border-brand hover:text-brand-dark sm:h-auto sm:w-auto sm:px-3 sm:py-2 sm:text-[13px] sm:font-bold">
              <ArrowLeft className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">{t("পাবলিক অ্যাপ", "Public app")}</span>
            </Link>
            <button type="button" onClick={toggleLang} className="rounded-full border border-line px-2.5 py-2 text-[12px] font-bold text-ink-soft hover:border-brand hover:text-brand-dark sm:px-3 sm:text-[13px]">{lang === "bn" ? "EN" : "বাং"}</button>
            <button type="button" onClick={logout} title={t("লগআউট", "Log out")} className="inline-flex items-center gap-1.5 rounded-full border border-danger-line bg-danger-bg px-2.5 py-2 text-[12px] font-bold text-danger sm:px-3 sm:text-[13px]"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("লগআউট", "Log out")}</span></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6">
        <SectionTitle title={t("অ্যাডমিন কনসোল", "Admin console")} sub={t("ট্রানজিট নেটওয়ার্ক ও ক্রাউড রিপোর্ট পরিচালনা করুন।", "Manage the transit network and moderate crowd reports.")} />
        <AdminStats />
        <ScenarioBar />
        <NetworkTab admin />
        <AlertsTab />
      </main>
    </div>
  );
}
