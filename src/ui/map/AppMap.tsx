"use client";

// Real OpenStreetMap layer (Leaflet). Draws the MRT-6 / Bikolpo / Uttara lines, the 15 hubs,
// the chosen route leg-by-leg in mode colours, the naive "shadow" path through the flooded
// corridor, and a pulsing ring on every disrupted hub. Loaded client-only by MapPanel.

import React, { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet";
import { METRO_MRT6, BIKOLPO_BUS, UTTARA_BUS } from "@/data/dhakaTransitData";
import { CANONICAL_HUBS, CANONICAL_GRAPH_G0 } from "@/contracts/canonicalGraph";
import { HubId, TransportMode, IncidentType } from "@/contracts/schema";
import { getLegGeometry, getLegDistanceKm, getMultiHubRoadPath, ensureContinuousRouteLegs } from "@/data/dhakaRoadNetwork";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { MODE_STYLE, hubName, incidentName, alertStatusName, modeName } from "../labels";
import { cn } from "@/lib/utils";

export interface MapLayers {
  metro: boolean;
  bikolpo: boolean;
  uttara: boolean;
}

const CENTER: [number, number] = [23.775, 90.395];

function pin(letter: string, color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:9999px;background:${color};color:#fff;font:800 14px sans-serif;display:grid;place-items:center;border:3px solid #fff;box-shadow:0 6px 14px -4px rgba(0,0,0,.45)">${letter}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function FitToRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 14 });
    else map.setView(CENTER, 12);
  }, [map, points]);
  return null;
}

export default function AppMap({
  layers,
  onTile,
}: {
  layers: MapLayers;
  onTile: (ok: boolean) => void;
}) {
  const { lang, t, n } = useLang();
  const store = useDhakaPathStore();
  const { selectedRoute, shadowHubPath, disruptedHubIds, alerts, activeQuery } = store;

  const legs = useMemo(() => {
    if (!selectedRoute) return [];
    const rawLegs = selectedRoute.legs
      .filter((leg) => leg.origin_hub_id !== leg.dest_hub_id)
      .map((leg) => {
        // Legs follow the exact street geometry with dense road nodes,
        // preventing lines from deviating off-road or cutting through blocks.
        const pts = getLegGeometry(leg);
        const km = getLegDistanceKm(leg);
        return { leg, pts, km };
      });
    return ensureContinuousRouteLegs(rawLegs);
  }, [selectedRoute]);


  const fitPoints = useMemo(
    () => legs.flatMap((l) => l.pts).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])),
    [legs]
  );

  // Naive / flooded baseline also follows the actual street corridor step by step
  const shadowPts = useMemo(
    () => getMultiHubRoadPath(shadowHubPath).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])),
    [shadowHubPath]
  );

  // Active incident corridors (e.g. Malibagh gridlock, Farmgate waterlogging)
  const activeAlertCorridors = useMemo(() => {
    return alerts
      .filter((a) => a.status !== "EXPIRED" && a.status !== "RESOLVED" && Boolean(a.edge_id) && a.confidence_pct >= 50)
      .map((alert) => {
        const edge = CANONICAL_GRAPH_G0.find((e) => e.edge_id === alert.edge_id);
        if (!edge) return null;
        const pts = getLegGeometry({ origin_hub_id: edge.origin_hub_id, dest_hub_id: edge.dest_hub_id, mode: edge.mode });
        if (pts.length < 2) return null;
        const isSevered = alert.incident_type === IncidentType.WATERLOGGING || alert.incident_type === IncidentType.INTERSECTION_BLOCKADE;
        return { alert, edge, pts, isSevered };
      })
      .filter((item): item is { alert: typeof alerts[0]; edge: typeof CANONICAL_GRAPH_G0[0]; pts: [number, number][]; isSevered: boolean } => Boolean(item));
  }, [alerts]);

  const origin = CANONICAL_HUBS[activeQuery.origin_hub_id];
  const dest = CANONICAL_HUBS[activeQuery.dest_hub_id];
  const originIcon = useMemo(() => pin("A", "#1BA94B"), []);
  const destIcon = useMemo(() => pin("B", "#0E2A1A"), []);

  // Numbered boarding pins at every hub the route touches (origin + transfers + dest).
  const routeStops = useMemo(() => {
    if (!selectedRoute) return [] as HubId[];
    const ids: HubId[] = [selectedRoute.legs[0]?.origin_hub_id].filter(Boolean) as HubId[];
    for (const leg of selectedRoute.legs) if (leg.dest_hub_id !== ids[ids.length - 1]) ids.push(leg.dest_hub_id);
    return ids;
  }, [selectedRoute]);

  return (
    <MapContainer center={CENTER} zoom={12} minZoom={10} maxZoom={18} scrollWheelZoom zoomControl={false} className="h-full w-full">
      <ZoomControl position="bottomleft" />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        maxZoom={19}
        eventHandlers={{ tileload: () => onTile(true), tileerror: () => onTile(false) }}
      />
      <FitToRoute points={fitPoints} />

      {layers.metro && (
        <>
          <Polyline positions={METRO_MRT6.fullPolyline} pathOptions={{ color: MODE_STYLE[TransportMode.METRO].color, weight: 4, opacity: 0.55 }} />
          {METRO_MRT6.stops.map((s) => (
            <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={4} pathOptions={{ color: MODE_STYLE[TransportMode.METRO].color, fillColor: "#fff", fillOpacity: 1, weight: 2 }}>
              <Tooltip direction="top" offset={[0, -4]}>{s.name}</Tooltip>
            </CircleMarker>
          ))}
        </>
      )}
      {layers.bikolpo && <Polyline positions={BIKOLPO_BUS.fullPolyline} pathOptions={{ color: MODE_STYLE[TransportMode.BUS].color, weight: 3, opacity: 0.45 }} />}
      {layers.uttara && <Polyline positions={UTTARA_BUS.fullPolyline} pathOptions={{ color: "#EA580C", weight: 3, opacity: 0.45 }} />}

      {/* the naive path through the flooded corridor, for contrast */}
      {shadowPts.length > 1 && disruptedHubIds.length > 0 && (
        <Polyline positions={shadowPts} pathOptions={{ color: "#DC2626", weight: 3, opacity: 0.7, dashArray: "2 9", lineCap: "round" }}>
          <Tooltip sticky>{t("সাধারণ পথ (বন্যাকবলিত)", "Naive route (flooded)")}</Tooltip>
        </Polyline>
      )}

      {/* Active incident corridors (e.g. Malibagh gridlock, Farmgate waterlogging) */}
      {activeAlertCorridors.map(({ alert, edge, pts, isSevered }) => (
        <Polyline
          key={`alert-corridor-${alert.alert_id}`}
          positions={pts}
          pathOptions={{
            color: isSevered ? "#DC2626" : "#D97706",
            weight: 5,
            opacity: 0.85,
            dashArray: isSevered ? "4 8" : "6 6",
            lineCap: "round",
          }}
        >
          <Tooltip sticky>
            <strong>{hubName(edge.origin_hub_id, lang)} → {hubName(edge.dest_hub_id, lang)}</strong>
            <br />
            {isSevered ? "⛔ " : "⚠️ "}{incidentName(alert.incident_type, lang)} · {alertStatusName(alert.status, lang)} ({n(alert.confidence_pct.toFixed(1))}%)
          </Tooltip>
        </Polyline>
      ))}

      {/* 1. Seamless white underlay casing spanning the entire continuous route */}
      {fitPoints.length > 1 && (
        <Polyline
          positions={fitPoints}
          pathOptions={{
            color: "#ffffff",
            weight: 11,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {/* 2. The verified route, leg by leg with solid continuous mode styling */}
      {legs.map(({ leg, pts, km }, i) => {
        const style = MODE_STYLE[leg.mode];
        return (
          <Polyline
            key={`${leg.edge_id}-${i}`}
            positions={pts}
            pathOptions={{
              color: style.color,
              weight: leg.mode === TransportMode.METRO ? 7 : 6,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
              dashArray: leg.mode === TransportMode.WALK ? "3 6" : undefined,
            }}
          >
            <Tooltip sticky>
              <strong>{leg.route_name}</strong>
              <br />
              {modeName(leg.mode, lang)} · {n(leg.effective_fare_bdt)} ৳ · {n(km.toFixed(1))} {t("কিমি", "km")}
            </Tooltip>
          </Polyline>
        );
      })}

      {/* hubs */}
      {Object.values(CANONICAL_HUBS).map((hub) => {
        const alert = alerts.find((a) => a.hub_id === hub.hub_id && a.status !== "EXPIRED" && a.status !== "RESOLVED");
        const isSevered = disruptedHubIds.includes(hub.hub_id as HubId);
        const isCongested = Boolean(alert && !isSevered && alert.confidence_pct >= 50);

        return (
          <React.Fragment key={hub.hub_id}>
            {isSevered && (
              <CircleMarker
                center={[hub.lat, hub.lng]}
                radius={24}
                interactive={false}
                pathOptions={{
                  color: "#DC2626",
                  fillColor: "#F87171",
                  fillOpacity: 0.22,
                  weight: 2,
                  className: "dp-pulse",
                  interactive: false,
                }}
              />
            )}
            {isCongested && (
              <CircleMarker
                center={[hub.lat, hub.lng]}
                radius={22}
                interactive={false}
                pathOptions={{
                  color: "#D97706",
                  fillColor: "#FBBF24",
                  fillOpacity: 0.28,
                  weight: 2,
                  className: "dp-pulse-amber",
                  interactive: false,
                }}
              />
            )}
            <CircleMarker
              center={[hub.lat, hub.lng]}
              radius={isSevered ? 10 : isCongested ? 8.5 : 6}
              pathOptions={{
                color: isSevered ? "#B91C1C" : isCongested ? "#D97706" : "#15863B",
                fillColor: isSevered ? "#DC2626" : isCongested ? "#F59E0B" : "#fff",
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                opacity={1}
                className={isSevered ? "dp-crisis-tooltip" : isCongested ? "dp-warn-tooltip" : undefined}
              >
                {alert ? (
                  <div className="p-2 space-y-1.5 min-w-[220px] max-w-[280px]">
                    <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1">
                      <span className="font-black text-[13px] flex items-center gap-1.5 text-ink">
                        {isSevered ? "⛔" : "⚠️"} {hubName(hub.hub_id as HubId, lang)}
                      </span>
                      <span
                        className={cn(
                          "text-[9.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider text-white shadow-xs",
                          isSevered ? "bg-red-600" : "bg-amber-600"
                        )}
                      >
                        {isSevered ? t("করিডোর অবরুদ্ধ", "SEVERED") : t("ধীরগতি", "GRIDLOCK")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11.5px] font-bold">
                      <span className={isSevered ? "text-red-700" : "text-amber-800"}>
                        {isSevered ? "💧 " : "🚗 "}{incidentName(alert.incident_type, lang)}
                      </span>
                      <span className="text-[11px] font-mono font-semibold px-1 py-0.5 rounded bg-black/5">
                        R<sub>e</sub> {n(alert.confidence_pct.toFixed(1))}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 leading-snug">
                      {alert.incident_type === IncidentType.WATERLOGGING
                        ? t(
                            "হাঁটু থেকে কোমর সমান পানি। ফার্মগেট করিডোরে বাস চলাচল বন্ধ।",
                            "Knee-to-waist deep water. Surface transit halted."
                          )
                        : alert.incident_type === IncidentType.SEVERE_GRIDLOCK
                        ? t(
                            "মালিবাগ রেলগেটে দীর্ঘ জটলা। অতিরিক্ত ৩০-৪৫ মিনিট বিলম্ব।",
                            "Severe railgate bottleneck. Delays of 30-45 minutes."
                          )
                        : t("করিডোরে যান চলাচল ব্যাহত।", "Corridor transit disrupted.")}
                    </div>

                    {isSevered && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded px-1.5 py-1 text-[10.5px] font-bold text-emerald-900 flex items-center gap-1">
                        <span>🔀</span>
                        <span>{t("উড়ালসেতু বাইপাস সক্রিয় (বিহঙ্গ)", "Flyover bypass active (Bihanga)")}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 pt-1 border-t border-black/5 flex items-center justify-between">
                      <span>{alert.votes.length} {t("নাগরিক রিপোর্ট যাচাইকৃত", "verified reports")}</span>
                      <span className="font-semibold text-brand-dark">{t("ক্লিক করে বিস্তারিত", "Click for actions")}</span>
                    </div>
                  </div>
                ) : (
                  <span className="font-semibold text-[12px] px-1">{hubName(hub.hub_id as HubId, lang)}</span>
                )}
              </Tooltip>
              <Popup>
                <div className="space-y-2.5 p-1 min-w-[240px] max-w-[290px]">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-1.5">
                    <div>
                      <div className="text-[15px] font-black text-ink">{hubName(hub.hub_id as HubId, lang)}</div>
                      <div className="text-[10.5px] text-slate-500 font-medium">Hub: {hub.hub_id}</div>
                    </div>
                    {isSevered ? (
                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        {t("অবরুদ্ধ", "SEVERED")}
                      </span>
                    ) : isCongested ? (
                      <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {t("তীব্র জটলা", "GRIDLOCK")}
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {t("স্বাভাবিক", "NORMAL")}
                      </span>
                    )}
                  </div>

                  {alert ? (
                    <div className="space-y-2">
                      <div
                        className={cn(
                          "rounded-xl p-2.5 space-y-1.5 text-[12px]",
                          isSevered ? "bg-red-50 text-red-900 border border-red-200" : "bg-amber-50 text-amber-900 border border-amber-200"
                        )}
                      >
                        <div className="font-black text-[13px] flex items-center gap-1.5">
                          <span>{isSevered ? "⛔" : "⚠️"}</span>
                          <span>{incidentName(alert.incident_type, lang)}</span>
                        </div>
                        <div className="text-[11.5px] leading-snug">
                          {alert.incident_type === IncidentType.WATERLOGGING
                            ? t(
                                "পানি জমে ফার্মগেট করিডোর অবরুদ্ধ। মিরপুর-মতিঝিল সংযোগ বন্ধ। ইঞ্জিনিয়ারিং বাইপাস সক্রিয়।",
                                "Severe waterlogging halting surface buses. Mirpur-Motijheel corridor severed. Flyover detour active."
                              )
                            : alert.incident_type === IncidentType.SEVERE_GRIDLOCK
                            ? t(
                                "মালিবাগ মোড়ে তীব্র অচলাবস্থা। যান চলাচলের গতি প্রায় শূন্য।",
                                "Standstill bottleneck. Surface speeds under 5 km/h."
                              )
                            : t("করিডোরে যান চলাচল ব্যাহত।", "Corridor transit disrupted.")}
                        </div>
                        <div className="pt-1 border-t border-current/15 flex items-center justify-between text-[11px] font-semibold">
                          <span>{t("বিশ্বস্ততা স্কোর", "Trust Score")}: <strong>{n(alert.confidence_pct.toFixed(1))}%</strong></span>
                          <span>{alert.votes.length} {t("টি রিপোর্ট", "votes")}</span>
                        </div>
                      </div>

                      {isSevered && (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-[11.5px] text-emerald-900">
                          <div className="font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                            <span>✅</span>
                            <span>{t("স্মার্ট বাইপাস চালু", "Active Smart Detour")}</span>
                          </div>
                          <div>{t("বিহঙ্গ পরিবহন (আগারগাঁও-মহাখালী উড়ালসেতু) দিয়ে নিরাপদ বাইপাস।", "Bypassing Farmgate via Agargaon-Mohakhali Flyover (Bihanga Paribahan).")}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[12px] font-semibold text-brand-dark flex items-center gap-1.5 py-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-brand"></span>
                      {t("চলাচল স্বাভাবিক রয়েছে", "Operating normally, no disruptions")}
                    </div>
                  )}

                  {/* Direct Origin (A) / Destination (B) setter from Map */}
                  <div className="pt-2 border-t border-line flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => store.planDirect(hub.hub_id as HubId, activeQuery.dest_hub_id)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-brand-mint border border-brand text-[12px] font-bold text-brand-dark hover:bg-brand hover:text-white transition-colors text-center shadow-xs"
                    >
                      {t("শুরু (A)", "Set From (A)")}
                    </button>
                    <button
                      type="button"
                      onClick={() => store.planDirect(activeQuery.origin_hub_id, hub.hub_id as HubId)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#F0FDF4] border border-[#0E2A1A] text-[12px] font-bold text-[#0E2A1A] hover:bg-[#0E2A1A] hover:text-white transition-colors text-center shadow-xs"
                    >
                      {t("গন্তব্য (B)", "Set To (B)")}
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}

      {/* numbered boarding pins for every transfer hub between A and B */}
      {routeStops.slice(1, -1).map((h, i) => {
        const hub = CANONICAL_HUBS[h];
        return (
          <Marker key={`stop-${h}`} position={[hub.lat, hub.lng]} icon={pin(String(i + 1), "#15863B")} zIndexOffset={900}>
            <Tooltip direction="top" offset={[0, -28]}>{hubName(h, lang)}</Tooltip>
          </Marker>
        );
      })}

      {fitPoints.length > 1 && (
        <>
          <Marker position={[origin.lat, origin.lng]} icon={originIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -28]}>{hubName(activeQuery.origin_hub_id, lang)}</Tooltip>
          </Marker>
          <Marker position={[dest.lat, dest.lng]} icon={destIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -28]}>{hubName(activeQuery.dest_hub_id, lang)}</Tooltip>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
