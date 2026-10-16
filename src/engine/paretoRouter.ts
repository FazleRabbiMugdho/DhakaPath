import {
  AlertStatus,
  CommuterQuery,
  HubId,
  ParetoRouteOption,
  RouteLeg,
  ScenarioPreset,
  StreetAlert,
  TransitEdge,
  TransportMode,
  ValidationStatus,
} from "../contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../contracts/canonicalGraph";
import { computeEffectiveDurationMs, computeLegCost, computeMrt6FareBdt, computeRegularFareBdt } from "./fareEngine";
import { EPSILON } from "../lib/utils";
import { getExtraEdges, getGraphVersion } from "./graphExtensions";

interface ParetoLabel {
  readonly current_hub: HubId;
  readonly visited_hub_mask: number;
  readonly connector_used: boolean;
  readonly metro_boarding_hub: HubId | null;
  readonly last_motorized_mode: TransportMode | null;
  readonly last_motorized_route: string | null;
  readonly legs: ReadonlyArray<RouteLeg>;
  readonly total_effective_fare_bdt: number;
  readonly total_regular_fare_bdt: number;
  readonly total_duration_ms: number;
  readonly transfers_count: number;
  readonly generalized_cost_score: number;
}

export interface ParetoSearchResult {
  readonly routes: ReadonlyArray<ParetoRouteOption>;
  readonly execution_time_ms: number;
  readonly walk_bridge_active: boolean;
  readonly total_labels_explored: number;
}

class MinHeap {
  private readonly items: ParetoLabel[] = [];

  get length(): number { return this.items.length; }

  push(item: ParetoLabel): void {
    let index = this.items.length;
    this.items.push(item);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.items[parent].generalized_cost_score <= item.generalized_cost_score) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = item;
  }

  pop(): ParetoLabel | undefined {
    const first = this.items[0];
    const last = this.items.pop();
    if (!first || !last || this.items.length === 0) return first;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      if (left >= this.items.length) break;
      const right = left + 1;
      const child = right < this.items.length &&
        this.items[right].generalized_cost_score < this.items[left].generalized_cost_score
        ? right : left;
      if (this.items[child].generalized_cost_score >= last.generalized_cost_score) break;
      this.items[index] = this.items[child];
      index = child;
    }
    this.items[index] = last;
    return first;
  }
}

let adjacency = new Map<HubId, TransitEdge[]>();
let connectorHubs = new Set<HubId>();
let builtGraphVersion = -1;
const routeCache = new Map<string, ParetoSearchResult>();

// G_0 plus any committed extension edges; rebuilt only when the extension set changes.
function syncAdjacency(): void {
  const version = getGraphVersion();
  if (version === builtGraphVersion) return;
  adjacency = new Map();
  connectorHubs = new Set();
  for (const edge of [...CANONICAL_GRAPH_G0, ...getExtraEdges()]) {
    const outgoing = adjacency.get(edge.origin_hub_id) ?? [];
    outgoing.push(edge);
    adjacency.set(edge.origin_hub_id, outgoing);
    if (edge.mode === TransportMode.WALK && edge.origin_hub_id === edge.dest_hub_id) {
      connectorHubs.add(edge.origin_hub_id);
    }
  }
  routeCache.clear();
  builtGraphVersion = version;
}

export function computeGeneralizedCost(durationMs: number, fareBdt: number, transfersCount: number): number {
  return 0.45 * durationMs / (180 * 60000 + EPSILON)
    + 0.40 * fareBdt / (300 + EPSILON)
    + 0.15 * transfersCount / (5 + EPSILON);
}

function dominates(a: ParetoLabel, b: ParetoLabel): boolean {
  return a.total_duration_ms <= b.total_duration_ms
    && a.total_effective_fare_bdt <= b.total_effective_fare_bdt
    && a.transfers_count <= b.transfers_count
    && (a.total_duration_ms < b.total_duration_ms
      || a.total_effective_fare_bdt < b.total_effective_fare_bdt
      || a.transfers_count < b.transfers_count);
}

function sameMetrics(a: ParetoLabel, b: ParetoLabel): boolean {
  return a.total_duration_ms === b.total_duration_ms
    && a.total_effective_fare_bdt === b.total_effective_fare_bdt
    && a.transfers_count === b.transfers_count;
}

function stateKey(label: ParetoLabel): string {
  // Visited-set and boarding state affect future legal edges and transfer costs.
  return [
    label.current_hub, label.visited_hub_mask, Number(label.connector_used),
    label.metro_boarding_hub ?? "",
    label.last_motorized_mode ?? "", label.last_motorized_route ?? "",
  ].join("|");
}

function activeAlert(alert: StreetAlert): boolean {
  return alert.status !== AlertStatus.EXPIRED && alert.status !== AlertStatus.RESOLVED;
}

export function executeParetoSearch(
  query: CommuterQuery,
  preset: ScenarioPreset,
  activeAlerts: ReadonlyArray<StreetAlert> = [],
  poolSizes: Readonly<Record<string, number>> = {}
): ParetoSearchResult {
  const startTime = performance.now();
  syncAdjacency();
  const cacheKey = JSON.stringify([
    query.origin_hub_id, query.dest_hub_id, query.is_student, query.max_budget_bdt,
    [...query.avoid_hub_ids].sort(), preset,
    activeAlerts.map((a) => [
      a.alert_id, a.edge_id, a.hub_id, a.incident_type, a.status,
      a.confidence_pct, a.severity_alpha,
    ]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    Object.entries(poolSizes).sort(([a], [b]) => a.localeCompare(b)),
  ]);
  const cached = routeCache.get(cacheKey);
  if (cached) return { ...cached, execution_time_ms: +(performance.now() - startTime).toFixed(3) };

  const alertsByEdge = new Map<string, StreetAlert>();
  const alertsByHub = new Map<HubId, StreetAlert>();
  for (const alert of activeAlerts) {
    if (!activeAlert(alert)) continue;
    if (alert.edge_id) alertsByEdge.set(alert.edge_id, alert);
    if (alert.hub_id) alertsByHub.set(alert.hub_id, alert);
  }
  const surgeMultiplier = preset === ScenarioPreset.PEAK_CRISIS_SURGE ? 1.8 : 1;
  const avoidHubs = new Set(query.avoid_hub_ids);
  const originIndex = CANONICAL_HUBS[query.origin_hub_id]?.index;
  let exploredTotal = 0;

  function runSearch(allowWalkBypass: boolean): ParetoLabel[] {
    if (originIndex === undefined || !CANONICAL_HUBS[query.dest_hub_id]) return [];
    const frontier = new MinHeap();
    const labelsByState = new Map<string, ParetoLabel[]>();
    const initial: ParetoLabel = {
      current_hub: query.origin_hub_id,
      visited_hub_mask: 1 << originIndex,
      connector_used: false,
      metro_boarding_hub: null,
      last_motorized_mode: null,
      last_motorized_route: null,
      legs: [],
      total_effective_fare_bdt: 0,
      total_regular_fare_bdt: 0,
      total_duration_ms: 0,
      transfers_count: 0,
      generalized_cost_score: 0,
    };
    frontier.push(initial);
    labelsByState.set(stateKey(initial), [initial]);
    const solutions: ParetoLabel[] = [];

    while (frontier.length > 0 && exploredTotal < 5000) {
      const current = frontier.pop()!;
      if (!labelsByState.get(stateKey(current))?.includes(current)) continue;
      exploredTotal++;

      if (current.current_hub === query.dest_hub_id && current.legs.length > 0) {
        if (!solutions.some((solution) => dominates(solution, current) || sameMetrics(solution, current))) {
          for (let i = solutions.length - 1; i >= 0; i--) {
            if (dominates(current, solutions[i])) solutions.splice(i, 1);
          }
          solutions.push(current);
        }
        continue;
      }

      for (const edge of adjacency.get(current.current_hub) ?? []) {
        const isConnector = edge.mode === TransportMode.WALK
          && edge.origin_hub_id === edge.dest_hub_id;
        if (isConnector && (current.connector_used || current.metro_boarding_hub !== null)) continue;
        if (edge.mode === TransportMode.WALK && !isConnector && !allowWalkBypass) continue;
        // The canonical Mirpur-10 footbridge is the access leg for MRT boarding.
        if (edge.mode === TransportMode.METRO && connectorHubs.has(current.current_hub)
          && !current.connector_used && current.metro_boarding_hub === null) continue;

        const nextHub = edge.dest_hub_id;
        const nextIndex = CANONICAL_HUBS[nextHub]?.index;
        if (nextIndex === undefined) continue;
        const nextBit = 1 << nextIndex;
        if (!isConnector && (current.visited_hub_mask & nextBit) !== 0) continue;
        if (avoidHubs.has(nextHub) && nextHub !== query.origin_hub_id
          && nextHub !== query.dest_hub_id) continue;

        const alert = alertsByEdge.get(edge.edge_id) ?? alertsByHub.get(nextHub);
        const duration = computeEffectiveDurationMs(edge, alert, preset);
        if (!Number.isFinite(duration) || duration < 0) continue;

        const rawPoolSize = poolSizes[edge.edge_id];
        const poolSize = Number.isFinite(rawPoolSize) ? Math.trunc(Math.max(1, Math.min(4, rawPoolSize))) : 1;
        // MRT-6 charges a station-to-station ticket, not one minimum fare per
        // graph segment. Charge only the incremental fare while staying onboard.
        const metroBoardingHub = edge.mode === TransportMode.METRO
          ? current.metro_boarding_hub ?? edge.origin_hub_id : null;
        const metroFareIncrement = metroBoardingHub
          ? computeMrt6FareBdt(metroBoardingHub, nextHub)
            - computeMrt6FareBdt(metroBoardingHub, edge.origin_hub_id)
          : 0;
        if (metroFareIncrement < 0) continue;
        const effectiveFare = edge.mode === TransportMode.METRO
          ? metroFareIncrement : computeLegCost(edge, query.is_student, surgeMultiplier, poolSize);
        const totalFare = current.total_effective_fare_bdt + effectiveFare;
        if (query.max_budget_bdt > 0 && totalFare > query.max_budget_bdt) continue;

        const transfer = edge.mode !== TransportMode.WALK && current.last_motorized_mode !== null
          && (current.last_motorized_mode !== edge.mode
            || (edge.mode !== TransportMode.METRO && current.last_motorized_route !== edge.route_name));
        const transfers = current.transfers_count + Number(transfer);
        if (transfers > 4) continue;
        const regularFare = edge.mode === TransportMode.METRO
          ? metroFareIncrement : computeRegularFareBdt(edge, surgeMultiplier);
        const totalDuration = current.total_duration_ms + duration;
        const leg: RouteLeg = {
          edge_id: edge.edge_id,
          origin_hub_id: edge.origin_hub_id,
          dest_hub_id: nextHub,
          mode: edge.mode,
          route_name: edge.route_name,
          regular_fare_bdt: regularFare,
          effective_fare_bdt: effectiveFare,
          surge_multiplier: edge.mode === TransportMode.RICKSHAW ? surgeMultiplier : 1,
          pool_size_count: poolSize,
          effective_duration_ms: duration,
          boarding_landmark: edge.boarding_landmark,
        };
        const next: ParetoLabel = {
          current_hub: nextHub,
          visited_hub_mask: isConnector ? current.visited_hub_mask : current.visited_hub_mask | nextBit,
          connector_used: isConnector,
          metro_boarding_hub: metroBoardingHub,
          last_motorized_mode: edge.mode === TransportMode.WALK ? current.last_motorized_mode : edge.mode,
          last_motorized_route: edge.mode === TransportMode.WALK ? current.last_motorized_route : edge.route_name,
          legs: [...current.legs, leg],
          total_effective_fare_bdt: totalFare,
          total_regular_fare_bdt: current.total_regular_fare_bdt + regularFare,
          total_duration_ms: totalDuration,
          transfers_count: transfers,
          generalized_cost_score: computeGeneralizedCost(totalDuration, totalFare, transfers),
        };
        const key = stateKey(next);
        const existing = labelsByState.get(key) ?? [];
        if (existing.some((label) => dominates(label, next) || sameMetrics(label, next))) continue;
        const retained = existing.filter((label) => !dominates(next, label));
        retained.push(next);
        retained.sort((a, b) => a.generalized_cost_score - b.generalized_cost_score);
        labelsByState.set(key, retained.slice(0, 4));
        if (labelsByState.get(key)!.includes(next)) frontier.push(next);
      }
    }
    return solutions
      .filter((label) => !solutions.some((other) => other !== label && dominates(other, label)))
      .sort((a, b) => a.generalized_cost_score - b.generalized_cost_score);
  }

  let solutions = runSearch(false);
  let walkBridgeActive = false;
  if (solutions.length === 0) {
    solutions = runSearch(true);
    walkBridgeActive = solutions.some((solution) => solution.legs.some((leg) =>
      leg.mode === TransportMode.WALK && leg.origin_hub_id !== leg.dest_hub_id));
  }
  // Collapse routes that share the same ordered edge sequence or land on identical
  // (duration, fare, transfers) — the user never wants to see the same path twice.
  const seenSig = new Set<string>();
  const uniqueSolutions = solutions.filter((s) => {
    const edgeSig = s.legs.map((leg) => leg.edge_id).join(">");
    const metricSig = `${s.total_duration_ms}|${s.total_effective_fare_bdt}|${s.transfers_count}`;
    if (seenSig.has(edgeSig) || seenSig.has(metricSig)) return false;
    seenSig.add(edgeSig);
    seenSig.add(metricSig);
    return true;
  });
  const routes: ParetoRouteOption[] = uniqueSolutions.slice(0, 3).map((solution, index) => ({
    route_id: `pareto_route_${index + 1}_${solution.legs.map((leg) => leg.edge_id).join("_")}`,
    legs: solution.legs,
    total_regular_fare_bdt: solution.total_regular_fare_bdt,
    total_effective_fare_bdt: solution.total_effective_fare_bdt,
    total_duration_ms: solution.total_duration_ms,
    transfers_count: solution.transfers_count,
    generalized_cost_score: +solution.generalized_cost_score.toFixed(6),
    grounding_status: ValidationStatus.GRAPH_GROUNDED,
  }));
  const result: ParetoSearchResult = {
    routes,
    execution_time_ms: +(performance.now() - startTime).toFixed(3),
    walk_bridge_active: walkBridgeActive,
    total_labels_explored: exploredTotal,
  };
  routeCache.set(cacheKey, result);
  return result;
}

export function clearRouteCache(): void {
  routeCache.clear();
}
