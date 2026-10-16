"use client";

// ==============================================================================
// src/features/feature-3-trust-cms/useTrustShieldCms.ts
// WAVE 1 — TRACK 2: ISOLATED STATE HOOK FOR ZONE 3 TRUST SHIELD & CMS
// Manages Bayesian alert feed, Tier-1 sanity logs, and Signboard OCR Ingestor
// ==============================================================================

import { useState, useCallback, useEffect } from "react";
import {
  StreetAlert,
  AlertStatus,
  ValidationStatus,
  AuditInterceptionEvent,
  ActionLockState,
  TransitEdge,
  HubId,
  IncidentType,
  TransportMode,
  ScenarioPreset,
} from "../../contracts/schema";
import {
  validateFareSubmission,
  validateAlertResolution,
  createUncorroboratedShahbaghAlert,
} from "./sanityFilter";
import {
  evaluateDecayedAlert,
  addVoteToAlert,
  DEFAULT_OFF_PEAK_PRIOR,
  DEFAULT_PEAK_PRIOR,
} from "./bayesianTruth";
import { mutateRideSharePool } from "./rideSharePool";
import { registerAlertDelegate, registerPoolDelegate } from "../../contracts/adapter";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

// Canonical seed alerts for initial state
const INITIAL_ALERTS: ReadonlyArray<StreetAlert> = [
  {
    alert_id: "alert_farmgate_waterlogging",
    edge_id: "E_BUS_SURFACE_MIRPUR10_FARMGATE",
    hub_id: HubId.H_FARMGATE,
    incident_type: IncidentType.WATERLOGGING,
    status: AlertStatus.VERIFIED_ACTIVE,
    validation_status: ValidationStatus.GRAPH_GROUNDED,
    severity_alpha: 2.4,
    confidence_pct: 91.8,
    half_life_remaining_ms: 1800000,
    created_timestamp_ms: Date.now() - 14 * 60 * 1000, // 14 min ago
    votes: [
      {
        vote_id: "v_fg_1",
        voter_session_id: "commuter_verified_1",
        direction: 1,
        reliability_weight: 0.85,
        timestamp_ms: Date.now() - 14 * 60 * 1000,
      },
      {
        vote_id: "v_fg_2",
        voter_session_id: "commuter_verified_2",
        direction: 1,
        reliability_weight: 0.9,
        timestamp_ms: Date.now() - 10 * 60 * 1000,
      },
      {
        vote_id: "v_fg_3",
        voter_session_id: "commuter_verified_3",
        direction: 1,
        reliability_weight: 0.75,
        timestamp_ms: Date.now() - 6 * 60 * 1000,
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
    confidence_pct: 89.2,
    half_life_remaining_ms: 1800000,
    created_timestamp_ms: Date.now() - 18 * 60 * 1000,
    votes: [
      {
        vote_id: "v_mb_1",
        voter_session_id: "commuter_verified_4",
        direction: 1,
        reliability_weight: 0.88,
        timestamp_ms: Date.now() - 18 * 60 * 1000,
      },
      {
        vote_id: "v_mb_2",
        voter_session_id: "commuter_verified_5",
        direction: 1,
        reliability_weight: 0.8,
        timestamp_ms: Date.now() - 12 * 60 * 1000,
      },
    ],
  },
];

// Initial audit interception events
const INITIAL_LOGS: ReadonlyArray<AuditInterceptionEvent> = [
  {
    event_id: "audit_init_1",
    timestamp_ms: Date.now() - 180000,
    status: ValidationStatus.ANOMALOUS_FARE_REJECTED,
    rejected_payload_summary: "Mirpur-10 -> Farmgate: 500 BDT (Max Allowed: 62.5 BDT)",
    execution_time_ms: 0.08,
  },
  {
    event_id: "audit_init_2",
    timestamp_ms: Date.now() - 120000,
    status: ValidationStatus.GROUNDING_INTERCEPTED,
    rejected_payload_summary: "Edge H_BADDA -> H_DHANMONDI (UNDERGROUND_FERRY) Not in Canonical Graph G_0",
    execution_time_ms: 0.05,
  },
];

// Demo signboard OCR preset candidates
const SIGNBOARD_PRESETS: Record<
  string,
  { name: string; description: string; edges: ReadonlyArray<TransitEdge>; hasHallucination?: boolean }
> = {
  bihanga: {
    name: "Bihanga Paribahan Route Signboard",
    description: "Mirpur 10 -> Agargaon -> Mohakhali Flyover -> Motijheel (Verified BRTA Route #A-104)",
    edges: [
      {
        edge_id: "E_OCR_BIHANGA_AGARGAON_MOHAKHALI",
        origin_hub_id: HubId.H_AGARGAON,
        dest_hub_id: HubId.H_MOHAKHALI,
        mode: TransportMode.BUS,
        route_name: "Bihanga Paribahan (Flyover)",
        distance_km: 3.2,
        base_fare_bdt: 18,
        base_duration_ms: 900000,
        student_half_fare_eligible: true,
        boarding_landmark: "Agargaon Metro Gate 3",
      },
      {
        edge_id: "E_OCR_BIHANGA_MOHAKHALI_MOTIJHEEL",
        origin_hub_id: HubId.H_MOHAKHALI,
        dest_hub_id: HubId.H_MOTIJHEEL,
        mode: TransportMode.BUS,
        route_name: "Bihanga Paribahan (Flyover Direct)",
        distance_km: 6.8,
        base_fare_bdt: 28,
        base_duration_ms: 1500000,
        student_half_fare_eligible: true,
        boarding_landmark: "Mohakhali Wireless Gate Bus Stop",
      },
    ],
  },
  brta_statutory: {
    name: "BRTA Statutory Distance & Bus Fare Chart",
    description: "Official Gazette statutory fares for Mirpur, Farmgate, Shahbagh, and Motijheel corridors",
    edges: [
      {
        edge_id: "E_OCR_BRTA_MIRPUR10_FARMGATE",
        origin_hub_id: HubId.H_MIRPUR10,
        dest_hub_id: HubId.H_FARMGATE,
        mode: TransportMode.BUS,
        route_name: "BRTA Statutory Surface Bus",
        distance_km: 6.2,
        base_fare_bdt: 25,
        base_duration_ms: 1800000,
        student_half_fare_eligible: true,
        boarding_landmark: "Mirpur-10 Sony Cinema Gate",
      },
      {
        edge_id: "E_OCR_BRTA_FARMGATE_SHAHBAGH",
        origin_hub_id: HubId.H_FARMGATE,
        dest_hub_id: HubId.H_SHAHBAGH,
        mode: TransportMode.BUS,
        route_name: "BRTA Statutory Trust Bus",
        distance_km: 2.8,
        base_fare_bdt: 16,
        base_duration_ms: 1200000,
        student_half_fare_eligible: true,
        boarding_landmark: "Farmgate Ananda Cinema Footbridge",
      },
    ],
  },
};

export function useTrustShieldCms() {
  const [activeAlerts, setActiveAlerts] = useState<ReadonlyArray<StreetAlert>>(INITIAL_ALERTS);
  const [interceptionLogs, setInterceptionLogs] = useState<ReadonlyArray<AuditInterceptionEvent>>(INITIAL_LOGS);
  const [ocrSelectedPreset, setOcrSelectedPreset] = useState<string>("bihanga");
  const [ocrCandidateEdges, setOcrCandidateEdges] = useState<ReadonlyArray<TransitEdge>>([]);
  const [ocrCommittedCount, setOcrCommittedCount] = useState<number>(0);
  const [voteLockState, setVoteLockState] = useState<ActionLockState>(ActionLockState.IDLE);
  const [ocrLockState, setOcrLockState] = useState<ActionLockState>(ActionLockState.IDLE);
  const [currentSimOffsetMs, setCurrentSimOffsetMs] = useState<number>(0);
  const [currentPreset, setCurrentPreset] = useState<ScenarioPreset>(ScenarioPreset.PEAK_CRISIS_SURGE);

  // Register adapters dynamically on mount
  useEffect(() => {
    registerAlertDelegate(async (preset, simOffsetMs) => {
      // Recompute bayesian decay with offset
      const nowMs = Date.now() + simOffsetMs;
      const prior = preset === ScenarioPreset.PEAK_CRISIS_SURGE ? DEFAULT_PEAK_PRIOR : DEFAULT_OFF_PEAK_PRIOR;
      return activeAlerts.map((a) => evaluateDecayedAlert(a, nowMs, prior));
    });

    registerPoolDelegate(async (actionId, edgeId, userId) => {
      const result = mutateRideSharePool(actionId, edgeId, userId, "JOIN");
      return {
        pool_size_count: result.poolSizeCount,
        per_person_fare_bdt: result.perPersonFareBdt,
      };
    });
  }, [activeAlerts]);

  // Sync decayed alerts when simOffsetMs advances
  const applyTimeMachineDecay = useCallback(
    (offsetMs: number) => {
      setCurrentSimOffsetMs(offsetMs);
      const nowMs = Date.now() + offsetMs;
      const prior = currentPreset === ScenarioPreset.PEAK_CRISIS_SURGE ? DEFAULT_PEAK_PRIOR : DEFAULT_OFF_PEAK_PRIOR;

      setActiveAlerts((prev) =>
        prev.map((alert) => evaluateDecayedAlert(alert, nowMs, prior))
      );
    },
    [currentPreset]
  );

  // Corroborate (+1) or Resolve (-1) an alert
  const handleVoteAlert = useCallback(
    async (alertId: string, direction: 1 | -1) => {
      setVoteLockState(ActionLockState.PROCESSING);
      const targetAlert = activeAlerts.find((a) => a.alert_id === alertId);

      if (!targetAlert) {
        setVoteLockState(ActionLockState.IDLE);
        return;
      }

      const nowMs = Date.now() + currentSimOffsetMs;

      // Tier-1 Sanity check: If resolving (-1) a corroborated high-confidence blockade, validate resolution
      if (direction === -1) {
        const resolutionCheck = validateAlertResolution(targetAlert, 0.5); // standard commuter weight 0.5
        if (resolutionCheck.quarantined && resolutionCheck.event) {
          setInterceptionLogs((prev) => [resolutionCheck.event!, ...prev]);
          setVoteLockState(ActionLockState.RESOLVED);
          setTimeout(() => setVoteLockState(ActionLockState.IDLE), 1000);
          return;
        }
      }

      // Tier-2 Bayesian update
      const { updatedAlert, auditEvent } = addVoteToAlert(
        targetAlert,
        `session_${Date.now().toString(36)}`,
        direction,
        0.8,
        nowMs
      );

      setActiveAlerts((prev) => prev.map((a) => (a.alert_id === alertId ? updatedAlert : a)));

      if (auditEvent) {
        setInterceptionLogs((prev) => [auditEvent, ...prev]);
      }

      // If Supabase is configured, persist asynchronously
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from("street_alerts")
            .update({
              votes: updatedAlert.votes,
              confidence_pct: updatedAlert.confidence_pct,
              status: updatedAlert.status,
            })
            .eq("alert_id", alertId);
        } catch {
          // In-memory fallback
        }
      }

      setVoteLockState(ActionLockState.RESOLVED);
      setTimeout(() => setVoteLockState(ActionLockState.IDLE), 1000);
    },
    [activeAlerts, currentSimOffsetMs]
  );

  // Stress-Test 1: Inject 400 or 500 BDT Spoofed Fare
  const handleInjectSpoofedFare = useCallback((spoofedFare: number = 500) => {
    const result = validateFareSubmission("E_BUS_SURFACE_MIRPUR10_FARMGATE", spoofedFare);
    if (result.event) {
      setInterceptionLogs((prev) => [result.event!, ...prev]);
    }
    return result;
  }, []);

  // Stress-Test 2: Submit Single Uncorroborated Shahbagh Report
  const handleSubmitUncorroboratedReport = useCallback(() => {
    const nowMs = Date.now() + currentSimOffsetMs;
    const newAlert = createUncorroboratedShahbaghAlert(nowMs);

    setActiveAlerts((prev) => {
      const exists = prev.some((a) => a.hub_id === HubId.H_SHAHBAGH);
      if (exists) {
        return prev.map((a) => (a.hub_id === HubId.H_SHAHBAGH ? newAlert : a));
      }
      return [newAlert, ...prev];
    });

    const auditEvent: AuditInterceptionEvent = {
      event_id: `audit_uncorroborated_${Date.now()}`,
      timestamp_ms: nowMs,
      status: ValidationStatus.GRAPH_GROUNDED,
      rejected_payload_summary: `Single uncorroborated Shahbagh report received (R_e = 24.3% < 85% severance threshold -> PENDING_CORROBORATION)`,
      execution_time_ms: 0.06,
    };

    setInterceptionLogs((prev) => [auditEvent, ...prev]);
  }, [currentSimOffsetMs]);

  // Admin Override: Quarantine or Restore
  const handleOverrideDecayAndQuarantine = useCallback((alertId: string) => {
    setActiveAlerts((prev) =>
      prev.map((a) => {
        if (a.alert_id === alertId) {
          return {
            ...a,
            status: AlertStatus.RESOLVED,
            confidence_pct: 12.0,
          };
        }
        return a;
      })
    );

    const auditEvent: AuditInterceptionEvent = {
      event_id: `audit_admin_override_${Date.now()}`,
      timestamp_ms: Date.now(),
      status: ValidationStatus.GRAPH_GROUNDED,
      rejected_payload_summary: `Admin override: Alert ${alertId} marked RESOLVED, corridor cleared`,
      execution_time_ms: 0.04,
    };

    setInterceptionLogs((prev) => [auditEvent, ...prev]);
  }, []);

  // Bonus 1: Scan Signboard Preset
  const handleScanSignboard = useCallback(
    (presetKey: string = ocrSelectedPreset) => {
      setOcrLockState(ActionLockState.PROCESSING);
      const preset = SIGNBOARD_PRESETS[presetKey] || SIGNBOARD_PRESETS.bihanga;

      setTimeout(() => {
        setOcrCandidateEdges(preset.edges);
        setOcrLockState(ActionLockState.RESOLVED);
        setTimeout(() => setOcrLockState(ActionLockState.IDLE), 1000);
      }, 350);
    },
    [ocrSelectedPreset]
  );

  // Bonus 1: Commit Verified OCR Edges to Graph G_0
  const handleCommitOcrEdges = useCallback(() => {
    if (ocrCandidateEdges.length === 0) return;

    setOcrLockState(ActionLockState.PROCESSING);
    setOcrCommittedCount((prev) => prev + ocrCandidateEdges.length);

    const auditEvent: AuditInterceptionEvent = {
      event_id: `audit_ocr_commit_${Date.now()}`,
      timestamp_ms: Date.now(),
      status: ValidationStatus.GRAPH_GROUNDED,
      rejected_payload_summary: `Committed ${ocrCandidateEdges.length} verified OCR edges to Canonical Graph: ${ocrCandidateEdges.map((e) => e.route_name).join(", ")}`,
      execution_time_ms: 0.12,
    };

    setInterceptionLogs((prev) => [auditEvent, ...prev]);
    setOcrCandidateEdges([]);
    setOcrLockState(ActionLockState.RESOLVED);
    setTimeout(() => setOcrLockState(ActionLockState.IDLE), 1200);
  }, [ocrCandidateEdges]);

  // Bonus 1: Discard OCR Candidates
  const handleDiscardOcrEdges = useCallback(() => {
    setOcrCandidateEdges([]);
    const auditEvent: AuditInterceptionEvent = {
      event_id: `audit_ocr_discard_${Date.now()}`,
      timestamp_ms: Date.now(),
      status: ValidationStatus.GROUNDING_INTERCEPTED,
      rejected_payload_summary: "Discarded unverified OCR candidate edges",
      execution_time_ms: 0.05,
    };
    setInterceptionLogs((prev) => [auditEvent, ...prev]);
  }, []);

  return {
    activeAlerts,
    interceptionLogs,
    ocrSelectedPreset,
    setOcrSelectedPreset,
    ocrCandidateEdges,
    ocrCommittedCount,
    signboardPresets: SIGNBOARD_PRESETS,
    voteLockState,
    ocrLockState,
    currentSimOffsetMs,
    currentPreset,
    setCurrentPreset,
    handleVoteAlert,
    handleInjectSpoofedFare,
    handleSubmitUncorroboratedReport,
    handleOverrideDecayAndQuarantine,
    handleScanSignboard,
    handleCommitOcrEdges,
    handleDiscardOcrEdges,
    applyTimeMachineDecay,
  };
}
