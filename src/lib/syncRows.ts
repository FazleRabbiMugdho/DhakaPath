// ==============================================================================
// src/lib/syncRows.ts — rows a browser may write through /api/sync
// A browser runs its own simulated demo, so what it sends is that session's
// report, not shared truth. Rows are rebuilt from validated fields only, keyed
// under the sender's session so they never overwrite another sender's or the
// seeded rows, and alert status is recomputed instead of trusted.
// ==============================================================================

import { createHash } from "crypto";
import { AlertStatus, CrowdVote } from "../contracts/schema";
import { DEFAULT_PEAK_PRIOR, evaluateDecayedAlert } from "../features/feature-3-trust-cms/bayesianTruth";
import { sanitizeAlerts, VALIDATION_STATUSES } from "./payloadValidation";

export type SyncTable = "street_alerts" | "interception_logs";

export const SYNC_PRIMARY_KEYS: Record<SyncTable, string> = {
  street_alerts: "alert_id",
  interception_logs: "event_id",
};

/** Short, non-reversible tag for a session id; stored rows never carry the id itself. */
export function ownerTag(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex").slice(0, 16);
}

/** Rebuilds the row from validated fields only; returns null when invalid. */
export function buildSyncRow(table: SyncTable, raw: Record<string, unknown>, owner: string): Record<string, unknown> | null {
  if (table === "street_alerts") {
    const alert = sanitizeAlerts([raw])?.[0];
    if (!alert) return null;
    // One session is one reporter and cannot corroborate itself: its votes
    // count as a single vote (its latest). With at most one vote of weight <= 1
    // the posterior stays below the blockade threshold, so a synced alert can
    // never be stored as VERIFIED_ACTIVE.
    const latest = alert.votes.reduce<CrowdVote | null>(
      (best, vote) => (!best || vote.timestamp_ms > best.timestamp_ms ? vote : best),
      null
    );
    const votes: CrowdVote[] = latest
      ? [{ ...latest, vote_id: `${owner}:vote`, voter_session_id: owner }]
      : [];
    const evaluated = evaluateDecayedAlert(
      { ...alert, votes },
      latest?.timestamp_ms ?? alert.created_timestamp_ms,
      DEFAULT_PEAK_PRIOR
    );
    // Closing one's own report (resolved/expired) is a downgrade and is kept.
    const status =
      alert.status === AlertStatus.RESOLVED || alert.status === AlertStatus.EXPIRED
        ? alert.status
        : evaluated.status;
    return {
      ...evaluated,
      alert_id: `${owner}:${alert.alert_id}`,
      status,
      half_life_remaining_ms: Math.round(evaluated.half_life_remaining_ms),
    };
  }

  const { event_id, timestamp_ms, status, rejected_payload_summary, execution_time_ms } = raw;
  if (
    typeof event_id !== "string" || !event_id || event_id.length > 160 ||
    typeof timestamp_ms !== "number" || !Number.isFinite(timestamp_ms) ||
    typeof status !== "string" || !VALIDATION_STATUSES.has(status) ||
    typeof rejected_payload_summary !== "string" ||
    typeof execution_time_ms !== "number" || !Number.isFinite(execution_time_ms) || execution_time_ms < 0
  ) return null;
  return {
    event_id: `${owner}:${event_id}`,
    timestamp_ms: Math.round(timestamp_ms),
    status,
    rejected_payload_summary: rejected_payload_summary.slice(0, 1000),
    execution_time_ms,
  };
}
