// ==============================================================================
// src/engine/fareEngine.ts — DETERMINISTIC PIECEWISE TARIFF & SURGE ENGINE
// WAVE 1 — TRACK 1 (Dev 1: Systems & Graph Architect)
// Zero LLM arithmetic: Strictly deterministic piecewise equations
// ==============================================================================

import {
  TransitEdge,
  TransportMode,
  StreetAlert,
  IncidentType,
  ScenarioPreset,
  AlertStatus,
  HubId,
} from "../contracts/schema";
import { EPSILON, clampFinite } from "../lib/utils";

// MRT-6 single-journey fares for the stations represented in the locked G0 graph.
// DMTCL fare chart: https://dmtcl.gov.bd/pages/static-pages/6922df5a933eb65569e2169f
// H_UTTARA denotes Uttara North; the chart is symmetric by journey direction.
const MRT6_FARES: ReadonlyArray<readonly [HubId, HubId, number]> = [
  [HubId.H_UTTARA, HubId.H_MIRPUR10, 40],
  [HubId.H_UTTARA, HubId.H_AGARGAON, 60],
  [HubId.H_UTTARA, HubId.H_FARMGATE, 70],
  [HubId.H_UTTARA, HubId.H_SHAHBAGH, 80],
  [HubId.H_UTTARA, HubId.H_MOTIJHEEL, 100],
  [HubId.H_MIRPUR10, HubId.H_AGARGAON, 20],
  [HubId.H_MIRPUR10, HubId.H_FARMGATE, 30],
  [HubId.H_MIRPUR10, HubId.H_SHAHBAGH, 50],
  [HubId.H_MIRPUR10, HubId.H_MOTIJHEEL, 60],
  [HubId.H_AGARGAON, HubId.H_FARMGATE, 20],
  [HubId.H_AGARGAON, HubId.H_SHAHBAGH, 30],
  [HubId.H_AGARGAON, HubId.H_MOTIJHEEL, 50],
  [HubId.H_FARMGATE, HubId.H_SHAHBAGH, 20],
  [HubId.H_FARMGATE, HubId.H_MOTIJHEEL, 30],
  [HubId.H_SHAHBAGH, HubId.H_MOTIJHEEL, 20],
];

export function computeMrt6FareBdt(origin: HubId, destination: HubId): number {
  if (origin === destination) return 0;
  const pair = MRT6_FARES.find(([a, b]) =>
    (a === origin && b === destination) || (a === destination && b === origin));
  if (!pair) throw new RangeError(`No official MRT-6 fare for ${origin} to ${destination}`);
  return pair[2];
}

// Road Transport and Highways Division's 22 Sep 2026 city-bus notification.
// https://www.bssnews.net/bangla/news-flash/343623
export const DHAKA_CITY_BUS_RATE_BDT_PER_KM = 2.70;

export function computeApprovedBusFareBdt(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new RangeError("Bus distance must be positive and finite");
  }
  return Math.max(10, Math.round(distanceKm * DHAKA_CITY_BUS_RATE_BDT_PER_KM));
}

/**
 * Computes exact monetary fare in BDT for a single transit edge.
 *
 * Piecewise Tariff Formulation:
 * - BUS: 2.70 BDT/km (minimum 10 BDT); eligible students pay half
 * - METRO (MRT-6): official station-pair fare; no student discount is assumed
 * - LEGUNA: F_base [Zero student discount]
 * - RICKSHAW/CNG: ceil((F_base * safeSurge) / (safePoolSize + EPSILON))
 * - WALK: 0 BDT
 */
export function computeLegCost(
  edge: TransitEdge,
  isStudent: boolean,
  surgeMultiplier: number = 1.0,
  poolSizeCount: number = 1
): number {
  switch (edge.mode) {
    case TransportMode.BUS: {
      const regularFare = computeApprovedBusFareBdt(edge.distance_km);
      if (isStudent && edge.student_half_fare_eligible) {
        // The 10 BDT minimum is for a full-price bus ticket, not a second
        // minimum imposed after the published student half-fare concession.
        return Math.ceil(0.5 * regularFare);
      }
      return regularFare;
    }

    case TransportMode.METRO: {
      return computeMrt6FareBdt(edge.origin_hub_id, edge.dest_hub_id);
    }

    case TransportMode.LEGUNA: {
      // Informal paratransit: Fixed commercial fare, zero student discount
      return edge.base_fare_bdt;
    }

    case TransportMode.RICKSHAW: {
      // Surged non-metered connector with dynamic hub pool splitting
      const safeSurge = clampFinite(surgeMultiplier, 1.0, 3.0, 1.0);
      const safePoolSize = Math.trunc(clampFinite(poolSizeCount, 1, 4, 1));
      return Math.ceil((edge.base_fare_bdt * safeSurge) / (safePoolSize + EPSILON));
    }

    case TransportMode.WALK: {
      // Pedestrian footpath bridges and transfers are always free
      return 0;
    }

    default:
      return edge.base_fare_bdt;
  }
}

/**
 * Computes non-discounted regular fare in BDT for comparison baseline.
 */
export function computeRegularFareBdt(
  edge: TransitEdge,
  surgeMultiplier: number = 1.0
): number {
  return computeLegCost(edge, false, surgeMultiplier, 1);
}

/**
 * Evaluates effective traversal duration in milliseconds considering live disruptions.
 *
 * Rules:
 * - If alert has confidence >= 85% and is WATERLOGGING or INTERSECTION_BLOCKADE:
 *   Surface motorized modes (BUS, LEGUNA, RICKSHAW) are SEVERED (T_eff = Infinity).
 *   Grade-separated METRO and WALK bridges are IMMUNE to surface waterlogging.
 * - Otherwise: T_eff = T_base * (1 + alpha_e * (confidence_pct / 100))
 */
export function computeEffectiveDurationMs(
  edge: TransitEdge,
  alert: StreetAlert | undefined,
  preset: ScenarioPreset = ScenarioPreset.NORMAL_BASELINE
): number {
  // The preset supplies alerts and fares; it must not silently change a graph edge's duration.
  void preset;
  // Grade-separated MRT-6 and walking bridges are immune to surface disruption.
  if (edge.mode === TransportMode.METRO || edge.mode === TransportMode.WALK) {
    return edge.base_duration_ms;
  }

  // Expired and resolved reports cannot delay or sever an edge.
  if (alert && alert.status !== AlertStatus.EXPIRED && alert.status !== AlertStatus.RESOLVED) {
    const isSeveringType =
      alert.incident_type === IncidentType.WATERLOGGING ||
      alert.incident_type === IncidentType.INTERSECTION_BLOCKADE;

    if (alert.confidence_pct >= 85.0 && isSeveringType) {
      // Corridor is completely severed
      return Number.POSITIVE_INFINITY;
    }

    // Active moderate disruption: scale duration by severity and confidence
    const confidenceFraction = Math.min(1.0, Math.max(0.0, alert.confidence_pct / 100.0));
    const delayMultiplier = 1.0 + alert.severity_alpha * confidenceFraction;
    const computedDuration = Math.round(edge.base_duration_ms * delayMultiplier);
    return Number.isFinite(computedDuration) ? computedDuration : edge.base_duration_ms;
  }

  return edge.base_duration_ms;
}
