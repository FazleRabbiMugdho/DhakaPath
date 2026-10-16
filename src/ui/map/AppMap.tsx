"use client";

// Real OpenStreetMap layer (Leaflet). Draws the MRT-6 / Bikolpo / Uttara lines, the 15 hubs,
// the chosen route leg-by-leg in mode colours, the naive "shadow" path through the flooded
// corridor, and a pulsing ring on every disrupted hub. Loaded client-only by MapPanel.

import React, { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet";
import { METRO_MRT6, BIKOLPO_BUS, UTTARA_BUS } from "@/data/dhakaTransitData";
import { CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import { HubId, TransportMode } from "@/contracts/schema";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { MODE_STYLE, hubName, incidentName, alertStatusName, modeName } from "../labels";

export interface MapLayers {
  metro: boolean;
  bikolpo: boolean;
  uttara: boolean;
}

const CENTER: [number, number] = [23.775, 90.395];
type LL = [number, number];

function haversineKm(a: LL, b: LL): number {
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
function polylineKm(pts: LL[]): number {
  let km = 0;
  for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i]);
  return km;
}
function nearestIndex(line: LL[], p: LL): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < line.length; i++) {
    const d = haversineKm(line[i], p);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
// Real rail/road geometry between two stops, snapped to the CSV polyline.
function slicePolyline(line: LL[], a: LL, b: LL): LL[] {
  if (line.length < 2) return [a, b];
  const i = nearestIndex(line, a);
  const j = nearestIndex(line, b);
  if (i === j) return [a, b];
  const seg = i < j ? line.slice(i, j + 1) : line.slice(j, i + 1).reverse();
  return [a, ...seg, b];
}

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
  const { selectedRoute, shadowHubPath, disruptedHubIds, alerts, activeQuery } = useDhakaPathStore();

  const legs = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.legs
      .filter((leg) => leg.origin_hub_id !== leg.dest_hub_id)
      .map((leg) => {
        const a: LL = [CANONICAL_HUBS[leg.origin_hub_id].lat, CANONICAL_HUBS[leg.origin_hub_id].lng];
        const b: LL = [CANONICAL_HUBS[leg.dest_hub_id].lat, CANONICAL_HUBS[leg.dest_hub_id].lng];
        // Metro legs follow the actual MRT-6 alignment; other modes use a direct link.
        const pts = leg.mode === TransportMode.METRO ? slicePolyline(METRO_MRT6.fullPolyline as LL[], a, b) : [a, b];
        return { leg, pts, km: polylineKm(pts) };
      });
  }, [selectedRoute]);


  const fitPoints = useMemo(() => legs.flatMap((l) => l.pts), [legs]);

  const shadowPts = useMemo(
    () => shadowHubPath.map((h) => [CANONICAL_HUBS[h].lat, CANONICAL_HUBS[h].lng] as [number, number]),
    [shadowHubPath]
  );

  const origin = CANONICAL_HUBS[activeQuery.origin_hub_id];
  const dest = CANONICAL_HUBS[activeQuery.dest_hub_id];
  const originIcon = useMemo(() => pin("A", "#1BA94B"), []);
  const destIcon = useMemo(() => pin("B", "#0E2A1A"), []);

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

      {/* the verified route, leg by leg */}
      {legs.map(({ leg, pts, km }, i) => {
        const style = MODE_STYLE[leg.mode];
        return (
          <React.Fragment key={`${leg.edge_id}-${i}`}>
            <Polyline positions={pts} pathOptions={{ color: "#fff", weight: 11, opacity: 0.95, lineCap: "round" }} />
            <Polyline
              positions={pts}
              pathOptions={{
                color: style.color,
                weight: leg.mode === TransportMode.METRO ? 7 : 6,
                opacity: 1,
                lineCap: "round",
                dashArray: leg.mode === TransportMode.WALK ? "1 10" : leg.mode === TransportMode.RICKSHAW ? "10 8" : undefined,
              }}
            >
              <Tooltip sticky>
                <strong>{leg.route_name}</strong>
                <br />
                {modeName(leg.mode, lang)} · {n(leg.effective_fare_bdt)} ৳ · {n(km.toFixed(1))} {t("কিমি", "km")}
              </Tooltip>
            </Polyline>
          </React.Fragment>
        );
      })}

      {/* hubs */}
      {Object.values(CANONICAL_HUBS).map((hub) => {
        const alert = alerts.find((a) => a.hub_id === hub.hub_id && a.status !== "EXPIRED" && a.status !== "RESOLVED");
        const disrupted = disruptedHubIds.includes(hub.hub_id as HubId);
        return (
          <React.Fragment key={hub.hub_id}>
            {disrupted && (
              <CircleMarker center={[hub.lat, hub.lng]} radius={22} pathOptions={{ color: "#DC2626", fillColor: "#F87171", fillOpacity: 0.22, weight: 2, className: "dp-pulse" }} />
            )}
            <CircleMarker
              center={[hub.lat, hub.lng]}
              radius={disrupted ? 8 : 6}
              pathOptions={{ color: disrupted ? "#DC2626" : "#15863B", fillColor: disrupted ? "#DC2626" : "#fff", fillOpacity: 1, weight: 3 }}
            >
              <Tooltip direction="top" offset={[0, -8]}>{hubName(hub.hub_id as HubId, lang)}</Tooltip>
              <Popup>
                <div className="space-y-1">
                  <div className="text-[15px] font-extrabold text-ink">{hubName(hub.hub_id as HubId, lang)}</div>
                  {alert ? (
                    <div className="rounded-xl bg-danger-bg px-2.5 py-1.5 text-[12.5px] font-semibold text-danger">
                      {incidentName(alert.incident_type, lang)} · {alertStatusName(alert.status, lang)} · R<sub>e</sub> {n(alert.confidence_pct.toFixed(1))}%
                    </div>
                  ) : (
                    <div className="text-[12.5px] font-semibold text-brand-dark">{t("চলাচল স্বাভাবিক", "Operating normally")}</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}

      {fitPoints.length > 1 && (
        <>
          <Marker position={[origin.lat, origin.lng]} icon={originIcon} zIndexOffset={1000} />
          <Marker position={[dest.lat, dest.lng]} icon={destIcon} zIndexOffset={1000} />
        </>
      )}
    </MapContainer>
  );
}
