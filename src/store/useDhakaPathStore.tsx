"use client";

// ==============================================================================
// src/store/useDhakaPathStore.tsx — GLOBAL REACTIVE STATE STORE (WAVE 0)
// Manages synchronized multi-zone state across the 4 Command Center Zones
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  HubId,
  ScenarioPreset,
  ActionLockState,
  StreetAlert,
  AlertStatus,
  ParetoRouteOption,
  CommuterQuery,
  AuditInterceptionEvent,
  ValidationStatus,
} from "../contracts/schema";
import { TransitAdapter } from "../contracts/adapter";
import mockData from "../contracts/mock_data.json";

interface DhakaPathStoreState {
  activePreset: ScenarioPreset;
  simOffsetMs: number;
  scenarioLockState: ActionLockState;
  surfaceVelocityKmh: number;
  surgeMultiplier: number;
  engineRecomputeLatencyMs: number;
  activeQuery: CommuterQuery;
  paretoRoutes: ReadonlyArray<ParetoRouteOption>;
  selectedRouteId: string;
  selectedRoute: ParetoRouteOption | null;
  activeAlerts: ReadonlyArray<StreetAlert>;
  interceptionLogs: ReadonlyArray<AuditInterceptionEvent>;
  isDemoTelemetry: true;
  poolMemberCounts: Record<string, number>;
  // Action Handlers
  setScenarioPreset: (preset: ScenarioPreset) => Promise<void>;
  setSimOffsetMs: (offsetMs: number) => void;
  updateCommuterQuery: (updates: Partial<CommuterQuery>) => void;
  selectRoute: (routeId: string) => void;
  submitCommuterSearch: (rawQuery?: string) => Promise<void>;
  corroborateAlert: (alertId: string, direction: 1 | -1) => void;
  joinRideSharePool: (edgeId: string) => Promise<void>;
  addInterceptionLog: (event: Omit<AuditInterceptionEvent, "event_id" | "timestamp_ms">) => void;
  resetToCanonicalG0: () => void;
}

const defaultQuery: CommuterQuery = {
  action_id: "QUERY_INIT_DEFAULT",
  raw_query_text: "Mirpur 10 theke Motijheel jabo, student id ache, 55 BDT, Farmgate avoid korbo",
  origin_hub_id: HubId.H_MIRPUR10,
  dest_hub_id: HubId.H_MOTIJHEEL,
  is_student: true,
  max_budget_bdt: 55,
  avoid_hub_ids: [HubId.H_FARMGATE],
  timestamp_ms: Date.now(),
};

const DhakaPathContext = createContext<DhakaPathStoreState | null>(null);

export function DhakaPathProvider({ children }: { children: React.ReactNode }) {
  const [activePreset, setActivePresetState] = useState<ScenarioPreset>(ScenarioPreset.NORMAL_BASELINE);
  const [simOffsetMs, setSimOffsetMs] = useState<number>(0);
  const [scenarioLockState, setScenarioLockState] = useState<ActionLockState>(ActionLockState.IDLE);
  const [surfaceVelocityKmh, setSurfaceVelocityKmh] = useState<number>(14.5);
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.0);
  const [engineRecomputeLatencyMs, setEngineRecomputeLatencyMs] = useState<number>(0.78);
  const [activeQuery, setActiveQuery] = useState<CommuterQuery>(defaultQuery);
  const [paretoRoutes, setParetoRoutes] = useState<ReadonlyArray<ParetoRouteOption>>(
    (mockData.sampleRoutes ?? []) as unknown as ReadonlyArray<ParetoRouteOption>
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route_optimal_mirpur_motijheel_pstar");
  const [activeAlerts, setActiveAlerts] = useState<ReadonlyArray<StreetAlert>>([]);
  const [interceptionLogs, setInterceptionLogs] = useState<ReadonlyArray<AuditInterceptionEvent>>([
    {
      event_id: "audit_init_1",
      timestamp_ms: Date.now() - 120000,
      status: ValidationStatus.GRAPH_GROUNDED,
      rejected_payload_summary: "Mirpur-10 -> Motijheel (3 legs verified in G_0)",
      execution_time_ms: 0.12,
    },
  ]);
  const [poolMemberCounts, setPoolMemberCounts] = useState<Record<string, number>>({
    E_RICK_MOTIJHEEL_LASTMILE: 2,
    E_RICK_MIRPUR10_FEEDER: 3,
  });

  // Re-fetch alerts when scenario preset or time scrubber changes
  const refreshAlerts = useCallback(async (preset: ScenarioPreset, offset: number) => {
    const alerts = await TransitAdapter.getActiveAlerts(preset, offset);
    setActiveAlerts(alerts);
  }, []);

  // Update scenario preset with 150ms debounce and pure functional projection
  const setScenarioPreset = useCallback(
    async (preset: ScenarioPreset) => {
      setScenarioLockState(ActionLockState.PROCESSING);
      setActivePresetState(preset);

      const scenario = mockData.scenarios[preset] || mockData.scenarios.NORMAL_BASELINE;
      setSurfaceVelocityKmh(scenario.surface_velocity_kmh);
      setSurgeMultiplier(scenario.surge_multiplier);

      const startTime = performance.now();
      await refreshAlerts(preset, simOffsetMs);

      // Re-plan route under new scenario
      const routes = await TransitAdapter.planMultiModalRoute(activeQuery, preset);
      setParetoRoutes(routes);
      if (routes.length > 0 && !routes.some((r) => r.route_id === selectedRouteId)) {
        setSelectedRouteId(routes[0].route_id);
      }
      const endTime = performance.now();
      setEngineRecomputeLatencyMs(Math.max(0.2, Number((endTime - startTime).toFixed(2))));

      if (preset === ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT) {
        setInterceptionLogs((prev) => [
          {
            event_id: `audit_adv_${Date.now()}`,
            timestamp_ms: Date.now(),
            status: ValidationStatus.ANOMALOUS_FARE_REJECTED,
            rejected_payload_summary: "Mirpur-10 -> Farmgate: 500 BDT (Max Allowed: 62.5 BDT)",
            execution_time_ms: 0.08,
          },
          {
            event_id: `audit_grounding_${Date.now() + 1}`,
            timestamp_ms: Date.now(),
            status: ValidationStatus.GROUNDING_INTERCEPTED,
            rejected_payload_summary: "Edge H_BADDA -> H_DHANMONDI (FERRY) Not in G_0",
            execution_time_ms: 0.14,
          },
          ...prev,
        ]);
      }

      setTimeout(() => {
        setScenarioLockState(ActionLockState.RESOLVED);
      }, 150);
    },
    [simOffsetMs, activeQuery, refreshAlerts, selectedRouteId]
  );

  const updateCommuterQuery = useCallback((updates: Partial<CommuterQuery>) => {
    setActiveQuery((prev) => ({
      ...prev,
      ...updates,
      action_id: `QUERY_${Date.now()}`,
      timestamp_ms: Date.now(),
    }));
  }, []);

  const selectRoute = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
  }, []);

  const submitCommuterSearch = useCallback(
    async (rawQuery?: string) => {
      const q: CommuterQuery = {
        ...activeQuery,
        raw_query_text: rawQuery || activeQuery.raw_query_text,
        action_id: `SEARCH_${Date.now()}`,
        timestamp_ms: Date.now(),
      };
      setActiveQuery(q);

      const startTime = performance.now();
      const routes = await TransitAdapter.planMultiModalRoute(q, activePreset);
      setParetoRoutes(routes);
      if (routes.length > 0) {
        setSelectedRouteId(routes[0].route_id);
      }
      const endTime = performance.now();
      setEngineRecomputeLatencyMs(Math.max(0.3, Number((endTime - startTime).toFixed(2))));
    },
    [activeQuery, activePreset]
  );

  const corroborateAlert = useCallback((alertId: string, direction: 1 | -1) => {
    setActiveAlerts((prev) =>
      prev.map((alert) => {
        if (alert.alert_id !== alertId) return alert;
        const newConfidence = Math.min(
          99.9,
          Math.max(5.0, alert.confidence_pct + direction * 12.5)
        );
        return {
          ...alert,
          confidence_pct: Number(newConfidence.toFixed(1)),
          status: newConfidence < 25.0 ? AlertStatus.EXPIRED : alert.status,
        };
      })
    );
  }, []);

  const joinRideSharePool = useCallback(
    async (edgeId: string) => {
      const currentCount = poolMemberCounts[edgeId] || 1;
      const nextCount = Math.min(4, currentCount + 1);
      setPoolMemberCounts((prev) => ({ ...prev, [edgeId]: nextCount }));

      await TransitAdapter.joinHubRideSharePool(`POOL_JOIN_${Date.now()}`, edgeId, "session_current_user");

      // Update active routes to reflect pool split
      setParetoRoutes((prev) =>
        prev.map((route) => ({
          ...route,
          legs: route.legs.map((leg) => {
            if (leg.edge_id !== edgeId) return leg;
            const updatedEffectiveFare = Math.ceil((leg.regular_fare_bdt * leg.surge_multiplier) / nextCount);
            return {
              ...leg,
              pool_size_count: nextCount,
              effective_fare_bdt: updatedEffectiveFare,
            };
          }),
        }))
      );
    },
    [poolMemberCounts]
  );

  const addInterceptionLog = useCallback(
    (event: Omit<AuditInterceptionEvent, "event_id" | "timestamp_ms">) => {
      setInterceptionLogs((prev) => [
        {
          ...event,
          event_id: `audit_${Date.now()}`,
          timestamp_ms: Date.now(),
        },
        ...prev,
      ]);
    },
    []
  );

  const resetToCanonicalG0 = useCallback(() => {
    setScenarioPreset(ScenarioPreset.NORMAL_BASELINE);
    setSimOffsetMs(0);
    setActiveQuery(defaultQuery);
    setSelectedRouteId("route_optimal_mirpur_motijheel_pstar");
  }, [setScenarioPreset]);

  // Initial alert load
  useEffect(() => {
    refreshAlerts(ScenarioPreset.NORMAL_BASELINE, 0);
  }, [refreshAlerts]);

  const selectedRoute = useMemo(() => {
    return paretoRoutes.find((r) => r.route_id === selectedRouteId) || paretoRoutes[0] || null;
  }, [paretoRoutes, selectedRouteId]);

  const value: DhakaPathStoreState = useMemo(
    () => ({
      activePreset,
      simOffsetMs,
      scenarioLockState,
      surfaceVelocityKmh,
      surgeMultiplier,
      engineRecomputeLatencyMs,
      activeQuery,
      paretoRoutes,
      selectedRouteId,
      selectedRoute,
      activeAlerts,
      interceptionLogs,
      isDemoTelemetry: true,
      poolMemberCounts,
      setScenarioPreset,
      setSimOffsetMs,
      updateCommuterQuery,
      selectRoute,
      submitCommuterSearch,
      corroborateAlert,
      joinRideSharePool,
      addInterceptionLog,
      resetToCanonicalG0,
    }),
    [
      activePreset,
      simOffsetMs,
      scenarioLockState,
      surfaceVelocityKmh,
      surgeMultiplier,
      engineRecomputeLatencyMs,
      activeQuery,
      paretoRoutes,
      selectedRouteId,
      selectedRoute,
      activeAlerts,
      interceptionLogs,
      poolMemberCounts,
      setScenarioPreset,
      updateCommuterQuery,
      selectRoute,
      submitCommuterSearch,
      corroborateAlert,
      joinRideSharePool,
      addInterceptionLog,
      resetToCanonicalG0,
    ]
  );

  return <DhakaPathContext.Provider value={value}>{children}</DhakaPathContext.Provider>;
}

export function useDhakaPathStore(): DhakaPathStoreState {
  const context = useContext(DhakaPathContext);
  if (!context) {
    throw new Error("useDhakaPathStore must be used within a DhakaPathProvider");
  }
  return context;
}
