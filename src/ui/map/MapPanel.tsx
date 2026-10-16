"use client";

// Map card: real OSM view with automatic fallback to the offline schematic, layer toggles,
// disruption / walk-bridge banners and a mode legend.

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Footprints, Map as MapIcon, Network, OctagonAlert, WifiOff } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { TransportMode } from "@/contracts/schema";
import { Card, Pill, Segmented } from "../kit";
import { MODE_STYLE, hubName, modeName } from "../labels";
import SchematicMap from "./SchematicMap";
import type { MapLayers } from "./AppMap";
import { cn } from "@/lib/utils";

const AppMap = dynamic(() => import("./AppMap"), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center bg-[#E8EFE9] text-[13px] font-semibold text-ink-soft">…</div>,
});

type View = "osm" | "schematic";

export function MapPanel({ className }: { className?: string }) {
  const { lang, t, n } = useLang();
  const { disruptedHubIds, walkBridgeActive, selectedRoute, rankedRoutes } = useDhakaPathStore();
  const [view, setView] = useState<View>("osm");
  const [offline, setOffline] = useState(false);
  const [layers, setLayers] = useState<MapLayers>({ metro: true, bikolpo: false, uttara: false });
  const okTiles = useRef(0);
  const badTiles = useRef(0);

  useEffect(() => {
    const goOffline = () => {
      setOffline(true);
      setView("schematic");
    };
    const goOnline = () => setOffline(false);
    if (!navigator.onLine) goOffline();
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const onTile = useCallback((ok: boolean) => {
    if (ok) okTiles.current += 1;
    else badTiles.current += 1;
    // nothing loaded after several failures: switch to the offline schematic
    if (badTiles.current >= 6 && okTiles.current === 0) {
      setOffline(true);
      setView("schematic");
    }
  }, []);

  // tiles that never answer (no network) do not always raise an error: give them a few seconds
  useEffect(() => {
    if (view !== "osm") return;
    const timer = window.setTimeout(() => {
      if (okTiles.current === 0) {
        setOffline(true);
        setView("schematic");
      }
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [view]);

  const toggle = (k: keyof MapLayers) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-extrabold text-ink">{t("ম্যাপ", "Map")}</h2>
          {offline && (
            <Pill tone="amber" icon={<WifiOff className="h-3.5 w-3.5" />}>
              {t("অফলাইন", "Offline")}
            </Pill>
          )}
        </div>
        <Segmented<View>
          ariaLabel={t("ম্যাপের ধরন", "Map type")}
          value={view}
          onChange={setView}
          options={[
            { value: "osm", label: <span className="inline-flex items-center gap-1.5"><MapIcon className="h-4 w-4" />OpenStreetMap</span> },
            { value: "schematic", label: <span className="inline-flex items-center gap-1.5"><Network className="h-4 w-4" />{t("স্কিমেটিক", "Schematic")}</span> },
          ]}
        />
      </div>

      <div className="relative min-h-[360px] flex-1">
        {view === "osm" ? <AppMap layers={layers} onTile={onTile} /> : <SchematicMap />}

        <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] flex flex-col items-start gap-2">
          {disruptedHubIds.length > 0 && (
            <Pill tone="red" icon={<OctagonAlert className="h-4 w-4" />} className="pointer-events-auto bg-white py-1.5 text-[13px] shadow-lift">
              {disruptedHubIds.map((h) => hubName(h, lang)).join(lang === "bn" ? " ও " : " & ")}
              {t(" বন্ধ — বিকল্প পথ দেখানো হচ্ছে", " blocked — showing the detour")}
            </Pill>
          )}
          {walkBridgeActive && (
            <Pill tone="amber" icon={<Footprints className="h-4 w-4" />} className="pointer-events-auto bg-white py-1.5 text-[13px] shadow-lift">
              {t("হাঁটা-সেতু ডিটোর · ৪.৫ কিমি/ঘ · ০ ৳", "Walk-bridge detour · 4.5 km/h · 0 BDT")}
              <span className="font-mono text-[10px] opacity-70">DETOUR_WALK_BRIDGE_REQUIRED</span>
            </Pill>
          )}
          {rankedRoutes.length === 0 && (
            <Pill tone="gray" className="pointer-events-auto bg-white py-1.5 text-[13px] shadow-lift">
              {t("কোনো যাচাইকৃত রুট নেই", "No verified route")}
            </Pill>
          )}
        </div>

        {view === "osm" && (
          <div className="absolute bottom-3 right-3 z-[500] flex gap-1.5">
            {(
              [
                ["metro", "MRT-6"],
                ["bikolpo", "Bikolpo"],
                ["uttara", "Uttara"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={layers[k]}
                onClick={() => toggle(k)}
                className={cn("rounded-full border px-3 py-1.5 text-[12px] font-bold shadow-lift transition-colors", layers[k] ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-brand")}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5">
        {Object.values(TransportMode).map((m) => (
          <span key={m} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
            <span className="h-1.5 w-5 rounded-full" style={{ background: MODE_STYLE[m].color, opacity: m === TransportMode.WALK ? 0.6 : 1 }} />
            {modeName(m, lang)}
          </span>
        ))}
        {selectedRoute && (
          <span className="ml-auto text-[12px] font-bold text-brand-dark">
            {n(selectedRoute.legs.length)} {t("লেগ", "legs")}
          </span>
        )}
      </div>
    </Card>
  );
}
