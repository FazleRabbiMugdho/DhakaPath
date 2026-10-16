import {
  AlertStatus,
  CommuterQuery,
  CounterfactualRoiMetrics,
  HubId,
  ParetoRouteOption,
  ScenarioPreset,
  StreetAlert,
  TransitEdge,
  TransportMode,
} from "../contracts/schema";
import { CANONICAL_GRAPH_G0 } from "../contracts/canonicalGraph";
import { computeEffectiveDurationMs, computeRegularFareBdt } from "./fareEngine";

const STALL_BOUND_MS = 112 * 60000;

export function computeSafeTimeDeltaMin(shadowMin: number, optimalMin: number): number {
  const safeShadow = Number.isFinite(shadowMin) ? shadowMin : 112;
  const safeOptimal = Number.isFinite(optimalMin) ? optimalMin : 0;
  return Math.max(0, Math.round(safeShadow - safeOptimal));
}

function findSurfacePath(origin: HubId, destination: HubId, busOnly: boolean): TransitEdge[] {
  // Geographic bus-first baseline, without live disruption avoidance. A solo
  // connector is considered only when no all-bus path exists.
  const distance = new Map<HubId, number>([[origin, 0]]);
  const previous = new Map<HubId, TransitEdge>();
  const pending = new Set<HubId>([origin]);
  while (pending.size > 0) {
    let current: HubId | undefined;
    for (const hub of Array.from(pending)) {
      if (current === undefined || (distance.get(hub) ?? Infinity) < (distance.get(current) ?? Infinity)) current = hub;
    }
    if (!current) break;
    pending.delete(current);
    if (current === destination) break;
    for (const edge of CANONICAL_GRAPH_G0) {
      if (edge.origin_hub_id !== current || edge.mode === TransportMode.METRO
        || (busOnly && edge.mode !== TransportMode.BUS)
        || edge.origin_hub_id === edge.dest_hub_id) continue;
      const nextDistance = (distance.get(current) ?? Infinity) + edge.distance_km;
      if (nextDistance < (distance.get(edge.dest_hub_id) ?? Infinity)) {
        distance.set(edge.dest_hub_id, nextDistance);
        previous.set(edge.dest_hub_id, edge);
        pending.add(edge.dest_hub_id);
      }
    }
  }
  const path: TransitEdge[] = [];
  let current = destination;
  while (current !== origin) {
    const edge = previous.get(current);
    if (!edge) return [];
    path.unshift(edge);
    current = edge.origin_hub_id;
  }
  return path;
}

function naiveSurfacePath(origin: HubId, destination: HubId): TransitEdge[] {
  const busPath = findSurfacePath(origin, destination, true);
  return busPath.length > 0 ? busPath : findSurfacePath(origin, destination, false);
}

function alertForEdge(edge: TransitEdge, alerts: ReadonlyArray<StreetAlert>): StreetAlert | undefined {
  return alerts.find((alert) => alert.status !== AlertStatus.EXPIRED
    && alert.status !== AlertStatus.RESOLVED && alert.edge_id === edge.edge_id)
    ?? alerts.find((alert) => alert.status !== AlertStatus.EXPIRED
      && alert.status !== AlertStatus.RESOLVED && alert.hub_id === edge.dest_hub_id);
}

function routeRisk(edges: ReadonlyArray<Pick<TransitEdge, "edge_id" | "dest_hub_id">>, alerts: ReadonlyArray<StreetAlert>): number {
  let survival = 1;
  for (const edge of edges) {
    const alert = alerts.find((item) => item.status !== AlertStatus.EXPIRED
      && item.status !== AlertStatus.RESOLVED && item.edge_id === edge.edge_id)
      ?? alerts.find((item) => item.status !== AlertStatus.EXPIRED
        && item.status !== AlertStatus.RESOLVED && item.hub_id === edge.dest_hub_id);
    if (alert) survival *= 1 - Math.max(0, Math.min(100, alert.confidence_pct)) / 100;
  }
  return 100 * (1 - survival);
}

export function computeCounterfactualRoi(
  optimalRoute: ParetoRouteOption | null,
  query: CommuterQuery,
  preset: ScenarioPreset,
  alerts: ReadonlyArray<StreetAlert> = []
): CounterfactualRoiMetrics {
  const empty = {
    time_saved_ms: 0,
    cost_saved_bdt: 0,
    risk_reduction_pct: 0,
    shadow_duration_ms: 0,
    shadow_fare_bdt: 0,
    benchmark_manual_latency_ms: 510000,
    benchmark_engine_latency_ms: 1400,
  };
  if (!optimalRoute?.legs.length) return empty;

  const surfacePath = naiveSurfacePath(query.origin_hub_id, query.dest_hub_id);
  const surge = preset === ScenarioPreset.PEAK_CRISIS_SURGE ? 1.8 : 1;
  let shadowDurationMs = 0;
  let shadowFareBdt = 0;
  let baselineRisk = 0;

  if (surfacePath.length > 0) {
    for (const edge of surfacePath) {
      const duration = computeEffectiveDurationMs(edge, alertForEdge(edge, alerts), preset);
      shadowDurationMs += duration;
      shadowFareBdt += computeRegularFareBdt(edge, surge);
    }
    baselineRisk = routeRisk(surfacePath, alerts);
  } else {
    shadowDurationMs = optimalRoute.total_duration_ms;
    shadowFareBdt = optimalRoute.total_regular_fare_bdt;
    baselineRisk = routeRisk(optimalRoute.legs, alerts);
  }

  if (!Number.isFinite(shadowDurationMs)) {
    shadowDurationMs = STALL_BOUND_MS;
  }
  shadowDurationMs = Math.max(0, shadowDurationMs);
  const optimalRisk = routeRisk(optimalRoute.legs, alerts);
  const measuredReduction = baselineRisk > 0
    ? Math.max(0, (baselineRisk - optimalRisk) / baselineRisk * 100) : 0;
  const riskReductionPct = +measuredReduction.toFixed(1);
  return {
    time_saved_ms: Math.max(0, shadowDurationMs - optimalRoute.total_duration_ms),
    cost_saved_bdt: Math.max(0, shadowFareBdt - optimalRoute.total_effective_fare_bdt),
    risk_reduction_pct: riskReductionPct,
    shadow_duration_ms: shadowDurationMs,
    shadow_fare_bdt: shadowFareBdt,
    benchmark_manual_latency_ms: 510000,
    benchmark_engine_latency_ms: 1400,
  };
}
