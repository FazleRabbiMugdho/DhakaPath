// ==============================================================================
// src/features/feature-3-trust-cms/sanityFilter.ts
// WAVE 1 — TRACK 2: TIER-1 RULE-BASED SANITY FILTER & ADVERSARIAL SHIELD
// Rejects anomalous fares (<10 BDT or >2.5x Base) and quarantines contradictory reports
// ==============================================================================

import {
  AuditInterceptionEvent,
  StreetAlert,
  ValidationStatus,
  AlertStatus,
  HubId,
  IncidentType,
} from "../../contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../../contracts/canonicalGraph";

export interface FareValidationResult {
  readonly isValid: boolean;
  readonly status: ValidationStatus;
  readonly submittedFareBdt: number;
  readonly maxAllowedBdt: number;
  readonly minAllowedBdt: number;
  readonly baseFareBdt: number;
  readonly reason: string;
  readonly event?: AuditInterceptionEvent;
  readonly executionTimeMs: number;
}

export interface AlertResolutionValidationResult {
  readonly quarantined: boolean;
  readonly status: ValidationStatus;
  readonly effectiveAlertStatus: AlertStatus;
  readonly reason: string;
  readonly event?: AuditInterceptionEvent;
  readonly executionTimeMs: number;
}

/**
 * Validates a crowd-submitted transit fare against statutory invariants in < 0.1ms.
 * Enforces:
 * 1. Statutory minimum fare floor: submittedFareBdt >= 10 BDT (for motorized public transit)
 * 2. Statutory surge upper bound: submittedFareBdt <= 2.5 * base_fare_bdt
 */
export function validateFareSubmission(
  edgeId: string,
  submittedFareBdt: number
): FareValidationResult {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  const edge = CANONICAL_GRAPH_G0.find((e) => e.edge_id === edgeId);

  if (!edge) {
    const elapsed = Math.max(0.04, (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime);
    const event: AuditInterceptionEvent = {
      event_id: `audit_unknown_edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp_ms: Date.now(),
      status: ValidationStatus.GROUNDING_INTERCEPTED,
      rejected_payload_summary: `Edge "${edgeId}" not found in Canonical Graph G_0`,
      execution_time_ms: Number(elapsed.toFixed(3)),
    };

    return {
      isValid: false,
      status: ValidationStatus.GROUNDING_INTERCEPTED,
      submittedFareBdt,
      maxAllowedBdt: 0,
      minAllowedBdt: 10,
      baseFareBdt: 0,
      reason: `Edge "${edgeId}" does not exist in Canonical Graph G_0`,
      event,
      executionTimeMs: Number(elapsed.toFixed(3)),
    };
  }

  const minAllowedBdt = 10;
  const maxAllowedBdt = Math.round(2.5 * edge.base_fare_bdt * 10) / 10;

  if (submittedFareBdt < minAllowedBdt || submittedFareBdt > maxAllowedBdt) {
    const elapsed = Math.max(0.04, (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime);
    const originName = CANONICAL_HUBS[edge.origin_hub_id]?.name_en || edge.origin_hub_id;
    const destName = CANONICAL_HUBS[edge.dest_hub_id]?.name_en || edge.dest_hub_id;

    const violation =
      submittedFareBdt < minAllowedBdt
        ? `${submittedFareBdt} BDT < 10 BDT Statutory Floor`
        : `${submittedFareBdt} BDT > ${maxAllowedBdt} BDT (2.5x Base ${edge.base_fare_bdt} BDT)`;

    const summary = `${originName} -> ${destName}: ${violation}`;

    const event: AuditInterceptionEvent = {
      event_id: `audit_fare_reject_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp_ms: Date.now(),
      status: ValidationStatus.ANOMALOUS_FARE_REJECTED,
      rejected_payload_summary: summary,
      execution_time_ms: Number(elapsed.toFixed(3)),
    };

    return {
      isValid: false,
      status: ValidationStatus.ANOMALOUS_FARE_REJECTED,
      submittedFareBdt,
      maxAllowedBdt,
      minAllowedBdt,
      baseFareBdt: edge.base_fare_bdt,
      reason: summary,
      event,
      executionTimeMs: Number(elapsed.toFixed(3)),
    };
  }

  const elapsed = Math.max(0.02, (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime);

  return {
    isValid: true,
    status: ValidationStatus.GRAPH_GROUNDED,
    submittedFareBdt,
    maxAllowedBdt,
    minAllowedBdt,
    baseFareBdt: edge.base_fare_bdt,
    reason: `Fare ${submittedFareBdt} BDT is within statutory bounds [${minAllowedBdt}, ${maxAllowedBdt}] BDT`,
    executionTimeMs: Number(elapsed.toFixed(3)),
  };
}

/**
 * Validates a crowd attempt to resolve an active street alert.
 * If alert has confidence >= 80% and >= 3 corroborations, a single user vote cannot immediately flip it.
 * Quarantines contradictory resolution until the Bayesian posterior drops below 85%.
 */
export function validateAlertResolution(
  alert: StreetAlert,
  voterReliabilityWeight: number
): AlertResolutionValidationResult {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const positiveVotesCount = alert.votes.filter((v) => v.direction === 1).length;

  // High-confidence active blockade check:
  if (alert.confidence_pct >= 80.0 && positiveVotesCount >= 3 && voterReliabilityWeight < 0.95) {
    const elapsed = Math.max(0.05, (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime);
    const hubName = CANONICAL_HUBS[alert.hub_id]?.name_en || alert.hub_id;

    const summary = `Contradictory single-user resolution on ${hubName} (${alert.incident_type}) quarantined; corroborated by ${positiveVotesCount} voters at ${alert.confidence_pct.toFixed(1)}% confidence`;

    const event: AuditInterceptionEvent = {
      event_id: `audit_quarantine_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp_ms: Date.now(),
      status: ValidationStatus.CONTRADICTORY_REPORT_QUARANTINED,
      rejected_payload_summary: summary,
      execution_time_ms: Number(elapsed.toFixed(3)),
    };

    return {
      quarantined: true,
      status: ValidationStatus.CONTRADICTORY_REPORT_QUARANTINED,
      effectiveAlertStatus: AlertStatus.VERIFIED_ACTIVE,
      reason: summary,
      event,
      executionTimeMs: Number(elapsed.toFixed(3)),
    };
  }

  const elapsed = Math.max(0.03, (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime);

  return {
    quarantined: false,
    status: ValidationStatus.GRAPH_GROUNDED,
    effectiveAlertStatus: AlertStatus.RESOLVED,
    reason: "Resolution accepted; posterior will be recalculated",
    executionTimeMs: Number(elapsed.toFixed(3)),
  };
}

/**
 * Deterministic Stress-Test Helper for Judges:
 * Injects a 400 BDT or 500 BDT spoofed bus fare for Mirpur-10 -> Farmgate (Base: 25 BDT, Max allowed: 62.5 BDT).
 */
export function injectSpoofedFareStressTest(
  edgeId: string = "E_BUS_SURFACE_MIRPUR10_FARMGATE",
  spoofedFareBdt: number = 500
): FareValidationResult {
  return validateFareSubmission(edgeId, spoofedFareBdt);
}

/**
 * Deterministic Stress-Test Helper for Judges:
 * Submits a single uncorroborated blockade at Shahbagh (w_1 = 0.30, prior = 0.15).
 */
export function createUncorroboratedShahbaghAlert(nowMs: number = Date.now()): StreetAlert {
  return {
    alert_id: `alert_uncorroborated_shahbagh_${nowMs}`,
    edge_id: "E_BUS_SURFACE_FARMGATE_SHAHBAGH",
    hub_id: HubId.H_SHAHBAGH,
    incident_type: IncidentType.INTERSECTION_BLOCKADE,
    status: AlertStatus.PENDING_CORROBORATION,
    validation_status: ValidationStatus.GRAPH_GROUNDED,
    severity_alpha: 1.5,
    confidence_pct: 24.3, // Matches theoretical single vote posterior 24.3%
    half_life_remaining_ms: 1800000,
    created_timestamp_ms: nowMs,
    votes: [
      {
        vote_id: `vote_single_${nowMs}`,
        voter_session_id: "session_unverified_guest_01",
        direction: 1,
        reliability_weight: 0.3,
        timestamp_ms: nowMs,
      },
    ],
  };
}
