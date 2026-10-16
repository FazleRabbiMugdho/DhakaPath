"use client";

// Trip-plan screen: search + ranked routes + ride-share board on the left; map + ROI on the right.

import React, { useState } from "react";
import { Footprints, SearchX } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { exportOfflineBriefingCard, playOfflineVoiceBriefing, OfflineBriefingResult } from "@/lib/offlineBriefing";
import type { ParetoRouteOption } from "@/contracts/schema";
import { Btn, Card } from "../kit";
import { MapPanel } from "../map/MapPanel";
import { PlannerCard } from "./PlannerCard";
import { RouteCard } from "./RouteCard";
import { RoiStrip } from "./RoiStrip";
import { PoolBoard } from "./PoolBoard";
import { OfflineSheet } from "./OfflineSheet";
import { AskDhakaPathChat } from "./AskDhakaPathChat";

export function PlanTab() {
  const { t, n } = useLang();
  const store = useDhakaPathStore();
  const { rankedRoutes, walkBridgeBlocked, activeQuery, roi, options, setOptions, routeSearchFailed } = store;
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState<{ result: OfflineBriefingResult; transcript: string; route: ParetoRouteOption } | null>(null);

  const doExport = (route: ParetoRouteOption) => {
    setExporting(true);
    try {
      const result = exportOfflineBriefingCard(route, activeQuery, roi);
      const transcript = playOfflineVoiceBriefing(route, activeQuery);
      setSheet({ result, transcript, route });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="plan" className="grid grid-cols-1 gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
      <div className="space-y-5">
        <AskDhakaPathChat />
        <PlannerCard />

        <section aria-live="polite" className="space-y-4">
          {rankedRoutes.length > 0 ? (
            <>
              <h2 className="px-1 text-[20px] font-extrabold text-ink">
                {n(rankedRoutes.length)} {t("টি যাচাইকৃত রুট", "verified routes")}
              </h2>
              {rankedRoutes.map((r, i) => (
                <RouteCard key={r.route.route_id} ranked={r} index={i} onExport={doExport} exporting={exporting} />
              ))}
            </>
          ) : (
            <Card className="p-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-dark">
                {walkBridgeBlocked ? <Footprints className="h-6 w-6" /> : <SearchX className="h-6 w-6" />}
              </span>
              <h3 className="mt-3 text-[18px] font-extrabold text-ink">
                {walkBridgeBlocked ? t("সব যানবাহনের পথ বন্ধ", "Every vehicle route is cut") : routeSearchFailed ? t("রুট হিসাব করা যায়নি", "Could not compute a route") : t("বাজেট বা শর্তের মধ্যে রুট নেই", "No route within your budget and rules")}
              </h3>
              <p className="mt-1 text-[14px] text-ink-soft">
                {walkBridgeBlocked
                  ? t("হাঁটা-সেতু চালু করলে বিনা ভাড়ায় বিকল্প পথ পাবেন।", "Allow the walk-bridge to get a free detour on foot.")
                  : t("বাজেট বাড়ান, অথবা এড়ানো হাব কমিয়ে আবার চেষ্টা করুন।", "Raise the budget or avoid fewer hubs, then try again.")}
              </p>
              {walkBridgeBlocked && (
                <Btn className="mt-4" size="sm" icon={<Footprints className="h-4 w-4" />} onClick={() => setOptions({ ...options, allowWalkBridge: true })}>
                  {t("হাঁটা-সেতু চালু করুন", "Unlock walk-bridge")}
                </Btn>
              )}
            </Card>
          )}
        </section>

        <PoolBoard />
      </div>

      <div className="space-y-5 lg:sticky lg:top-[7.25rem] lg:self-start">
        <MapPanel className="h-[520px] lg:h-[calc(100vh-33rem)] lg:min-h-[360px]" />
        <RoiStrip />
      </div>

      {sheet && (
        <OfflineSheet
          result={sheet.result}
          transcript={sheet.transcript}
          onClose={() => setSheet(null)}
          onReplay={() => playOfflineVoiceBriefing(sheet.route, activeQuery)}
        />
      )}
    </div>
  );
}
