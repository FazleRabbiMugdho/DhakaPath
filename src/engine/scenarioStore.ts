// ==============================================================================
// src/engine/scenarioStore.ts — PURE FUNCTIONAL SCENARIO PROJECTION ENGINE
// WAVE 1 — TRACK 1 (Dev 1: Systems & Graph Architect)
// Strictly Functional Projection G(t) = f(G_0, S_k, delta_t_sim)
// Zero in-place mutation of CANONICAL_GRAPH_G0: Idempotent & Drift-Free
// ==============================================================================

import {
  AlertStatus,
  HubId,
  IncidentType,
  ScenarioPreset,
  StreetAlert,
  ValidationStatus,
} from "../contracts/schema";

export interface ProjectedScenarioState {
  readonly action_id: string;
  readonly preset: ScenarioPreset;
  readonly sim_offset_ms: number;
  readonly surface_velocity_kmh: number;
  readonly surge_multiplier: number;
  readonly active_alerts: ReadonlyArray<StreetAlert>;
  readonly is_demo_telemetry: true;
}

export interface ScenarioParameters {
  readonly surface_velocity_kmh: number;
  readonly surge_multiplier: number;
}

export function getScenarioParameters(preset: ScenarioPreset): ScenarioParameters {
  switch (preset) {
    case ScenarioPreset.PEAK_CRISIS_SURGE:
      return { surface_velocity_kmh: 4.8, surge_multiplier: 1.8 };
    case ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT:
      return { surface_velocity_kmh: 8.2, surge_multiplier: 2.4 };
    case ScenarioPreset.NORMAL_BASELINE:
    default:
      return { surface_velocity_kmh: 14.5, surge_multiplier: 1.0 };
  }
}

/**
 * Only waterlogging and intersection blockades sever a corridor. A gridlock
 * slows traffic but must never make a hub unreachable.
 */
export function getSeveredHubIds(alerts: ReadonlyArray<StreetAlert>): HubId[] {
  const hubs = new Set<HubId>();
  for (const alert of alerts) {
    if (alert.status === AlertStatus.EXPIRED || alert.status === AlertStatus.RESOLVED) continue;
    if (alert.confidence_pct < 85) continue;
    if (
      alert.incident_type === IncidentType.WATERLOGGING ||
      alert.incident_type === IncidentType.INTERSECTION_BLOCKADE
    ) {
      hubs.add(alert.hub_id);
    }
  }
  return Array.from(hubs);
}

/**
 * Baseline Street Alerts for Peak Crisis Surge
 */
const SEED_CRISIS_ALERTS: ReadonlyArray<StreetAlert> = [
  {
    alert_id: "alert_farmgate_waterlogging",
    edge_id: "E_BUS_SURFACE_MIRPUR10_FARMGATE",
    hub_id: HubId.H_FARMGATE,
    incident_type: IncidentType.WATERLOGGING,
    status: AlertStatus.VERIFIED_ACTIVE,
    validation_status: ValidationStatus.GRAPH_GROUNDED,
    severity_alpha: 2.4,
    confidence_pct: 91.8, // >= 85% -> Severed edge
    half_life_remaining_ms: 1800000,
    created_timestamp_ms: 1773715200000,
    votes: [
      {
        vote_id: "v1",
        voter_session_id: "s_demo1",
        direction: 1,
        reliability_weight: 0.85,
        timestamp_ms: 1773715200000,
      },
    ],
  },
  {
    alert_id: "alert_malibagh_gridlock",
    edge_id: "E_BUS_MALIBAGH_MOTIJHEEL",
    hub_id: HubId.H_MALIBAGH,
    incident_type: IncidentType.SEVERE_GRIDLOCK,
    status: AlertStatus.VERIFIED_ACTIVE,
    validation_status: ValidationStatus.GRAPH_GROUNDED,
    severity_alpha: 1.9,
    confidence_pct: 89.2, // >= 85% -> Severed edge
    half_life_remaining_ms: 1800000,
    created_timestamp_ms: 1773715260000,
    votes: [
      {
        vote_id: "v2",
        voter_session_id: "s_demo2",
        direction: 1,
        reliability_weight: 0.78,
        timestamp_ms: 1773715260000,
      },
    ],
  },
];

/**
 * Evaluates 30-minute exponential decay on an alert's confidence.
 * Half-life lambda = ln(2) / 30 min ~= 0.0231 min^-1
 */
function applyDecay(baseConfidence: number, offsetMs: number): number {
  if (offsetMs <= 0) return baseConfidence;
  const deltaMinutes = offsetMs / 60000;
  const lambda = Math.LN2 / 30.0;
  const decayed = baseConfidence * Math.exp(-lambda * deltaMinutes);
  return Math.max(5.0, Math.min(100.0, +decayed.toFixed(1)));
}

/**
 * Pure functional scenario projection.
 * Guaranteed never to mutate CANONICAL_GRAPH_G0.
 */
export function projectScenario(
  preset: ScenarioPreset,
  simOffsetMs: number = 0
): ProjectedScenarioState {
  const actionId = `SCENARIO_${preset}_${simOffsetMs}`;

  // Pure functional mapping based on preset. Shared with the router, the
  // shadow baseline and the Track 4 telemetry endpoint.
  const params = getScenarioParameters(preset);
  const surfaceVelocityKmh = params.surface_velocity_kmh;
  const surgeMultiplier = params.surge_multiplier;
  let activeAlerts: StreetAlert[] = [];

  switch (preset) {
    case ScenarioPreset.PEAK_CRISIS_SURGE: {
      // Apply live time-machine decay to seed crisis alerts
      activeAlerts = SEED_CRISIS_ALERTS.map((alert) => {
        const decayedConfidence = applyDecay(alert.confidence_pct, simOffsetMs);
        const remainingHalfLife = Math.max(0, 1800000 - simOffsetMs);

        let status = alert.status;
        if (decayedConfidence < 25.0) {
          status = AlertStatus.EXPIRED;
        } else if (decayedConfidence < 85.0) {
          status = AlertStatus.PENDING_CORROBORATION;
        } else {
          status = AlertStatus.VERIFIED_ACTIVE;
        }

        return {
          ...alert,
          confidence_pct: decayedConfidence,
          half_life_remaining_ms: remainingHalfLife,
          status,
        };
      });
      break;
    }

    case ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT: {
      // Stale alert aged by 90 minutes
      const decayedConfidence = applyDecay(91.8, 90 * 60000);
      activeAlerts = [
        {
          ...SEED_CRISIS_ALERTS[0],
          alert_id: "alert_adversarial_stale",
          confidence_pct: decayedConfidence, // ~11.5% -> EXPIRED
          status: AlertStatus.EXPIRED,
          half_life_remaining_ms: 0,
        },
      ];
      break;
    }

    case ScenarioPreset.NORMAL_BASELINE:
    default: {
      activeAlerts = [];
      break;
    }
  }

  return {
    action_id: actionId,
    preset,
    sim_offset_ms: simOffsetMs,
    surface_velocity_kmh: surfaceVelocityKmh,
    surge_multiplier: surgeMultiplier,
    active_alerts: activeAlerts,
    is_demo_telemetry: true,
  };
}
