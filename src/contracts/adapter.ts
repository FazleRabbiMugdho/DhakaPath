// ==============================================================================
// src/contracts/adapter.ts — UNIFIED HYBRID SERVICE BOUNDARY
// Provides deterministic mock data fallback with seamless live engine delegation
// ==============================================================================

import {
  CommuterQuery,
  ParetoRouteOption,
  ScenarioPreset,
  StreetAlert,
} from "./schema";
import mockData from "./mock_data.json";

export type LiveAlertProvider = (
  preset: ScenarioPreset,
  simOffsetMs: number
) => Promise<ReadonlyArray<StreetAlert>>;

export type LiveRouteProvider = (
  query: CommuterQuery,
  preset: ScenarioPreset
) => Promise<ReadonlyArray<ParetoRouteOption>>;

export type LivePoolProvider = (
  actionId: string,
  edgeId: string,
  userId: string
) => Promise<{ pool_size_count: number; per_person_fare_bdt: number }>;

// Service delegates registered dynamically by Wave 1 tracks
let liveAlertDelegate: LiveAlertProvider | null = null;
let liveRouteDelegate: LiveRouteProvider | null = null;
let livePoolDelegate: LivePoolProvider | null = null;

export function registerAlertDelegate(delegate: LiveAlertProvider): void {
  liveAlertDelegate = delegate;
}

export function registerRouteDelegate(delegate: LiveRouteProvider): void {
  liveRouteDelegate = delegate;
}

export function registerPoolDelegate(delegate: LivePoolProvider): void {
  livePoolDelegate = delegate;
}

export interface TransitServiceBoundary {
  getActiveAlerts(preset: ScenarioPreset, simOffsetMs: number): Promise<ReadonlyArray<StreetAlert>>;
  planMultiModalRoute(query: CommuterQuery, preset: ScenarioPreset): Promise<ReadonlyArray<ParetoRouteOption>>;
  joinHubRideSharePool(
    actionId: string,
    edgeId: string,
    userId: string
  ): Promise<{ pool_size_count: number; per_person_fare_bdt: number }>;
}

export const TransitAdapter: TransitServiceBoundary = {
  async getActiveAlerts(preset: ScenarioPreset, simOffsetMs: number): Promise<ReadonlyArray<StreetAlert>> {
    if (liveAlertDelegate) {
      try {
        return await liveAlertDelegate(preset, simOffsetMs);
      } catch {
        // Fallback to deterministic mock
      }
    }

    const scenario = mockData.scenarios[preset] || mockData.scenarios.NORMAL_BASELINE;
    return (scenario.alerts ?? []) as unknown as ReadonlyArray<StreetAlert>;
  },

  async planMultiModalRoute(query: CommuterQuery, preset: ScenarioPreset): Promise<ReadonlyArray<ParetoRouteOption>> {
    if (liveRouteDelegate) {
      try {
        return await liveRouteDelegate(query, preset);
      } catch {
        // Fallback to deterministic mock
      }
    }

    return (mockData.sampleRoutes ?? []) as unknown as ReadonlyArray<ParetoRouteOption>;
  },

  async joinHubRideSharePool(
    actionId: string,
    edgeId: string,
    userId: string
  ): Promise<{ pool_size_count: number; per_person_fare_bdt: number }> {
    if (livePoolDelegate) {
      try {
        return await livePoolDelegate(actionId, edgeId, userId);
      } catch {
        // Fallback
      }
    }

    return {
      pool_size_count: 3,
      per_person_fare_bdt: 30,
    };
  },
};
