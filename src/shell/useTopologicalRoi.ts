"use client";

// ==============================================================================
// src/shell/useTopologicalRoi.ts — ZONE 2 ISOLATED HOOK (Map + ROI Ledger)
// Derives map render state (optimal P*, shadow P_shadow, severed hubs,
// walk-bridge) and the Counterfactual ROI metrics deterministically from the
// reactive store and the Track 1 counterfactual engine. The map and ledger use
// the same graph-grounded shadow path and fare calculations as routing.
// ==============================================================================

import { useCallback, useMemo, useState } from "react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import {
  HubId,
  StreetAlert,
  IncidentType,
  ParetoRouteOption,
  CounterfactualRoiMetrics,
  TransportMode,
} from "@/contracts/schema";
import { computeCounterfactualRoi, computeNaiveSurfacePath } from "@/engine/shadowBaseline";

const SEVER_CONFIDENCE_PCT = 85.0;

export interface TopologicalRoiState {
  optimalRoute: ParetoRouteOption | null;
  optimalHubPath: ReadonlyArray<HubId>;
  shadowHubPath: ReadonlyArray<HubId>;
  severedHubIds: ReadonlyArray<HubId>;
  activeAlerts: ReadonlyArray<StreetAlert>;
  walkBridgeActive: boolean;
  osmTilesOnline: boolean;
  roi: CounterfactualRoiMetrics;
  toggleOsmTiles: () => void;
  setOsmTiles: (online: boolean) => void;
}

function routeHubPath(route: ParetoRouteOption | null): ReadonlyArray<HubId> {
  if (!route || route.legs.length === 0) return [];
  const hubs: HubId[] = [route.legs[0].origin_hub_id];
  for (const leg of route.legs) {
    if (leg.dest_hub_id !== hubs[hubs.length - 1]) hubs.push(leg.dest_hub_id);
  }
  return hubs;
}

function severedHubs(alerts: ReadonlyArray<StreetAlert>): ReadonlyArray<HubId> {
  const out: HubId[] = [];
  for (const a of alerts) {
    const severing =
      a.confidence_pct >= SEVER_CONFIDENCE_PCT &&
      (a.incident_type === IncidentType.WATERLOGGING ||
        a.incident_type === IncidentType.INTERSECTION_BLOCKADE ||
        a.incident_type === IncidentType.SEVERE_GRIDLOCK);
    if (severing && !out.includes(a.hub_id)) out.push(a.hub_id);
  }
  return out;
}

export function useTopologicalRoi(): TopologicalRoiState {
  const store = useDhakaPathStore();
  const [osmTilesOnline, setOsmTilesOnline] = useState<boolean>(false);

  const toggleOsmTiles = useCallback(() => setOsmTilesOnline((v) => !v), []);
  const setOsmTiles = useCallback((online: boolean) => setOsmTilesOnline(online), []);

  const severed = useMemo(() => severedHubs(store.activeAlerts), [store.activeAlerts]);
  const optimalHubPath = useMemo(() => routeHubPath(store.selectedRoute), [store.selectedRoute]);
  const shadowHubPath = useMemo(() => {
    if (!store.selectedRoute) return [];
    const edges = computeNaiveSurfacePath(store.activeQuery.origin_hub_id, store.activeQuery.dest_hub_id);
    return edges.length > 0
      ? [store.activeQuery.origin_hub_id, ...edges.map((edge) => edge.dest_hub_id)]
      : [];
  }, [store.activeQuery.origin_hub_id, store.activeQuery.dest_hub_id, store.selectedRoute]);

  // Walk-bridge fires when a severed hub sits on the optimal corridor and the
  // route itself leans on a WALK leg to bypass it.
  const walkBridgeActive = useMemo(() => {
    const touchesSevered = optimalHubPath.some((h) => severed.includes(h));
    const hasWalkLeg = Boolean(store.selectedRoute?.legs.some((l) => l.mode === TransportMode.WALK));
    return touchesSevered && hasWalkLeg;
  }, [optimalHubPath, severed, store.selectedRoute]);

  const roi = useMemo(
    () => computeCounterfactualRoi(store.selectedRoute, store.activeQuery, store.activePreset, store.activeAlerts),
    [store.selectedRoute, store.activeQuery, store.activePreset, store.activeAlerts]
  );

  return useMemo(
    () => ({
      optimalRoute: store.selectedRoute,
      optimalHubPath,
      shadowHubPath,
      severedHubIds: severed,
      activeAlerts: store.activeAlerts,
      walkBridgeActive,
      osmTilesOnline,
      roi,
      toggleOsmTiles,
      setOsmTiles,
    }),
    [
      store.selectedRoute,
      store.activeAlerts,
      optimalHubPath,
      shadowHubPath,
      severed,
      walkBridgeActive,
      osmTilesOnline,
      roi,
      toggleOsmTiles,
      setOsmTiles,
    ]
  );
}
