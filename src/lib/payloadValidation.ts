// ==============================================================================
// src/lib/payloadValidation.ts — shared validators for client-supplied payloads
// Used by API routes that accept street alerts (chat context, Supabase sync).
// ==============================================================================

import {
  AlertStatus,
  CrowdVote,
  HubId,
  IncidentType,
  StreetAlert,
  ValidationStatus,
} from "../contracts/schema";

export const MAX_ALERTS = 100;
export const HUBS = new Set<string>(Object.values(HubId));
export const INCIDENT_TYPES = new Set<string>(Object.values(IncidentType));
export const ALERT_STATUSES = new Set<string>(Object.values(AlertStatus));
export const VALIDATION_STATUSES = new Set<string>(Object.values(ValidationStatus));

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validHub(value: unknown): value is HubId {
  return typeof value === "string" && HUBS.has(value);
}

export function sanitizeAlerts(value: unknown): StreetAlert[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ALERTS) return null;

  const alerts: StreetAlert[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) return null;
    if (
      typeof raw.alert_id !== "string" ||
      !raw.alert_id ||
      raw.alert_id.length > 160 ||
      typeof raw.edge_id !== "string" ||
      !raw.edge_id ||
      raw.edge_id.length > 120 ||
      !validHub(raw.hub_id) ||
      typeof raw.incident_type !== "string" ||
      !INCIDENT_TYPES.has(raw.incident_type) ||
      typeof raw.status !== "string" ||
      !ALERT_STATUSES.has(raw.status) ||
      typeof raw.validation_status !== "string" ||
      !VALIDATION_STATUSES.has(raw.validation_status) ||
      typeof raw.severity_alpha !== "number" ||
      !Number.isFinite(raw.severity_alpha) ||
      raw.severity_alpha < 0 ||
      raw.severity_alpha > 10 ||
      typeof raw.confidence_pct !== "number" ||
      !Number.isFinite(raw.confidence_pct) ||
      raw.confidence_pct < 0 ||
      raw.confidence_pct > 100 ||
      typeof raw.half_life_remaining_ms !== "number" ||
      !Number.isFinite(raw.half_life_remaining_ms) ||
      raw.half_life_remaining_ms < 0 ||
      typeof raw.created_timestamp_ms !== "number" ||
      !Number.isFinite(raw.created_timestamp_ms) ||
      !Array.isArray(raw.votes) ||
      raw.votes.length > 256
    ) {
      return null;
    }

    const votes: CrowdVote[] = [];
    for (const rawVote of raw.votes) {
      if (
        !isRecord(rawVote) ||
        (rawVote.direction !== 1 && rawVote.direction !== -1) ||
        typeof rawVote.reliability_weight !== "number" ||
        !Number.isFinite(rawVote.reliability_weight) ||
        rawVote.reliability_weight < 0 ||
        rawVote.reliability_weight > 1 ||
        typeof rawVote.timestamp_ms !== "number" ||
        !Number.isFinite(rawVote.timestamp_ms)
      ) {
        return null;
      }
      votes.push({
        vote_id: typeof rawVote.vote_id === "string" ? rawVote.vote_id.slice(0, 160) : `vote_${votes.length}`,
        voter_session_id:
          typeof rawVote.voter_session_id === "string"
            ? rawVote.voter_session_id.slice(0, 160)
            : "api_supplied",
        direction: rawVote.direction,
        reliability_weight: rawVote.reliability_weight,
        timestamp_ms: rawVote.timestamp_ms,
      });
    }

    alerts.push({
      alert_id: raw.alert_id,
      edge_id: raw.edge_id,
      hub_id: raw.hub_id,
      incident_type: raw.incident_type as IncidentType,
      status: raw.status as AlertStatus,
      validation_status: raw.validation_status as ValidationStatus,
      severity_alpha: raw.severity_alpha,
      confidence_pct: raw.confidence_pct,
      half_life_remaining_ms: raw.half_life_remaining_ms,
      created_timestamp_ms: raw.created_timestamp_ms,
      votes,
    });
  }
  return alerts;
}
