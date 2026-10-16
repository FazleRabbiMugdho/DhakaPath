"use client";

import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  METRO_MRT6,
  BIKOLPO_BUS,
  UTTARA_BUS,
} from "@/data/dhakaTransitData";
import { CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import type { TopologicalRoiState } from "./useTopologicalRoi";
import {
  Train,
  Bus,
  MapPin,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Navigation,
} from "lucide-react";

// Fix standard Leaflet default icons for Next.js bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Create customized SVG divIcons for transit stops
function createPinIcon(color: string, label?: string) {
  return L.divIcon({
    className: "custom-leaflet-pin",
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-12px, -32px);
      ">
        <svg viewBox="0 0 24 32" width="24" height="32" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="${color}"/>
          <circle cx="12" cy="11" r="5" fill="#ffffff"/>
        </svg>
        ${
          label
            ? `<span style="
                position: absolute;
                top: 6px;
                font-size: 8px;
                font-weight: 800;
                color: ${color};
              ">${label}</span>`
            : ""
        }
      </div>
    `,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -28],
  });
}

const standardLeafletIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const metroPinIcon = createPinIcon("#059669", "M");
const bikolpoPinIcon = createPinIcon("#2563EB", "B");
const uttaraPinIcon = createPinIcon("#EA580C", "U");

// Center of Dhaka transit corridor (Hatirjheel / Farmgate / Karwan Bazar intersection)
const DHAKA_DEFAULT_CENTER: [number, number] = [23.775, 90.395];
const DHAKA_DEFAULT_ZOOM = 12;

// Featured demo marker location (Hatirjheel lake promenade)
const DEMO_MARKER_POS: [number, number] = [23.7738, 90.411];

// Helper component to smoothly re-center or fit bounds
function MapController({
  triggerFit,
}: {
  triggerFit: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (triggerFit > 0) {
      // Fit bounds to cover all Dhaka transit routes
      const bounds = L.latLngBounds([
        [23.725, 90.35],
        [23.88, 90.435],
      ]);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [triggerFit, map]);

  return null;
}

interface LeafletDhakaMapProps {
  roiState?: TopologicalRoiState;
}

export default function LeafletDhakaMap({ roiState }: LeafletDhakaMapProps) {
  // Layer Visibility Controls
  const [showMetro, setShowMetro] = useState(true);
  const [showBikolpo, setShowBikolpo] = useState(true);
  const [showUttara, setShowUttara] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showDemoPin, setShowDemoPin] = useState(true);
  const [fitTrigger, setFitTrigger] = useState(0);

  const optimalHubPath = useMemo(() => roiState?.optimalHubPath || [], [roiState?.optimalHubPath]);
  const severedHubIds = roiState?.severedHubIds || [];
  const activeAlerts = roiState?.activeAlerts || [];

  // Optimal route coordinates (lat, lng sequence)
  const optimalPolyline = useMemo(() => {
    if (optimalHubPath.length < 2) return [];
    const pts: [number, number][] = [];
    for (const hubId of optimalHubPath) {
      const h = CANONICAL_HUBS[hubId];
      if (h) pts.push([h.lat, h.lng]);
    }
    return pts;
  }, [optimalHubPath]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-300 bg-[#e5e3df] shadow-md">
      {/* Top Floating Control Toolbar */}
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
          <Navigation className="h-4 w-4 text-emerald-600" />
          <span className="font-sans text-xs font-bold text-slate-800 tracking-tight">
            Dhaka OpenStreetMap
          </span>
        </div>

        {/* Toggle Metro */}
        <button
          type="button"
          onClick={() => setShowMetro((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
            showMetro
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Toggle MRT Line 6 (Metro Rail)"
        >
          <Train className="h-3 w-3" />
          <span>MRT-6</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        {/* Toggle Bikolpo */}
        <button
          type="button"
          onClick={() => setShowBikolpo((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
            showBikolpo
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Toggle Bikolpo Bus Route"
        >
          <Bus className="h-3 w-3" />
          <span>Bikolpo</span>
          <span className="h-2 w-2 rounded-full bg-blue-500" />
        </button>

        {/* Toggle Uttara Bus */}
        <button
          type="button"
          onClick={() => setShowUttara((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
            showUttara
              ? "bg-orange-100 text-orange-800 border border-orange-300"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Toggle Uttara Bus Route"
        >
          <Bus className="h-3 w-3" />
          <span>Uttara</span>
          <span className="h-2 w-2 rounded-full bg-orange-500" />
        </button>

        {/* Toggle 15 Hubs */}
        <button
          type="button"
          onClick={() => setShowHubs((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
            showHubs
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Toggle 15 Canonical Transit Hubs"
        >
          <MapPin className="h-3 w-3" />
          <span>15 Hubs</span>
        </button>

        {/* Toggle Demo Pin */}
        <button
          type="button"
          onClick={() => setShowDemoPin((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
            showDemoPin
              ? "bg-cyan-100 text-cyan-800 border border-cyan-300"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Show CSS Popup Marker like image"
        >
          <Sparkles className="h-3 w-3" />
          <span>Popup Pin</span>
        </button>

        {/* Fit All Routes */}
        <button
          type="button"
          onClick={() => setFitTrigger((n) => n + 1)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
          title="Fit full transit network"
        >
          <Maximize2 className="h-3 w-3 text-slate-600" />
          <span>Fit All</span>
        </button>
      </div>

      {/* Main Leaflet Map Container */}
      <MapContainer
        center={DHAKA_DEFAULT_CENTER}
        zoom={DHAKA_DEFAULT_ZOOM}
        minZoom={10}
        maxZoom={18}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        {/* Real OpenStreetMap Tile Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        <MapController triggerFit={fitTrigger} />

        {/* 1. Metro Rail MRT-6 Polyline & Stations */}
        {showMetro && (
          <>
            <Polyline
              positions={METRO_MRT6.fullPolyline}
              pathOptions={{
                color: "#059669",
                weight: 6,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              <Tooltip sticky>
                <div className="font-sans font-bold text-emerald-800">
                  🚆 MRT Line 6 (Metro Rail Corridor)
                </div>
              </Tooltip>
            </Polyline>

            {METRO_MRT6.stops.map((station) => (
              <Marker
                key={station.id}
                position={[station.lat, station.lng]}
                icon={metroPinIcon}
              >
                <Popup>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                      <span className="font-bold text-emerald-700 text-sm">
                        {station.name}
                      </span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        MRT-6
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Dhaka Mass Rapid Transit Station
                    </p>
                    <div className="text-[11px] font-mono text-slate-500">
                      GPS: {station.lat.toFixed(5)}, {station.lng.toFixed(5)}
                    </div>
                    <div className="mt-1 rounded bg-slate-50 p-1 text-[11px] text-slate-700">
                      <span className="font-semibold">Fare:</span> 20–100 BDT statutory step
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* 2. Bikolpo Bus Route Polyline & Stops */}
        {showBikolpo && (
          <>
            <Polyline
              positions={BIKOLPO_BUS.fullPolyline}
              pathOptions={{
                color: "#2563EB",
                weight: 4.5,
                opacity: 0.85,
                dashArray: "8, 4",
              }}
            >
              <Tooltip sticky>
                <div className="font-sans font-bold text-blue-800">
                  🚌 Bikolpo Paribahan Route
                </div>
              </Tooltip>
            </Polyline>

            {BIKOLPO_BUS.stops.map((stop) => (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lng]}
                icon={bikolpoPinIcon}
              >
                <Popup>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                      <span className="font-bold text-blue-700 text-sm">
                        {stop.name}
                      </span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                        Bus Stop
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Bikolpo Bus: Mirpur 12 ⇄ TSC
                    </p>
                    <div className="text-[11px] font-mono text-slate-500">
                      GPS: {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                    </div>
                    <div className="mt-1 rounded bg-blue-50 p-1 text-[11px] text-blue-800 font-semibold">
                      🎓 Student 50% discount eligible
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* 3. Uttara Bus Route Polyline & Stops */}
        {showUttara && (
          <>
            <Polyline
              positions={UTTARA_BUS.fullPolyline}
              pathOptions={{
                color: "#EA580C",
                weight: 4.5,
                opacity: 0.85,
              }}
            >
              <Tooltip sticky>
                <div className="font-sans font-bold text-orange-800">
                  🚌 Uttara Bus Service Route
                </div>
              </Tooltip>
            </Polyline>

            {UTTARA_BUS.stops.map((stop) => (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lng]}
                icon={uttaraPinIcon}
              >
                <Popup>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                      <span className="font-bold text-orange-700 text-sm">
                        {stop.name}
                      </span>
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-800">
                        Uttara Line
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Uttara Bus: BRTC ⇄ Motijheel
                    </p>
                    <div className="text-[11px] font-mono text-slate-500">
                      GPS: {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* 4. Canonical 15 Hubs */}
        {showHubs &&
          Object.values(CANONICAL_HUBS).map((hub) => {
            const isSevered = severedHubIds.includes(hub.hub_id);
            const alert = activeAlerts.find((a) => a.hub_id === hub.hub_id);

            return (
              <React.Fragment key={hub.hub_id}>
                {isSevered && (
                  <CircleMarker
                    center={[hub.lat, hub.lng]}
                    radius={22}
                    pathOptions={{
                      color: "#EF4444",
                      fillColor: "#F87171",
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: "4, 4",
                    }}
                  />
                )}
                <CircleMarker
                  center={[hub.lat, hub.lng]}
                  radius={7}
                  pathOptions={{
                    color: isSevered ? "#DC2626" : "#0F172A",
                    fillColor: isSevered ? "#EF4444" : "#38BDF8",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {hub.name_en}
                        </span>
                        {isSevered && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            DISRUPTED
                          </span>
                        )}
                      </div>
                      <div className="font-bangla text-xs text-slate-500">
                        {hub.name_bn}
                      </div>
                      {isSevered && alert ? (
                        <div className="mt-1 rounded bg-red-50 p-1.5 text-xs text-red-800">
                          <div className="flex items-center gap-1 font-semibold">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            {alert.incident_type}
                          </div>
                          <div className="text-[11px] text-red-600">
                            Confidence: {alert.confidence_pct.toFixed(0)}%
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-600 font-medium">
                          ✓ Operating normally
                        </div>
                      )}
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -8]}>
                    <span className="font-semibold text-xs">{hub.name_en}</span>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            );
          })}

        {/* 5. Active Optimal Route Pareto P* */}
        {optimalPolyline.length > 1 && (
          <Polyline
            positions={optimalPolyline}
            pathOptions={{
              color: "#06B6D4",
              weight: 7,
              opacity: 0.95,
              lineCap: "round",
            }}
          >
            <Tooltip sticky>
              <div className="font-sans font-bold text-cyan-800">
                ⚡ Active Optimal Route (P*)
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* 6. Featured Reference Marker with Pretty CSS Popup (Matching Prompt Screenshot) */}
        {showDemoPin && (
          <Marker position={DEMO_MARKER_POS} icon={standardLeafletIcon}>
            <Popup autoClose={false} closeOnClick={false}>
              <div className="py-0.5 font-sans">
                <p className="font-medium text-slate-800 text-[14px] leading-tight">
                  A pretty CSS popup.
                </p>
                <p className="text-slate-600 text-[13.5px] leading-tight mt-0.5">
                  Easily customizable.
                </p>
                <div className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-1.5 text-[11px] text-slate-400">
                  <MapPin className="h-3 w-3 text-cyan-600" />
                  <span>Dhaka Central Hub · Leaflet.js</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Bottom Route Legend Strip */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-full bg-emerald-600" />
          MRT-6 Metro (16 stations)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-full bg-blue-600" />
          Bikolpo Bus (18 stops)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-full bg-orange-600" />
          Uttara Bus (20 stops)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
          15 Hubs
        </span>
      </div>
    </div>
  );
}
