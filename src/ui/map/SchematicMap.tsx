"use client";

// Offline-safe 15-hub schematic. Works with zero network: shows every link by mode, the chosen
// route in mode colours with a flowing dash, the naive path through the flooded corridor and
// pulsing rings on disrupted hubs. Used as the fallback when map tiles cannot load.

import React, { useMemo, useState } from "react";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import { HubId, TransportMode } from "@/contracts/schema";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { MODE_STYLE, alertStatusName, hubName, incidentName } from "../labels";

const W = 800;
const H = 600;
const DASH: Partial<Record<TransportMode, string>> = {
  [TransportMode.LEGUNA]: "9 4 2 4",
  [TransportMode.RICKSHAW]: "6 5",
  [TransportMode.WALK]: "1 6",
};

export default function SchematicMap() {
  const { lang, t, n } = useLang();
  const { selectedRoute, shadowHubPath, disruptedHubIds, alerts, extraEdges } = useDhakaPathStore();
  const [focus, setFocus] = useState<HubId | null>(null);

  const routeHubIds = useMemo(() => new Set(selectedRoute?.legs.flatMap((l) => [l.origin_hub_id, l.dest_hub_id]) ?? []), [selectedRoute]);
  const pt = (id: HubId) => ({ x: CANONICAL_HUBS[id].svg_x, y: CANONICAL_HUBS[id].svg_y });
  const focusAlert = focus ? alerts.find((a) => a.hub_id === focus && a.status !== "EXPIRED" && a.status !== "RESOLVED") : undefined;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F4FAF6]">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label={t("ঢাকার ১৫ হাবের স্কিমেটিক ম্যাপ", "Dhaka 15-hub schematic map")}>
        <defs>
          <pattern id="dp-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#CFE5D6" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#dp-dots)" />

        {[...CANONICAL_GRAPH_G0, ...extraEdges].map((e, i) => {
          if (e.origin_hub_id === e.dest_hub_id) return null;
          const a = pt(e.origin_hub_id);
          const b = pt(e.dest_hub_id);
          const isNew = extraEdges.includes(e);
          return (
            <line key={`${e.edge_id}-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={MODE_STYLE[e.mode].color} strokeWidth={e.mode === TransportMode.METRO ? 4 : 2.5} strokeDasharray={isNew ? "3 3" : DASH[e.mode]} strokeLinecap="round" opacity={isNew ? 0.9 : 0.35} />
          );
        })}

        {shadowHubPath.length > 1 && disruptedHubIds.length > 0 && (
          <polyline points={shadowHubPath.map((h) => `${pt(h).x},${pt(h).y}`).join(" ")} fill="none" stroke="#DC2626" strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" opacity={0.7} />
        )}

        {selectedRoute?.legs.map((leg, i) => {
          if (leg.origin_hub_id === leg.dest_hub_id) return null;
          const a = pt(leg.origin_hub_id);
          const b = pt(leg.dest_hub_id);
          const color = MODE_STYLE[leg.mode].color;
          return (
            <g key={`${leg.edge_id}-${i}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={11} strokeLinecap="round" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.35} />
              <line className="dp-flow" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray="14 10" />
            </g>
          );
        })}

        {Object.values(CANONICAL_HUBS).map((hub) => {
          const id = hub.hub_id as HubId;
          const bad = disruptedHubIds.includes(id);
          const on = routeHubIds.has(id);
          return (
            <g
              key={id}
              transform={`translate(${hub.svg_x} ${hub.svg_y})`}
              tabIndex={0}
              role="button"
              aria-label={hubName(id, lang)}
              onMouseEnter={() => setFocus(id)}
              onMouseLeave={() => setFocus((c) => (c === id ? null : c))}
              onFocus={() => setFocus(id)}
              onBlur={() => setFocus((c) => (c === id ? null : c))}
              style={{ cursor: "pointer", outline: "none" }}
            >
              {bad && (
                <>
                  <circle className="dp-pulse" r={18} fill="#F87171" fillOpacity={0.25} stroke="#DC2626" strokeWidth={2} />
                  <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
                </>
              )}
              <circle r={bad ? 9 : on ? 8 : 6.5} fill={bad ? "#DC2626" : on ? "#1BA94B" : "#fff"} stroke={bad ? "#B91C1C" : "#15863B"} strokeWidth={2.5} />
              <text y={hub.svg_y > 520 ? 26 : -14} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={bad ? "#B91C1C" : "#0E2A1A"} style={{ paintOrder: "stroke", stroke: "#F4FAF6", strokeWidth: 3.5, strokeLinejoin: "round" }}>
                {hubName(id, lang)}
              </text>
            </g>
          );
        })}
      </svg>

      {focus && (
        <div className="pointer-events-none absolute bottom-3 right-3 w-60 rounded-2xl border border-line bg-white p-3 shadow-lift">
          <div className="text-[14px] font-extrabold text-ink">{hubName(focus, lang)}</div>
          {focusAlert ? (
            <div className="mt-1 text-[12.5px] font-semibold text-danger">
              {incidentName(focusAlert.incident_type, lang)} · {alertStatusName(focusAlert.status, lang)} · R<sub>e</sub> {n(focusAlert.confidence_pct.toFixed(1))}%
            </div>
          ) : (
            <div className="mt-1 text-[12.5px] font-semibold text-brand-dark">{t("চলাচল স্বাভাবিক", "Operating normally")}</div>
          )}
        </div>
      )}
    </div>
  );
}
