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
} from "../contracts/schema";
import { EPSILON, clampFinite } from "../lib/utils";

/**
 * Computes exact monetary fare in BDT for a single transit edge.
 *
 * Piecewise Tariff Formulation:
 * - BUS (Student): max(10, ceil(0.5 * F_base)) if eligible, else F_base
 * - METRO (MRT-6): min(100, max(20, 10 * ceil(5.0 * distance_km / 10.0))) [Zero student discount]
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
      if (isStudent && edge.student_half_fare_eligible) {
        // Enforces statutory 50% student discount with a strict 10 BDT floor
        return Math.max(10, Math.ceil(0.5 * edge.base_fare_bdt));
      }
      return edge.base_fare_bdt;
    }

    case TransportMode.METRO: {
      // DMTCL MRT-6 20-100 BDT step matrix at 5 BDT/km, stepped in 10 BDT increments
      // Strictly ZERO student half-pass discount per DMTCL statutory rules
      const rawDistanceTariff = 5.0 * edge.distance_km;
      const steppedFare = 10 * Math.ceil(rawDistanceTariff / 10.0);
      return Math.min(100, Math.max(20, steppedFare));
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
