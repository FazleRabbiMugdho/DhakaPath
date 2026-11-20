// ==============================================================================
// src/ui/TransitGraphMotif.tsx — DhakaPath's real transit graph as a background
// Draws the 15 canonical hubs at their true coordinates and every G0 edge
// between them. MRT-6 is the solid spine (optionally flowing); road modes are
// thin, informal modes dashed. Decorative only: aria-hidden, no pointer events.
// ==============================================================================

import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import { TransportMode } from "@/contracts/schema";
import { cn } from "@/lib/utils";

const W = 400;
const H = 560;
const PAD = 28;

const hubs = Object.values(CANONICAL_HUBS);
const lats = hubs.map((h) => h.lat);
const lngs = hubs.map((h) => h.lng);
const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
// One scale for both axes keeps the city's real shape.
const scale = Math.min((W - 2 * PAD) / (maxLng - minLng), (H - 2 * PAD) / (maxLat - minLat));
const project = (lat: number, lng: number) => ({
  x: PAD + (lng - minLng) * scale + ((W - 2 * PAD) - (maxLng - minLng) * scale) / 2,
  y: PAD + (maxLat - lat) * scale,
});
const POINTS = Object.fromEntries(hubs.map((h) => [h.hub_id, project(h.lat, h.lng)]));

// One line per hub pair; the "strongest" mode on that pair decides its style.
const RANK: Record<TransportMode, number> = {
  [TransportMode.METRO]: 4, [TransportMode.BUS]: 3, [TransportMode.LEGUNA]: 2,
  [TransportMode.RICKSHAW]: 1, [TransportMode.WALK]: 0,
};
const pairs = new Map<string, { a: string; b: string; mode: TransportMode }>();
for (const edge of CANONICAL_GRAPH_G0) {
  if (edge.origin_hub_id === edge.dest_hub_id) continue;
  const [a, b] = [edge.origin_hub_id, edge.dest_hub_id].sort();
  const key = `${a}|${b}`;
  const prev = pairs.get(key);
  if (!prev || RANK[edge.mode] > RANK[prev.mode]) pairs.set(key, { a, b, mode: edge.mode });
}
const EDGES = [...pairs.values()];

export function TransitGraphMotif({ className, flow = false }: { className?: string; flow?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      {EDGES.map(({ a, b, mode }) => {
        const p = POINTS[a];
        const q = POINTS[b];
        const metro = mode === TransportMode.METRO;
        const road = mode === TransportMode.BUS;
        return (
          <g key={`${a}-${b}`}>
            <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeWidth={metro ? 4 : road ? 1.6 : 1.2}
              strokeOpacity={metro ? 0.9 : road ? 0.55 : 0.45} strokeDasharray={metro || road ? undefined : "3 5"} />
            {metro && flow && (
              <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeWidth={4} stroke="#fff" strokeOpacity={0.55}
                strokeDasharray="6 14" className="dp-flow" />
            )}
          </g>
        );
      })}
      {hubs.map((h) => {
        const p = POINTS[h.hub_id];
        return <circle key={h.hub_id} cx={p.x} cy={p.y} r={5.5} fill="#fff" strokeWidth={2.2} />;
      })}
    </svg>
  );
}
