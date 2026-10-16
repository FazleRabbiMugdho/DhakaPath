// ==============================================================================
// src/features/feature-3-trust-cms/bayesianTruth.ts
// WAVE 1 — TRACK 2: TIER-2 RECURSIVE BAYESIAN TRUTH DISCOVERY WITH EXPONENTIAL DECAY
// Mathematical 30-Minute Half-Life Decay Kernel (λ = ln(2) / 30 ≈ 0.0231 min^-1)
// ==============================================================================

import {
  CrowdVote,
  StreetAlert,
  AlertStatus,
  ValidationStatus,
  AuditInterceptionEvent,
} from "../../contracts/schema";
import { EPSILON } from "../../lib/utils";

// 30-minute exponential half-life decay parameter
export const LAMBDA_PER_MIN: number = Math.LN2 / 30.0; // ≈ 0.0231049 min^-1
export const DEFAULT_OFF_PEAK_PRIOR = 0.15;
export const DEFAULT_PEAK_PRIOR = 0.45;
export const TAU_EXPIRE = 25.0; // Below 25% posterior: alert expires
export const TAU_BLOCKADE = 85.0; // Above 85% posterior: severe blockade / edge severed

/**
 * Computes posterior probability R_e(t) using recursive Bayesian log-odds
 * with an exponential spatio-temporal decay kernel.
 *
 * L_e(t) = ln(prior / (1 - prior)) + Sum_{k=1..N} v_k * w_k * exp(-λ * max(0, t - t_k))
 * R_e(t) = 1 / (1 + exp(-clamp(L_e(t), -20, 20)))
 *
 * @param prior Baseline incident prior probability S_prior in (0, 1)
 * @param votes Array of crowd votes with direction (+1 / -1), reliability weight w_k in [0.1, 1.0], and timestamp
 * @param nowMs Current simulated or real timestamp in ms
 * @returns Posterior confidence probability in [0.0, 1.0]
 */
export function computePosteriorConfidence(
  prior: number,
  votes: ReadonlyArray<Pick<CrowdVote, "direction" | "reliability_weight" | "timestamp_ms">>,
  nowMs: number
): number {
  const safePrior = Math.min(1 - EPSILON, Math.max(EPSILON, prior));
  let logOdds = Math.log((safePrior + EPSILON) / (1 - safePrior + EPSILON));

  for (const v of votes) {
    const deltaMin = Math.max(0, (nowMs - v.timestamp_ms) / 60000);
    const decayedWeight = v.direction * v.reliability_weight * Math.exp(-LAMBDA_PER_MIN * deltaMin);
    logOdds += decayedWeight;
  }

  const clampedLogOdds = Math.min(20, Math.max(-20, logOdds));
  return 1 / (1 + Math.exp(-clampedLogOdds));
}

/**
 * Computes the remaining time before the alert reaches its half-life decay threshold in milliseconds.
 */
export function computeHalfLifeRemainingMs(
  createdTimestampMs: number,
  nowMs: number,
  totalHalfLifeMs: number = 30 * 60 * 1000
): number {
  const elapsedMs = Math.max(0, nowMs - createdTimestampMs);
  return Math.max(0, totalHalfLifeMs - elapsedMs);
}

/**
 * Pure function: Evaluates decay and updates status of a StreetAlert for a given timestamp.
 */
export function evaluateDecayedAlert(
  alert: StreetAlert,
  nowMs: number,
  prior: number = DEFAULT_OFF_PEAK_PRIOR
): StreetAlert {
  const posterior = computePosteriorConfidence(prior, alert.votes, nowMs);
  const confidencePct = Math.round(posterior * 1000) / 10; // 1 decimal place, e.g. 91.8

  const halfLifeRemainingMs = computeHalfLifeRemainingMs(alert.created_timestamp_ms, nowMs);

  let status: AlertStatus;
  if (confidencePct < TAU_EXPIRE) {
    status = AlertStatus.EXPIRED;
  } else if (confidencePct >= TAU_BLOCKADE) {
    status = AlertStatus.VERIFIED_ACTIVE;
  } else {
    status = AlertStatus.PENDING_CORROBORATION;
  }

  return {
    ...alert,
    confidence_pct: confidencePct,
    status,
    half_life_remaining_ms: halfLifeRemainingMs,
  };
}

/**
 * Adds a user vote to an active alert and returns the updated StreetAlert along with any audit events.
 */
export function addVoteToAlert(
  alert: StreetAlert,
  voterSessionId: string,
  direction: 1 | -1,
  reliabilityWeight: number,
  nowMs: number = Date.now(),
  prior: number = DEFAULT_OFF_PEAK_PRIOR
): {
  readonly updatedAlert: StreetAlert;
  readonly auditEvent?: AuditInterceptionEvent;
  readonly posteriorConfidencePct: number;
} {
  const newVote: CrowdVote = {
    vote_id: `vote_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    voter_session_id: voterSessionId,
    direction,
    reliability_weight: Math.min(1.0, Math.max(0.1, reliabilityWeight)),
    timestamp_ms: nowMs,
  };

  const updatedVotes = [...alert.votes, newVote];
  const posterior = computePosteriorConfidence(prior, updatedVotes, nowMs);
  const confidencePct = Math.round(posterior * 1000) / 10;

  let newStatus: AlertStatus;
  if (confidencePct < TAU_EXPIRE) {
    newStatus = AlertStatus.EXPIRED;
  } else if (confidencePct >= TAU_BLOCKADE) {
    newStatus = AlertStatus.VERIFIED_ACTIVE;
  } else {
    newStatus = AlertStatus.PENDING_CORROBORATION;
  }

  const updatedAlert: StreetAlert = {
    ...alert,
    votes: updatedVotes,
    confidence_pct: confidencePct,
    status: newStatus,
    half_life_remaining_ms: computeHalfLifeRemainingMs(alert.created_timestamp_ms, nowMs),
  };

  let auditEvent: AuditInterceptionEvent | undefined;
  if (alert.status !== newStatus) {
    auditEvent = {
      event_id: `audit_status_transition_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp_ms: nowMs,
      status: ValidationStatus.GRAPH_GROUNDED,
      rejected_payload_summary: `Alert on ${alert.hub_id} transitioned ${alert.status} -> ${newStatus} (R_e: ${confidencePct}%)`,
      execution_time_ms: 0.08,
    };
  }

  return {
    updatedAlert,
    auditEvent,
    posteriorConfidencePct: confidencePct,
  };
}
