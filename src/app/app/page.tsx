"use client";

// DhakaPath app: one organised place for the whole product. Three tabs (plan, alerts, network)
// share one scenario simulator and one store, so a switch of scenario, a vote or a new link is
// reflected everywhere at once. Hotkeys: Alt+1/2/3 scenarios, Alt+R reset, Ctrl+Shift+D math.

import React, { useCallback, useEffect, useState } from "react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { ScenarioPreset } from "@/contracts/schema";
import { AppHeader, BottomNav, TabId } from "@/ui/AppHeader";
import { ScenarioBar } from "@/ui/ScenarioBar";
import { MathDrawer } from "@/ui/MathDrawer";
import { PitchOverlay } from "@/ui/PitchOverlay";
import { PlanTab } from "@/ui/plan/PlanTab";
import { AlertsTab } from "@/ui/alerts/AlertsTab";
import { NetworkTab } from "@/ui/network/NetworkTab";
import { AssistantDock } from "@/ui/assistant/AssistantDock";

const TABS: TabId[] = ["plan", "alerts", "network"];

export default function AppPage() {
  const { t } = useLang();
  const { setScenarioPreset, resetAll } = useDhakaPathStore();
  const [tab, setTab] = useState<TabId>("plan");
  const [mathOpen, setMathOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  // deep links: /app#alerts opens that tab
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as TabId;
    if (TABS.includes(fromHash)) setTab(fromHash);
  }, []);

  const goTab = useCallback((next: TabId) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setMathOpen((v) => !v);
        return;
      }
      if (e.altKey && !e.ctrlKey) {
        if (e.key === "1") { e.preventDefault(); setScenarioPreset(ScenarioPreset.NORMAL_BASELINE); }
        else if (e.key === "2") { e.preventDefault(); setScenarioPreset(ScenarioPreset.PEAK_CRISIS_SURGE); }
        else if (e.key === "3") { e.preventDefault(); setScenarioPreset(ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT); }
        else if (e.key.toLowerCase() === "r") { e.preventDefault(); resetAll(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setScenarioPreset, resetAll]);

  return (
    <div className="min-h-screen bg-brand-canvas">
      <AppHeader tab={tab} onTab={goTab} onMath={() => setMathOpen((v) => !v)} onStory={() => setStoryOpen(true)} />

      <main className="mx-auto max-w-[1500px] space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
        <ScenarioBar />
        {tab === "plan" && <PlanTab />}
        {tab === "alerts" && <AlertsTab />}
        {tab === "network" && <NetworkTab />}
      </main>

      <footer className="hidden border-t border-line bg-white py-5 text-center text-[13px] text-ink-faint lg:block">
        © 2026 DhakaPath · {t("INIF স্মার্ট সিটি হ্যাকাথন", "INIF Smart City Hackathon")} · {t("ঢাকায় তৈরি", "Made in Dhaka")}
      </footer>

      <BottomNav tab={tab} onTab={goTab} />
      <AssistantDock />
      <MathDrawer open={mathOpen} onClose={() => setMathOpen(false)} />
      <PitchOverlay open={storyOpen} onClose={() => setStoryOpen(false)} />
    </div>
  );
}
