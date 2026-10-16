"use client";

// ==============================================================================
// src/shell/TopologicalMap.tsx — ZONE 2 TOP: DUAL-LAYER 15-HUB MAP
// Layer 1: dark-filtered OSM tiles (SSR-safe, graceful offline fallback).
// Layer 2: interactive metro-style SVG schematic of CANONICAL_GRAPH_G0 with the
// animated Pareto P*, muted shadow baseline, pulsing severed hubs, walk-bridge
// bypass arc, and a glass popover carrying boarding + fare + surge detail.
// ==============================================================================

import React, { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { cn, clampFinite } from "@/lib/utils";
import {
  HubId,
  TransportMode,
  TransitEdge,
  ScenarioPreset,
  IncidentType,
} from "@/contracts/schema";
import { CANONICAL_HUBS, CANONICAL_GRAPH_G0 } from "@/contracts/canonicalGraph";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { MODE_VISUALS, TransitModeIcon } from "./transitArt";
import type { TopologicalRoiState } from "./useTopologicalRoi";
import { Layers, Grid3x3, MapPin, Footprints, TriangleAlert, Route } from "lucide-react";

// Leaflet is browser-only — load LeafletDhakaMap with SSR disabled so the server
// render never touches `window`, and gracefully falls back to the schematic if needed.
const LeafletDhakaMap = dynamic(() => import("./LeafletDhakaMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#070B14] text-cyan-400">
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        LOADING LEAFLET OPENSTREETMAP (CSV DATASET)...
      </div>
    </div>
  ),
});

const VIEW_W = 800;
const VIEW_H = 600;

interface TopologicalMapProps {
  roiState: TopologicalRoiState;
  className?: string;
}

function hubXY(id: HubId): { x: number; y: number } {
  const h = CANONICAL_HUBS[id];
  return { x: h.svg_x, y: h.svg_y };
}

// Display-only fare preview (mirrors the statutory piecewise rules; the real
// math lives in Track 1's fareEngine — this never imports it).
function farePreview(edge: TransitEdge, isStudent: boolean, surge: number): { regular: number; effective: number } {
  const regular = edge.base_fare_bdt;
  let effective = regular;
  switch (edge.mode) {
    case TransportMode.BUS:
      effective = isStudent && edge.student_half_fare_eligible ? Math.max(10, Math.ceil(0.5 * regular)) : regular;
      break;
    case TransportMode.METRO:
      effective = Math.min(100, Math.max(20, 10 * Math.ceil((5.0 * edge.distance_km) / 10.0)));
      break;
    case TransportMode.RICKSHAW:
      effective = Math.ceil(regular * clampFinite(surge, 1, 3, 1));
      break;
    case TransportMode.WALK:
      effective = 0;
      break;
    default:
      effective = regular;
  }
  return { regular, effective };
}

function edgeKey(e: TransitEdge): string {
  return `${e.origin_hub_id}>${e.dest_hub_id}:${e.mode}`;
}

// Set of "hubA|hubB" segments on the active optimal path, direction-agnostic.
function pathSegments(hubs: ReadonlyArray<HubId>): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < hubs.length - 1; i++) {
    const a = hubs[i];
    const b = hubs[i + 1];
    s.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return s;
}

export function TopologicalMap({ roiState, className }: TopologicalMapProps) {
  const store = useDhakaPathStore();
  const [hoverHub, setHoverHub] = useState<HubId | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);

  const { optimalHubPath, shadowHubPath, severedHubIds, activeAlerts, walkBridgeActive, osmTilesOnline, toggleOsmTiles } =
    roiState;
  const isStudent = store.activeQuery.is_student;
  const surge = store.surgeMultiplier;
  const isCrisis = store.activePreset === ScenarioPreset.PEAK_CRISIS_SURGE;

  const optimalSegs = useMemo(() => pathSegments(optimalHubPath), [optimalHubPath]);
  const shadowPts = useMemo(
    () => shadowHubPath.map((h) => hubXY(h)).map((p) => `${p.x},${p.y}`).join(" "),
    [shadowHubPath]
  );
  const alertByHub = useMemo(() => {
    const m = new Map<HubId, (typeof activeAlerts)[number]>();
    for (const a of activeAlerts) if (!m.has(a.hub_id)) m.set(a.hub_id, a);
    return m;
  }, [activeAlerts]);

  // Render self-loops (e.g. the Mirpur-10 footbridge) as a small node loop.
  const renderEdge = (e: TransitEdge, idx: number) => {
    const v = MODE_VISUALS[e.mode];
    const a = hubXY(e.origin_hub_id);
    const b = hubXY(e.dest_hub_id);
    const key = `${e.origin_hub_id}|${e.dest_hub_id}`;
    const segKey = e.origin_hub_id < e.dest_hub_id ? key : `${e.dest_hub_id}|${e.origin_hub_id}`;
    const onOptimal = optimalSegs.has(segKey);
    const hovered = hoverEdge === edgeKey(e);

    if (e.origin_hub_id === e.dest_hub_id) {
      return (
        <circle
          key={`e-${idx}`}
          cx={a.x + 11}
          cy={a.y - 11}
          r={6}
          fill="none"
          stroke={v.color}
          strokeWidth={v.strokeWidth}
          strokeDasharray={v.dashArray || undefined}
          opacity={0.75}
        />
      );
    }

    return (
      <line
        key={`e-${idx}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={v.color}
        strokeWidth={hovered ? v.strokeWidth + 1.5 : v.strokeWidth}
        strokeDasharray={v.dashArray || undefined}
        strokeLinecap="round"
        opacity={onOptimal ? 0.28 : hovered ? 0.95 : 0.52}
        onMouseEnter={() => setHoverEdge(edgeKey(e))}
        onMouseLeave={() => setHoverEdge((cur) => (cur === edgeKey(e) ? null : cur))}
        style={{ cursor: "pointer" }}
      />
    );
  };

  const hoveredEdgeData = useMemo(
    () => CANONICAL_GRAPH_G0.find((e) => edgeKey(e) === hoverEdge),
    [hoverEdge]
  );
  const popoverHub = hoverHub;
  const popoverEdge = hoveredEdgeData;

  return (
    <section
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border-[1.5px] border-[#334155] bg-[#0B1220]",
        "shadow-[0_0_40px_-18px_rgba(6,182,212,0.4)]",
        className
      )}
    >
      {/* Scoped keyframes — globals.css is Wave 0 locked, so motion stays local. */}
      <style>{`
        @keyframes dp-flow { to { stroke-dashoffset: -40; } }
        @keyframes dp-sever { 0%,100% { opacity:.25; transform:scale(1);} 50% { opacity:.9; transform:scale(1.35);} }
        @keyframes dp-walk { to { stroke-dashoffset: -24; } }
        @media (prefers-reduced-motion: reduce) {
          .dp-anim { animation: none !important; }
        }
      `}</style>

      {/* Header strip — layer toggle + title */}
      <div className="z-20 flex items-center justify-between gap-2 border-b border-[#1E293B] bg-[#0B111F]/90 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-[#06B6D4]" />
          <h2 className="font-sans text-sm font-bold tracking-tight text-[#E2E8F0]">
            Dhaka Transit Map &amp; Routes
          </h2>
          <span className="hidden font-mono text-[11px] text-[#94A3B8] sm:inline">
            Leaflet.js · OpenStreetMap · MRT-6 · Bikolpo · Uttara Bus
          </span>
        </div>
        <button
          type="button"
          onClick={toggleOsmTiles}
          title={osmTilesOnline ? "Switch to Tactical Schematic" : "Switch to Leaflet OpenStreetMap"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]",
            osmTilesOnline
              ? "border-emerald-500 bg-emerald-950/70 text-emerald-300"
              : "border-[#334155] bg-[#0F172A] text-[#CBD5E1] hover:border-[#06B6D4]/60"
          )}
        >
          {osmTilesOnline ? <Layers className="h-3.5 w-3.5" /> : <Grid3x3 className="h-3.5 w-3.5" />}
          {osmTilesOnline ? "Leaflet OSM" : "Tactical SVG"}
        </button>
      </div>

      {/* Map body */}
      <div className="relative flex-1 h-full min-h-0">
        {osmTilesOnline ? (
          <div className="absolute inset-0">
            <Suspense
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-[#070B14] text-cyan-400">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    LOADING LEAFLET OPENSTREETMAP (CSV DATASET)...
                  </div>
                </div>
              }
            >
              <LeafletDhakaMap roiState={roiState} />
            </Suspense>
          </div>
        ) : (
          <>
            {/* Tactical dot grid fallback */}
            <div className="absolute inset-0 bg-perspective-grid opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(6,182,212,0.10),transparent_60%)]" />

        {/* Layer 2 — interactive SVG schematic overlay */}
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Dhaka 15-hub metro-style transit schematic"
        >
          {/* Base modal edges */}
          <g>{CANONICAL_GRAPH_G0.map(renderEdge)}</g>

          {/* Shadow baseline P_shadow — muted dashed crimson through flooded Farmgate */}
          {isCrisis && (
            <polyline
              points={shadowPts}
              fill="none"
              stroke="#F43F5E"
              strokeWidth={3}
              strokeDasharray="2 9"
              strokeLinecap="round"
              opacity={0.5}
            />
          )}

          {/* Optimal Pareto P* — animated cyan glow line over its segments */}
          <g>
            {optimalHubPath.slice(0, -1).map((h, i) => {
              const a = hubXY(h);
              const b = hubXY(optimalHubPath[i + 1]);
              if (a.x === b.x && a.y === b.y) return null;
              return (
                <g key={`p-${i}`}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#06B6D4" strokeWidth={9} strokeLinecap="round" opacity={0.18} />
                  <line
                    className="dp-anim"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#22D3EE"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    strokeDasharray="14 10"
                    style={{ animation: "dp-flow 1.1s linear infinite" }}
                  />
                </g>
              );
            })}
          </g>

          {/* Walk-bridge bypass arc */}
          {walkBridgeActive &&
            optimalHubPath.length > 1 &&
            (() => {
              const a = hubXY(optimalHubPath[0]);
              const b = hubXY(optimalHubPath[optimalHubPath.length - 1]);
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2 - 70;
              return (
                <path
                  className="dp-anim"
                  d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  strokeDasharray="1 7"
                  strokeLinecap="round"
                  opacity={0.85}
                  style={{ animation: "dp-walk 0.9s linear infinite" }}
                />
              );
            })()}

          {/* Hubs */}
          <g>
            {Object.values(CANONICAL_HUBS).map((h) => {
              const onPath = optimalHubPath.includes(h.hub_id);
              const severed = severedHubIds.includes(h.hub_id);
              const alert = alertByHub.get(h.hub_id);
              const hovered = hoverHub === h.hub_id;
              return (
                <g
                  key={h.hub_id}
                  transform={`translate(${h.svg_x} ${h.svg_y})`}
                  onMouseEnter={() => setHoverHub(h.hub_id)}
                  onMouseLeave={() => setHoverHub((cur) => (cur === h.hub_id ? null : cur))}
                  style={{ cursor: "pointer" }}
                >
                  {/* Severed pulsing ring + cross-hatch badge */}
                  {severed && (
                    <>
                      <circle className="dp-anim" r={16} fill="none" stroke="#F43F5E" strokeWidth={2} style={{ animation: "dp-sever 1.6s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }} />
                      <line x1={-6} y1={-6} x2={6} y2={6} stroke="#F43F5E" strokeWidth={2.2} />
                      <line x1={6} y1={-6} x2={-6} y2={6} stroke="#F43F5E" strokeWidth={2.2} />
                    </>
                  )}
                  <circle
                    r={hovered ? 8.5 : 6.5}
                    fill={severed ? "#1E0510" : onPath ? "#06B6D4" : "#0F172A"}
                    stroke={severed ? "#F43F5E" : onPath ? "#67E8F9" : hovered ? "#06B6D4" : "#475569"}
                    strokeWidth={onPath || severed ? 2.5 : 1.75}
                  />
                  <text
                    x={0}
                    y={h.svg_y > 520 ? 24 : -14}
                    textAnchor="middle"
                    className="font-sans"
                    fontSize={12.5}
                    fontWeight={700}
                    fill={severed ? "#FDA4AF" : onPath ? "#E2FBFF" : "#94A3B8"}
                    style={{ paintOrder: "stroke", stroke: "#070B14", strokeWidth: 3, strokeLinejoin: "round" }}
                  >
                    {h.name_en.split(" ")[0]}
                  </text>
                  {severed && alert && (
                    <text x={0} y={h.svg_y > 520 ? 38 : 30} textAnchor="middle" className="font-mono" fontSize={10.5} fontWeight={700} fill="#FDA4AF" style={{ paintOrder: "stroke", stroke: "#070B14", strokeWidth: 3 }}>
                      R_e {alert.confidence_pct.toFixed(1)}% → ∞
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Severed banner */}
        {walkBridgeActive && (
          <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#F59E0B] bg-[#451A03]/90 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-[#FDE68A] shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-sm">
              <Footprints className="h-3.5 w-3.5" /> DETOUR_WALK_BRIDGE_REQUIRED · 4.5 km/h · 0 BDT
            </span>
          </div>
        )}

        {/* Glass popover (hub or edge) */}
        {(popoverHub || popoverEdge) && (
          <HubEdgePopover
            hub={popoverHub}
            edge={popoverEdge ?? null}
            isStudent={isStudent}
            surge={surge}
            alert={popoverHub ? alertByHub.get(popoverHub) ?? null : null}
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#1E293B] bg-[#0B111F]/85 px-3 py-2 backdrop-blur-sm">
          {Object.values(TransportMode).map((m) => {
            const v = MODE_VISUALS[m];
            return (
              <span key={m} className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#CBD5E1]">
                <svg width="22" height="8" aria-hidden="true">
                  <line x1="1" y1="4" x2="21" y2="4" stroke={v.color} strokeWidth={Math.min(4, v.strokeWidth)} strokeDasharray={v.dashArray || undefined} strokeLinecap="round" />
                </svg>
                {v.label}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#67E8F9]">
            <svg width="22" height="8" aria-hidden="true"><line x1="1" y1="4" x2="21" y2="4" stroke="#22D3EE" strokeWidth={3.5} strokeDasharray="5 3" strokeLinecap="round" /></svg>
            P* Optimal
          </span>
        </div>
        </>
        )}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Glass popover — boarding landmark, student vs regular fare, active surge.
// -----------------------------------------------------------------------------

function HubEdgePopover({
  hub,
  edge,
  isStudent,
  surge,
  alert,
}: {
  hub: HubId | null;
  edge: TransitEdge | null;
  isStudent: boolean;
  surge: number;
  alert: { confidence_pct: number; incident_type: IncidentType } | null;
}) {
  if (edge) {
    const v = MODE_VISUALS[edge.mode];
    const { regular, effective } = farePreview(edge, isStudent, surge);
    const anchor = hubXY(edge.origin_hub_id);
    const bx = hubXY(edge.dest_hub_id);
    const cx = (anchor.x + bx.x) / 2;
    const cy = (anchor.y + bx.y) / 2;
    return (
      <PopoverShell x={cx} y={cy}>
        <div className="mb-1.5 flex items-center gap-2">
          <TransitModeIcon mode={edge.mode} size={34} />
          <div>
            <div className="font-sans text-[13px] font-bold text-white">{edge.route_name}</div>
            <div className="font-mono text-[11px]" style={{ color: v.color }}>
              {v.label} · {edge.distance_km.toFixed(1)} km
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[12px] tabular-nums">
          {regular !== effective ? (
            <>
              <span className="text-[#64748B] line-through">{regular} BDT</span>
              <span className="font-bold text-[#6EE7B7]">{effective} BDT</span>
              {isStudent && edge.mode === TransportMode.BUS && (
                <span className="rounded-full bg-[#064E3B]/70 px-1.5 py-0.5 text-[10px] font-bold text-[#A7F3D0]">STU 50%</span>
              )}
            </>
          ) : (
            <span className="font-bold text-[#E2E8F0]">{effective} BDT</span>
          )}
          {surge > 1.01 && edge.mode === TransportMode.RICKSHAW && (
            <span className="rounded-full bg-[#451A03]/80 px-1.5 py-0.5 text-[10px] font-bold text-[#FDE68A]">{surge.toFixed(1)}x SURGE</span>
          )}
        </div>
        <div className="mt-1.5 flex items-start gap-1 font-sans text-[11px] text-[#CBD5E1]">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#06B6D4]" />
          {edge.boarding_landmark}
        </div>
      </PopoverShell>
    );
  }

  if (hub) {
    const h = CANONICAL_HUBS[hub];
    return (
      <PopoverShell x={h.svg_x} y={h.svg_y}>
        <div className="font-sans text-[13px] font-bold text-white">{h.name_en}</div>
        <div className="font-bangla text-[12px] text-[#94A3B8]">{h.name_bn}</div>
        {alert ? (
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#F43F5E] bg-[#4C0519]/70 px-2 py-0.5 font-mono text-[10.5px] font-bold text-[#FDA4AF]">
            <TriangleAlert className="h-3 w-3" /> {alert.incident_type} · R_e {alert.confidence_pct.toFixed(1)}%
          </div>
        ) : (
          <div className="mt-1.5 font-mono text-[11px] text-[#6EE7B7]">Corridor clear · no active disruption</div>
        )}
      </PopoverShell>
    );
  }
  return null;
}

function PopoverShell({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  const leftPct = clampFinite((x / VIEW_W) * 100, 4, 72, 50);
  const topPct = clampFinite((y / VIEW_H) * 100, 6, 78, 50);
  return (
    <div
      className="pointer-events-none absolute z-30 w-[244px] -translate-x-1/2 rounded-2xl border-[1.5px] border-[#06B6D4]/50 bg-[#0F172A]/95 p-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md"
      style={{ left: `${leftPct}%`, top: `calc(${topPct}% + 18px)`, borderTopColor: "rgba(255,255,255,0.15)" }}
    >
      {children}
    </div>
  );
}
