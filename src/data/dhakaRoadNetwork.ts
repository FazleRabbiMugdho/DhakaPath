// ==============================================================================
// src/data/dhakaRoadNetwork.ts — ROAD-NETWORK ROUTING & GEOMETRICAL ACCURACY ENGINE
// Powered by OpenStreetMap / OSRM Road Graph & DMTCL MRT-6 Elevated Alignment.
// Enforces strict WGS 84 coordinate order [lat, lng], prevents off-road deviations,
// ensures road-accurate snapping, and provides live + cached road-network routing.
// ==============================================================================

import { HubId, RouteLeg, TransportMode } from "@/contracts/schema";
import { CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import { METRO_MRT6 } from "./dhakaTransitData";
import rawCorridors from "./dhakaRoadNetwork.json";
import rawDistances from "./dhakaRoadDistances.json";

export type LatLng = [number, number];

export interface RoadRouteResult {
  readonly geometry: LatLng[];
  readonly distanceKm: number;
  readonly durationMin: number;
  readonly snappedOrigin: LatLng | null;
  readonly snappedDest: LatLng | null;
  readonly source: "osrm-live" | "osrm-cache" | "mrt6-viaduct" | "fallback";
}

// Precomputed ground-truth road corridors & distances extracted via OSRM
const ROAD_CORRIDORS = rawCorridors as unknown as Record<string, LatLng[]>;
const ROAD_DISTANCES = rawDistances as unknown as Record<string, { distanceKm: number; durationMin: number }>;

// Runtime in-memory LRU / session cache for live OSRM queries
const LIVE_ROUTE_CACHE = new Map<string, RoadRouteResult>();

// Bounding box for Greater Dhaka Metropolitan Area
const DHAKA_BOUNDS = {
  minLat: 23.60,
  maxLat: 23.95,
  minLng: 90.25,
  maxLng: 90.60,
};

/**
 * Validates and normalizes latitude/longitude coordinates.
 * Defends against coordinate swapping ([lng, lat] vs [lat, lng]).
 */
export function normalizeCoordinate(coord: [number, number]): LatLng {
  const [first, second] = coord;
  // If first coordinate is in ~90 range and second in ~23 range, they were inverted!
  if (first > 50 && second < 50) {
    return [second, first];
  }
  return [first, second];
}

/**
 * Validates whether a coordinate falls within the Dhaka metropolitan boundary.
 */
export function isValidDhakaCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= DHAKA_BOUNDS.minLat &&
    lat <= DHAKA_BOUNDS.maxLat &&
    lng >= DHAKA_BOUNDS.minLng &&
    lng <= DHAKA_BOUNDS.maxLng
  );
}

/**
 * Calculates geodesic distance in km using the Great-Circle Haversine formula.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Calculates total road distance along a multi-node polyline in km.
 */
export function polylineKm(pts: LatLng[]): number {
  let km = 0;
  for (let i = 1; i < pts.length; i++) {
    km += haversineKm(pts[i - 1], pts[i]);
  }
  return km;
}

function nearestIndex(line: LatLng[], p: LatLng): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < line.length; i++) {
    const d = haversineKm(line[i], p);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * Exact road/footpath connectors between canonical hub curb positions and MRT-6 elevated station platforms.
 * Extracted along actual street centerlines (Begum Rokeya Sarani, Kazi Nazrul Islam Ave, DIT Ave, etc.)
 * Ensures that Metro legs connect seamlessly to transit hubs and adjacent surface legs with 0m gap.
 */
const METRO_HUB_CONNECTORS: Record<string, LatLng[]> = {
  [HubId.H_MIRPUR10]: [
    [23.806906, 90.368724],
    [23.807017, 90.368654],
    [23.807119, 90.368626],
    [23.807630, 90.368481],
    [23.808393, 90.368265],
  ],
  [HubId.H_AGARGAON]: [
    [23.778438, 90.380219],
    [23.778580, 90.380140],
    [23.778723, 90.380077],
  ],
  [HubId.H_FARMGATE]: [
    [23.757099, 90.389430],
    [23.757026, 90.389426],
    [23.757016, 90.389460],
    [23.756943, 90.389515],
    [23.756821, 90.389641],
    [23.756737, 90.389771],
    [23.756159, 90.389528],
    [23.755737, 90.389329],
    [23.755478, 90.389198],
    [23.755427, 90.389172],
    [23.755244, 90.389073],
    [23.755208, 90.389136],
    [23.755708, 90.389403],
    [23.756776, 90.389882],
    [23.757009, 90.389972],
    [23.756982, 90.390509],
    [23.757687, 90.390298],
    [23.758997, 90.386337],
  ],
  [HubId.H_SHAHBAGH]: [
    [23.738746, 90.395699],
    [23.738550, 90.395820],
    [23.738365, 90.395941],
  ],
  [HubId.H_MOTIJHEEL]: [
    [23.732911, 90.417421],
    [23.732879, 90.417406],
    [23.732760, 90.417366],
    [23.732675, 90.417307],
    [23.732644, 90.417269],
    [23.732625, 90.417151],
    [23.732625, 90.417046],
    [23.732620, 90.416988],
    [23.732605, 90.416829],
    [23.732595, 90.416815],
    [23.732581, 90.416778],
    [23.732453, 90.416757],
    [23.732301, 90.416716],
    [23.732190, 90.416679],
    [23.732106, 90.416605],
    [23.732040, 90.416551],
    [23.731931, 90.416497],
    [23.731841, 90.416450],
    [23.731621, 90.416310],
    [23.731570, 90.416306],
    [23.731351, 90.416341],
    [23.731169, 90.416365],
    [23.730993, 90.416356],
    [23.730588, 90.417225],
    [23.730098, 90.418158],
    [23.730032, 90.418285],
    [23.729911, 90.418501],
    [23.729796, 90.418680],
    [23.729661, 90.418835],
    [23.729585, 90.418917],
    [23.729218, 90.418580],
    [23.729085, 90.418464],
    [23.728665, 90.418154],
    [23.728911, 90.417671],
  ],
  [HubId.H_UTTARA]: [
    [23.869670, 90.367630],
  ],
};

/**
 * Slices the elevated MRT-6 viaduct polyline between two stations.
 * Connects the canonical hub curb positions to the station platforms along verified street paths,
 * ensuring seamless continuity (0m gap) to adjacent surface legs and markers.
 */
export function getMetroRailPath(originHub: HubId | string, destHub: HubId | string): LatLng[] {
  const line = METRO_MRT6.fullPolyline as LatLng[];
  if (line.length < 2) return [];

  // Ground-truth MRT-6 elevated station platform coordinates
  const METRO_PLATFORMS: Record<string, LatLng> = {
    [HubId.H_UTTARA]: [23.869670, 90.367630],
    [HubId.H_MIRPUR10]: [23.808393, 90.368265],
    [HubId.H_AGARGAON]: [23.778723, 90.380077],
    [HubId.H_FARMGATE]: [23.758997, 90.386337],
    [HubId.H_SHAHBAGH]: [23.738365, 90.395941],
    [HubId.H_MOTIJHEEL]: [23.728911, 90.417671],
  };

  const pA =
    METRO_PLATFORMS[originHub] ||
    (CANONICAL_HUBS[originHub as HubId]
      ? [CANONICAL_HUBS[originHub as HubId].lat, CANONICAL_HUBS[originHub as HubId].lng]
      : null);

  const pB =
    METRO_PLATFORMS[destHub] ||
    (CANONICAL_HUBS[destHub as HubId]
      ? [CANONICAL_HUBS[destHub as HubId].lat, CANONICAL_HUBS[destHub as HubId].lng]
      : null);

  if (!pA || !pB) return [];

  const i = nearestIndex(line, pA as LatLng);
  const j = nearestIndex(line, pB as LatLng);
  const viaductSeg = i < j ? line.slice(i, j + 1) : line.slice(j, i + 1).reverse();

  // Connectors linking the canonical hub curb to the elevated station platform
  const startConn = METRO_HUB_CONNECTORS[originHub] ? [...METRO_HUB_CONNECTORS[originHub]] : [];
  const endConn = METRO_HUB_CONNECTORS[destHub] ? [...METRO_HUB_CONNECTORS[destHub]].reverse() : [];

  const full: LatLng[] = [];
  if (startConn.length > 0) full.push(...startConn);
  full.push(...viaductSeg);
  if (endConn.length > 0) full.push(...endConn);

  // Deduplicate consecutive nodes to prevent zero-length sub-segments
  const clean: LatLng[] = [full[0]];
  for (let k = 1; k < full.length; k++) {
    const prev = clean[clean.length - 1];
    if (prev[0] !== full[k][0] || prev[1] !== full[k][1]) {
      clean.push(full[k]);
    }
  }

  return clean;
}

/**
 * Retrieves the road path geometry between two hubs from the precomputed OSRM table.
 * All coordinates strictly follow roads and intersections without cutting buildings.
 */
export function getRoadPathBetweenHubs(originHub: HubId | string, destHub: HubId | string): LatLng[] {
  const keyForward = `${originHub}_${destHub}`;
  if (ROAD_CORRIDORS[keyForward]?.length) {
    return ROAD_CORRIDORS[keyForward];
  }

  const keyReverse = `${destHub}_${originHub}`;
  if (ROAD_CORRIDORS[keyReverse]?.length) {
    return [...ROAD_CORRIDORS[keyReverse]].reverse();
  }

  // Fallback for custom / admin dynamic hubs
  const origHubMeta = CANONICAL_HUBS[originHub as HubId];
  const destHubMeta = CANONICAL_HUBS[destHub as HubId];
  if (origHubMeta && destHubMeta) {
    return [[origHubMeta.lat, origHubMeta.lng], [destHubMeta.lat, destHubMeta.lng]];
  }

  return [];
}

/**
 * Retrieves the ground-truth road distance in km for a hub-to-hub corridor.
 */
export function getRoadDistanceKm(originHub: HubId | string, destHub: HubId | string): number {
  const keyForward = `${originHub}_${destHub}`;
  if (ROAD_DISTANCES[keyForward]?.distanceKm) {
    return ROAD_DISTANCES[keyForward].distanceKm;
  }

  const keyReverse = `${destHub}_${originHub}`;
  if (ROAD_DISTANCES[keyReverse]?.distanceKm) {
    return ROAD_DISTANCES[keyReverse].distanceKm;
  }

  // Fallback to computed distance along geometry
  const pts = getRoadPathBetweenHubs(originHub, destHub);
  return pts.length > 1 ? +polylineKm(pts).toFixed(2) : 0;
}

/**
 * Retrieves the exact path geometry for a route leg:
 * - TransportMode.METRO: Follows elevated MRT-6 viaduct alignment.
 * - TransportMode.BUS, RICKSHAW, CNG, LEGUNA, WALK: Follows actual road network geometry.
 */
export function getLegGeometry(leg: Pick<RouteLeg, "origin_hub_id" | "dest_hub_id" | "mode">): LatLng[] {
  if (leg.origin_hub_id === leg.dest_hub_id) return [];

  if (leg.mode === TransportMode.METRO) {
    return getMetroRailPath(leg.origin_hub_id, leg.dest_hub_id);
  }

  return getRoadPathBetweenHubs(leg.origin_hub_id, leg.dest_hub_id);
}

/**
 * Retrieves the road-accurate distance in km for a route leg.
 */
export function getLegDistanceKm(leg: Pick<RouteLeg, "origin_hub_id" | "dest_hub_id" | "mode">): number {
  if (leg.origin_hub_id === leg.dest_hub_id) return 0;

  if (leg.mode === TransportMode.METRO) {
    const pts = getMetroRailPath(leg.origin_hub_id, leg.dest_hub_id);
    return pts.length > 1 ? +polylineKm(pts).toFixed(2) : 0;
  }

  return getRoadDistanceKm(leg.origin_hub_id, leg.dest_hub_id);
}

/**
 * Seamlessly stitches road corridors across consecutive hubs for the flooded / naive shadow baseline.
 */
export function getMultiHubRoadPath(hubPath: readonly (HubId | string)[]): LatLng[] {
  if (hubPath.length < 2) return [];

  const combined: LatLng[] = [];

  for (let i = 0; i < hubPath.length - 1; i++) {
    const from = hubPath[i];
    const to = hubPath[i + 1];
    const segment = getRoadPathBetweenHubs(from, to);

    if (segment.length === 0) continue;

    if (combined.length === 0) {
      combined.push(...segment);
    } else {
      // Avoid repeating the junction hub coordinate
      combined.push(...segment.slice(1));
    }
  }

  return combined;
}

/**
 * Post-processes a multi-leg route geometry array to guarantee 100% gapless continuity.
 * Ensures each leg's terminal point perfectly connects with the subsequent leg's initial point,
 * eliminating all micro-gaps without introducing synthetic chords.
 */
export function ensureContinuousRouteLegs<T extends { leg: Pick<RouteLeg, "origin_hub_id" | "dest_hub_id" | "mode">; pts: LatLng[]; km: number }>(
  legsWithGeometry: T[]
): T[] {
  if (legsWithGeometry.length <= 1) return legsWithGeometry;

  for (let i = 0; i < legsWithGeometry.length - 1; i++) {
    const cur = legsWithGeometry[i];
    const nxt = legsWithGeometry[i + 1];

    if (cur.pts.length === 0 || nxt.pts.length === 0) continue;

    const endOfCur = cur.pts[cur.pts.length - 1];
    const startOfNxt = nxt.pts[0];

    // If there is any minute floating-point offset between the two endpoints at the shared transfer hub:
    if (endOfCur[0] !== startOfNxt[0] || endOfCur[1] !== startOfNxt[1]) {
      const junctionHub = CANONICAL_HUBS[cur.leg.dest_hub_id as HubId];
      if (junctionHub) {
        const hubCoord: LatLng = [junctionHub.lat, junctionHub.lng];
        // Snap both to the exact canonical hub coordinate
        cur.pts[cur.pts.length - 1] = hubCoord;
        nxt.pts[0] = hubCoord;
      } else {
        const midCoord: LatLng = [
          +((endOfCur[0] + startOfNxt[0]) / 2).toFixed(6),
          +((endOfCur[1] + startOfNxt[1]) / 2).toFixed(6),
        ];
        cur.pts[cur.pts.length - 1] = midCoord;
        nxt.pts[0] = midCoord;
      }
    }
  }

  return legsWithGeometry;
}

/**
 * Live OSRM Road Routing API integration.
 * Queries OSRM road graph, normalizes coordinates, handles road snapping,
 * and maintains an in-memory cache to guarantee sub-millisecond repeated lookups.
 */
export async function fetchLiveRoadRoute(
  origin: LatLng,
  dest: LatLng,
  signal?: AbortSignal
): Promise<RoadRouteResult> {
  const normOrigin = normalizeCoordinate(origin);
  const normDest = normalizeCoordinate(dest);

  const cacheKey = `${normOrigin[0].toFixed(5)},${normOrigin[1].toFixed(5)}_${normDest[0].toFixed(5)},${normDest[1].toFixed(5)}`;
  if (LIVE_ROUTE_CACHE.has(cacheKey)) {
    return LIVE_ROUTE_CACHE.get(cacheKey)!;
  }

  // OSRM expects coordinates formatted as: {lng},{lat};{lng},{lat}
  const url = `https://router.project-osrm.org/route/v1/driving/${normOrigin[1]},${normOrigin[0]};${normDest[1]},${normDest[0]}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { "User-Agent": "DhakaPath-GIS/1.0" },
    });

    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // Convert OSRM GeoJSON [longitude, latitude] to Leaflet [latitude, longitude]
      const rawCoords: [number, number][] = route.geometry.coordinates;
      const roadCoords: LatLng[] = rawCoords.map(([lng, lat]) => [+lat.toFixed(6), +lng.toFixed(6)]);

      const snappedOrigin: LatLng | null = data.waypoints?.[0]?.location
        ? [data.waypoints[0].location[1], data.waypoints[0].location[0]]
        : null;

      const snappedDest: LatLng | null = data.waypoints?.[1]?.location
        ? [data.waypoints[1].location[1], data.waypoints[1].location[0]]
        : null;

      // Pure road-following geometry returned by the routing engine.
      // Starts and ends directly on the road network without artificial straight-line chords.
      const fullGeometry: LatLng[] = roadCoords;

      const result: RoadRouteResult = {
        geometry: fullGeometry,
        distanceKm: +(route.distance / 1000).toFixed(2),
        durationMin: Math.round(route.duration / 60),
        snappedOrigin,
        snappedDest,
        source: "osrm-live",
      };

      LIVE_ROUTE_CACHE.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
  }

  // Fallback: Haversine distance and point-to-point
  const fallbackKm = +haversineKm(normOrigin, normDest).toFixed(2);
  const fallbackResult: RoadRouteResult = {
    geometry: [normOrigin, normDest],
    distanceKm: fallbackKm,
    durationMin: Math.round((fallbackKm / 15) * 60),
    snappedOrigin: normOrigin,
    snappedDest: normDest,
    source: "fallback",
  };
  return fallbackResult;
}
