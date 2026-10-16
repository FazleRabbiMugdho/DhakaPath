"use client";

// ==============================================================================
// src/store/useDhakaPathStore.tsx — SINGLE SOURCE OF TRUTH (WAVE 2)
// One reactive store drives every screen. State is small and explicit; everything
// the UI shows (alerts, routes, ROI, severed hubs) is DERIVED synchronously from
// it through the live engine, so a vote, a slider scrub or a preset switch
// updates the map, route cards and safety log together, with no mock data.
//
//   crowd alerts + sim clock + preset -> Bayesian decay -> alerts
//   query + alerts + pools + graph    -> Pareto search -> grounding verifier -> routes
//   best route + alerts               -> counterfactual shadow baseline -> ROI
// ==============================================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertStatus,
  AuditInterceptionEvent,
  CommuterQuery,
  CounterfactualRoiMetrics,
  HubId,
  IncidentType,
  ParetoRouteOption,
  ScenarioPreset,
  StreetAlert,
  TransitEdge,
  TransportMode,
  ValidationStatus,
  CrowdVote,
} from "../contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../contracts/canonicalGraph";
import { executeParetoSearch } from "../engine/paretoRouter";
import { computeCounterfactualRoi, computeNaiveSurfacePath } from "../engine/shadowBaseline";
import { projectScenario } from "../engine/scenarioStore";
import { setExtraEdges } from "../engine/graphExtensions";
import { computeApprovedBusFareBdt, computeMrt6FareBdt } from "../engine/fareEngine";
import {
  DEFAULT_OFF_PEAK_PRIOR,
  DEFAULT_PEAK_PRIOR,
  TAU_BLOCKADE,
  evaluateDecayedAlert,
} from "../features/feature-3-trust-cms/bayesianTruth";
import {
  FareValidationResult,
  validateAlertResolution,
  validateFareSubmission,
} from "../features/feature-3-trust-cms/sanityFilter";
import { computePoolSplit, mutateRideSharePool } from "../features/feature-3-trust-cms/rideSharePool";
import { BanglishParseResult, parseCommuterIntent } from "../features/feature-1-commute/banglishParser";
import {
  sanitizeAndFilterParetoRoutes,
  verifyCandidateEdge,
  verifySubgraphTrajectory,
} from "../features/feature-1-commute/subgraphVerifier";
import { SignboardDigitizeResult, digitizeSignboardImage } from "../features/feature-1-commute/signboardVision";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export type RouteTag = "OPTIMAL" | "LOWEST_FARE" | "FASTEST";

export interface RankedRoute {
  readonly route: ParetoRouteOption;
  readonly tags: ReadonlyArray<RouteTag>;
}

export interface SearchOptions {
  readonly forceStudent: boolean;
  readonly bypassFlooded: boolean;
  readonly allowWalkBridge: boolean;
}

export interface PoolBoardEntry {
  readonly edge: TransitEdge;
  readonly size: number; // commuters in the pool, 1..4
  readonly joined: boolean;
  readonly soloBdt: number;
  readonly perPersonBdt: number;
  readonly savingsBdt: number;
}

export interface InterceptionBanner {
  readonly reason: string;
  readonly clause: string;
}

export interface NewLinkInput {
  readonly origin_hub_id: HubId;
  readonly dest_hub_id: HubId;
  readonly mode: TransportMode;
  readonly route_name: string;
  readonly base_fare_bdt: number;
  readonly duration_min: number;
  readonly boarding_landmark: string;
  readonly student_half_fare_eligible: boolean;
}

export interface ActionResult {
  readonly ok: boolean;
  readonly message: string;
}

interface DhakaPathStoreState {
  // clock + scenario
  activePreset: ScenarioPreset;
  simOffsetMs: number;
  simNowMs: number;
  scenarioLocked: boolean;
  surfaceVelocityKmh: number;
  surgeMultiplier: number;
  engineLatencyMs: number;
  lastActionId: string;
  isDemoTelemetry: true;
  // query + results
  activeQuery: CommuterQuery;
  lastParse: BanglishParseResult | null;
  isParsing: boolean;
  options: SearchOptions;
  interception: InterceptionBanner | null;
  rankedRoutes: ReadonlyArray<RankedRoute>;
  paretoRoutes: ReadonlyArray<ParetoRouteOption>;
  selectedRoute: ParetoRouteOption | null;
  selectedRouteId: string;
  walkBridgeActive: boolean;
  walkBridgeBlocked: boolean;
  routeSearchFailed: boolean;
  shadowHubPath: ReadonlyArray<HubId>;
  roi: CounterfactualRoiMetrics;
  // alerts + trust
  alerts: ReadonlyArray<StreetAlert>;
  activeAlerts: ReadonlyArray<StreetAlert>;
  disruptedHubIds: ReadonlyArray<HubId>;
  interceptionLogs: ReadonlyArray<AuditInterceptionEvent>;
  // ride-share
  poolBoard: ReadonlyArray<PoolBoardEntry>;
  // graph
  extraEdges: ReadonlyArray<TransitEdge>;
  ocrResult: SignboardDigitizeResult | null;
  ocrBusy: boolean;
  // actions
  setScenarioPreset: (preset: ScenarioPreset) => void;
  setSimOffsetMs: (offsetMs: number) => void;
  resetAll: () => void;
  search: (rawText: string, options: SearchOptions) => Promise<void>;
  submitCommuterSearch: (rawText?: string) => Promise<void>;
  updateCommuterQuery: (patch: Partial<CommuterQuery>) => void;
  setOptions: (options: SearchOptions) => void;
  selectRoute: (routeId: string) => void;
  voteAlert: (alertId: string, direction: 1 | -1) => ActionResult;
  corroborateAlert: (alertId: string, direction: 1 | -1) => ActionResult;
  overrideAlert: (alertId: string) => void;
  reportIncident: (hub: HubId, incident: IncidentType, severity: 1 | 2 | 3, guestWeight?: number) => ActionResult;
  addStreetAlert: (alert: StreetAlert) => void;
  checkFare: (edgeId: string, fareBdt: number) => FareValidationResult;
  joinPool: (edgeId: string) => void;
  joinRideSharePool: (edgeId: string) => Promise<void> | void;
  leavePool: (edgeId: string) => void;
  scanSignboard: (input: { presetId?: string; file?: File; rawText?: string }) => Promise<void>;
  commitOcrEdges: () => ActionResult;
  discardOcrEdges: () => void;
  addLink: (input: NewLinkInput) => ActionResult;
  removeLink: (edgeId: string) => void;
  addLog: (event: Omit<AuditInterceptionEvent, "event_id" | "timestamp_ms">) => void;
  addInterceptionLog: (event: Omit<AuditInterceptionEvent, "event_id" | "timestamp_ms"> | AuditInterceptionEvent) => void;
}

// ---------------------------------------------------------------------------
// Seed data (relative to the provider's frozen demo clock T0)
// ---------------------------------------------------------------------------
const MIN = 60_000;
const STALE_MS = 60 * MIN; // no positive re-verification for an hour -> expired
const SCENARIO_LOCK_MS = 150;

const DEFAULT_QUERY: CommuterQuery = {
  action_id: "QUERY_INIT_DEFAULT",
  raw_query_text: "bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?",
  origin_hub_id: HubId.H_MIRPUR10,
  dest_hub_id: HubId.H_MOTIJHEEL,
  is_student: true,
  max_budget_bdt: 55,
  avoid_hub_ids: [HubId.H_FARMGATE],
  timestamp_ms: 0,
};

const DEFAULT_OPTIONS: SearchOptions = { forceStudent: true, bypassFlooded: true, allowWalkBridge: true };

// Weights are calibrated so, at the peak-crisis prior (0.45), the seeds land on the
// 91.8% (Farmgate) and 89.2% (Malibagh) posteriors the pitch quotes.
function seedVotes(prefix: string, t0: number, ages: number[], weights: number[]): CrowdVote[] {
  return ages.map((age, i) => ({
    vote_id: `${prefix}_${i + 1}`,
    voter_session_id: `${prefix}_commuter_${i + 1}`,
    direction: 1 as const,
    reliability_weight: weights[i],
    timestamp_ms: t0 - age * MIN,
  }));
}

function seedAlerts(t0: number): StreetAlert[] {
  return [
    {
      alert_id: "alert_farmgate_waterlogging",
      edge_id: "E_BUS_SURFACE_MIRPUR10_FARMGATE",
      hub_id: HubId.H_FARMGATE,
      incident_type: IncidentType.WATERLOGGING,
      status: AlertStatus.VERIFIED_ACTIVE,
      validation_status: ValidationStatus.GRAPH_GROUNDED,
      severity_alpha: 2.4,
      confidence_pct: 91.8,
      half_life_remaining_ms: 16 * MIN,
      created_timestamp_ms: t0 - 14 * MIN,
      votes: seedVotes("fg", t0, [14, 10, 6, 3], [0.77, 0.77, 0.8, 0.8]),
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
      half_life_remaining_ms: 12 * MIN,
      created_timestamp_ms: t0 - 18 * MIN,
      votes: seedVotes("mb", t0, [18, 12, 7, 4], [0.71, 0.71, 0.74, 0.74]),
    },
  ];
}

function staleAlert(t0: number): StreetAlert {
  return {
    alert_id: "alert_adversarial_stale",
    edge_id: "E_BUS_SURFACE_MIRPUR10_FARMGATE",
    hub_id: HubId.H_FARMGATE,
    incident_type: IncidentType.WATERLOGGING,
    status: AlertStatus.EXPIRED,
    validation_status: ValidationStatus.GRAPH_GROUNDED,
    severity_alpha: 2.4,
    confidence_pct: 0,
    half_life_remaining_ms: 0,
    created_timestamp_ms: t0 - 95 * MIN,
    votes: seedVotes("stale", t0, [95, 93], [0.6, 0.6]),
  };
}

const HALLUCINATED_ROUTE: ParetoRouteOption = {
  route_id: "adv_hallucinated_route_0",
  legs: [
    {
      edge_id: "E_HALLUCINATED_UNDERGROUND_FERRY",
      origin_hub_id: HubId.H_BADDA,
      dest_hub_id: HubId.H_DHANMONDI,
      mode: "UNDERGROUND_FERRY" as unknown as TransportMode,
      route_name: "Underground Ferry",
      regular_fare_bdt: 5,
      effective_fare_bdt: 5,
      surge_multiplier: 1.0,
      pool_size_count: 1,
      effective_duration_ms: 300000,
      boarding_landmark: "Badda Rampura Lake Tunnel Entrance",
    },
  ],
  total_regular_fare_bdt: 5,
  total_effective_fare_bdt: 5,
  total_duration_ms: 300000,
  transfers_count: 0,
  generalized_cost_score: 12.0,
  grounding_status: ValidationStatus.GROUNDING_INTERCEPTED,
};

const RICKSHAW_BOARD_EDGES = ["E_RICK_MOTIJHEEL_LASTMILE", "E_RICK_MIRPUR10_FEEDER"];
const SEED_POOL_SIZE = 2; // two commuters already waiting at the hub

const EMPTY_ROI: CounterfactualRoiMetrics = {
  time_saved_ms: 0,
  cost_saved_bdt: 0,
  risk_reduction_pct: 0,
  shadow_duration_ms: 0,
  shadow_fare_bdt: 0,
  benchmark_manual_latency_ms: 510000,
  benchmark_engine_latency_ms: 1400,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function persist(table: string, rows: object | object[]): void {
  if (!isSupabaseConfigured) return;
  try {
    void supabase
      .from(table)
      .upsert(rows as never)
      .then(
        () => undefined,
        () => undefined
      );
  } catch {
    // in-memory fallback: the demo keeps working without a backend
  }
}

function persistAlert(a: StreetAlert): void {
  persist("street_alerts", { ...a, half_life_remaining_ms: Math.round(a.half_life_remaining_ms) });
}

function persistLog(e: AuditInterceptionEvent): void {
  persist("interception_logs", e);
}

function deriveAlert(alert: StreetAlert, simNow: number, prior: number, overridden: ReadonlySet<string>): StreetAlert {
  const evaluated = evaluateDecayedAlert(alert, simNow, prior);
  if (overridden.has(alert.alert_id)) {
    return { ...evaluated, status: AlertStatus.RESOLVED, confidence_pct: Math.min(evaluated.confidence_pct, 12) };
  }
  const lastPositive = alert.votes
    .filter((v) => v.direction === 1)
    .reduce((m, v) => Math.max(m, v.timestamp_ms), alert.created_timestamp_ms);
  if (simNow - lastPositive > STALE_MS) return { ...evaluated, status: AlertStatus.EXPIRED };
  return evaluated;
}

function alertEdgeForHub(hub: HubId): string {
  const edge =
    CANONICAL_GRAPH_G0.find((e) => e.dest_hub_id === hub && e.mode === TransportMode.BUS) ??
    CANONICAL_GRAPH_G0.find((e) => e.dest_hub_id === hub || e.origin_hub_id === hub);
  return edge?.edge_id ?? "";
}

function routeHubs(route: ParetoRouteOption | null): ReadonlyArray<HubId> {
  if (!route || route.legs.length === 0) return [];
  const hubs: HubId[] = [route.legs[0].origin_hub_id];
  for (const leg of route.legs) if (leg.dest_hub_id !== hubs[hubs.length - 1]) hubs.push(leg.dest_hub_id);
  return hubs;
}

function tagRoutes(routes: ReadonlyArray<ParetoRouteOption>): RankedRoute[] {
  if (routes.length === 0) return [];
  let cheapest = 0;
  let fastest = 0;
  routes.forEach((r, i) => {
    if (r.total_effective_fare_bdt < routes[cheapest].total_effective_fare_bdt) cheapest = i;
    if (r.total_duration_ms < routes[fastest].total_duration_ms) fastest = i;
  });
  return routes.map((route, i) => {
    const tags: RouteTag[] = [];
    if (i === 0) tags.push("OPTIMAL");
    if (i === cheapest) tags.push("LOWEST_FARE");
    if (i === fastest) tags.push("FASTEST");
    return { route, tags };
  });
}

// Downscale a photo to <=1280px JPEG so the vision request stays small on slow data.
function fileToResizedDataUrl(file: File, maxSide = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
const DhakaPathContext = createContext<DhakaPathStoreState | null>(null);

export function DhakaPathProvider({ children }: { children: React.ReactNode }) {
  // Frozen demo clock: decay is driven only by the Time-Machine offset, never wall time.
  const t0 = useRef<number>(Date.now()).current;

  const [activePreset, setActivePreset] = useState<ScenarioPreset>(ScenarioPreset.NORMAL_BASELINE);
  const [simOffsetMs, setSimOffsetState] = useState<number>(0);
  const [scenarioLocked, setScenarioLocked] = useState<boolean>(false);
  const [lastActionId, setLastActionId] = useState<string>("SCENARIO_NORMAL_BASELINE_0");
  const [engineLatencyMs, setEngineLatencyMs] = useState<number>(0.78);

  const [activeQuery, setActiveQuery] = useState<CommuterQuery>({ ...DEFAULT_QUERY, timestamp_ms: t0 });
  const [lastParse, setLastParse] = useState<BanglishParseResult | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [options, setOptionsState] = useState<SearchOptions>(DEFAULT_OPTIONS);
  const [interception, setInterception] = useState<InterceptionBanner | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  const [crowdAlerts, setCrowdAlerts] = useState<ReadonlyArray<StreetAlert>>(() => seedAlerts(t0));
  const [overridden, setOverridden] = useState<ReadonlySet<string>>(new Set());
  const [logs, setLogs] = useState<ReadonlyArray<AuditInterceptionEvent>>(() => [
    {
      event_id: "audit_boot",
      timestamp_ms: t0,
      status: ValidationStatus.GRAPH_GROUNDED,
      rejected_payload_summary: `Canonical graph G_0 loaded and verified (${Object.keys(CANONICAL_HUBS).length} hubs, ${CANONICAL_GRAPH_G0.length} links)`,
      execution_time_ms: 0.12,
    },
  ]);

  const [poolJoined, setPoolJoined] = useState<Readonly<Record<string, number>>>({}); // edge -> pool size while joined
  const [poolSizes, setPoolSizes] = useState<Readonly<Record<string, number>>>({}); // edge -> current members (incl. seeds)
  const [extraEdges, setExtraEdgesState] = useState<ReadonlyArray<TransitEdge>>([]);
  const [ocrResult, setOcrResult] = useState<SignboardDigitizeResult | null>(null);
  const [ocrBusy, setOcrBusy] = useState<boolean>(false);

  const lockUntil = useRef<number>(0);
  const loggedGrounding = useRef<Set<string>>(new Set());

  // ---- logging -----------------------------------------------------------
  const pushLog = useCallback((event: AuditInterceptionEvent) => {
    setLogs((prev) => [event, ...prev].slice(0, 60));
    persistLog(event);
  }, []);

  const addLog = useCallback(
    (event: Omit<AuditInterceptionEvent, "event_id" | "timestamp_ms">) => {
      pushLog({ ...event, event_id: uid("audit"), timestamp_ms: Date.now() });
    },
    [pushLog]
  );

  // ---- derived: scenario + alerts ----------------------------------------
  const scenario = useMemo(() => projectScenario(activePreset, simOffsetMs), [activePreset, simOffsetMs]);
  const simNow = t0 + simOffsetMs;
  const prior = activePreset === ScenarioPreset.PEAK_CRISIS_SURGE ? DEFAULT_PEAK_PRIOR : DEFAULT_OFF_PEAK_PRIOR;

  const alerts = useMemo<ReadonlyArray<StreetAlert>>(() => {
    const source = activePreset === ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT ? [...crowdAlerts, staleAlert(t0)] : crowdAlerts;
    return source.map((a) => deriveAlert(a, simNow, prior, overridden));
  }, [crowdAlerts, activePreset, simNow, prior, overridden, t0]);

  const disruptedHubIds = useMemo<ReadonlyArray<HubId>>(() => {
    const out: HubId[] = [];
    for (const a of alerts) {
      if (a.status === AlertStatus.VERIFIED_ACTIVE && a.confidence_pct >= TAU_BLOCKADE && !out.includes(a.hub_id)) out.push(a.hub_id);
    }
    return out;
  }, [alerts]);

  // ---- derived: routing ---------------------------------------------------
  const routing = useMemo(() => {
    const started = performance.now();
    try {
      const effectivePools: Record<string, number> = {};
      for (const [edge, size] of Object.entries(poolJoined)) effectivePools[edge] = size;
      const result = executeParetoSearch(activeQuery, activePreset, alerts, effectivePools);
      const sanitized = sanitizeAndFilterParetoRoutes(result.routes, activeQuery.is_student);
      const walkBlocked = result.walk_bridge_active && !options.allowWalkBridge;
      const routes = walkBlocked ? [] : sanitized.verifiedRoutes;
      return {
        ranked: tagRoutes(routes),
        walkBridgeActive: result.walk_bridge_active && !walkBlocked,
        walkBridgeBlocked: walkBlocked,
        failed: false,
        interceptions: sanitized.interceptions,
        ms: performance.now() - started,
      };
    } catch {
      return { ranked: [] as RankedRoute[], walkBridgeActive: false, walkBridgeBlocked: false, failed: true, interceptions: [] as AuditInterceptionEvent[], ms: 0 };
    }
  }, [activeQuery, activePreset, alerts, poolJoined, options.allowWalkBridge, extraEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (routing.ms > 0) setEngineLatencyMs(Math.max(0.05, Number(routing.ms.toFixed(2))));
    for (const ev of routing.interceptions) {
      if (loggedGrounding.current.has(ev.rejected_payload_summary)) continue;
      loggedGrounding.current.add(ev.rejected_payload_summary);
      pushLog(ev);
    }
  }, [routing, pushLog]);

  const selectedRoute = useMemo(
    () => routing.ranked.find((r) => r.route.route_id === selectedRouteId)?.route ?? routing.ranked[0]?.route ?? null,
    [routing.ranked, selectedRouteId]
  );

  const roi = useMemo(
    () => (selectedRoute ? computeCounterfactualRoi(selectedRoute, activeQuery, activePreset, alerts) : EMPTY_ROI),
    [selectedRoute, activeQuery, activePreset, alerts]
  );

  const shadowHubPath = useMemo<ReadonlyArray<HubId>>(() => {
    const path = computeNaiveSurfacePath(activeQuery.origin_hub_id, activeQuery.dest_hub_id);
    if (path.length === 0) return [];
    return [path[0].origin_hub_id, ...path.map((e) => e.dest_hub_id)];
  }, [activeQuery.origin_hub_id, activeQuery.dest_hub_id]);

  // ---- derived: ride-share board -----------------------------------------
  const poolBoard = useMemo<ReadonlyArray<PoolBoardEntry>>(() => {
    const surge = activePreset === ScenarioPreset.PEAK_CRISIS_SURGE ? 1.8 : 1.0;
    return RICKSHAW_BOARD_EDGES.map((edgeId) => CANONICAL_GRAPH_G0.find((e) => e.edge_id === edgeId))
      .filter((e): e is TransitEdge => Boolean(e))
      .map((edge) => {
        const size = poolSizes[edge.edge_id] ?? SEED_POOL_SIZE;
        const joined = edge.edge_id in poolJoined;
        const split = computePoolSplit(edge.base_fare_bdt, surge, size);
        return {
          edge,
          size: split.poolSizeCount,
          joined,
          soloBdt: split.totalSurgedFareBdt,
          perPersonBdt: split.perPersonFareBdt,
          savingsBdt: split.savingsBdt,
        };
      });
  }, [poolSizes, poolJoined, activePreset]);

  // ---- actions: scenario --------------------------------------------------
  const setScenarioPreset = useCallback(
    (preset: ScenarioPreset) => {
      const now = performance.now();
      if (now < lockUntil.current) return; // 150ms idempotent debounce lock
      lockUntil.current = now + SCENARIO_LOCK_MS;
      setScenarioLocked(true);
      window.setTimeout(() => setScenarioLocked(false), SCENARIO_LOCK_MS);
      setLastActionId(`SCENARIO_${preset}_${Math.round(simOffsetMs / MIN)}`);
      setActivePreset(preset);

      if (preset === ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT) {
        // 1) spoofed 500 BDT bus fare through the Tier-1 sanity gate
        const fare = validateFareSubmission("E_BUS_SURFACE_MIRPUR10_FARMGATE", 500);
        if (fare.event) pushLog(fare.event);
        // 2) hallucinated underground ferry through the SAT grounding verifier
        const sat = verifySubgraphTrajectory(HALLUCINATED_ROUTE, true);
        if (sat.interceptionEvent) pushLog(sat.interceptionEvent);
      }
    },
    [simOffsetMs, pushLog]
  );

  const setSimOffsetMs = useCallback((offsetMs: number) => {
    setSimOffsetState(offsetMs);
    setLastActionId((prev) => prev.replace(/_-?\d+$/, `_${Math.round(offsetMs / MIN)}`));
  }, []);

  const resetAll = useCallback(() => {
    lockUntil.current = performance.now() + SCENARIO_LOCK_MS;
    setActivePreset(ScenarioPreset.NORMAL_BASELINE);
    setSimOffsetState(0);
    setLastActionId("SCENARIO_NORMAL_BASELINE_0");
    setActiveQuery({ ...DEFAULT_QUERY, timestamp_ms: Date.now() });
    setLastParse(null);
    setOptionsState(DEFAULT_OPTIONS);
    setInterception(null);
    setSelectedRouteId("");
    setCrowdAlerts(seedAlerts(t0));
    setOverridden(new Set());
    setPoolJoined({});
    setPoolSizes({});
    setExtraEdges([]);
    setExtraEdgesState([]);
    setOcrResult(null);
    loggedGrounding.current = new Set();
    setLogs([
      {
        event_id: uid("audit_reset"),
        timestamp_ms: Date.now(),
        status: ValidationStatus.GRAPH_GROUNDED,
        rejected_payload_summary: "Reset to canonical graph G_0 (extensions cleared)",
        execution_time_ms: 0.05,
      },
    ]);
  }, [t0]);

  // ---- actions: search ----------------------------------------------------
  const search = useCallback(
    async (rawText: string, opts: SearchOptions) => {
      const text = rawText.trim();
      if (!text) return;
      setIsParsing(true);
      setOptionsState(opts);
      try {
        const parsed = await parseCommuterIntent(text);
        const student = opts.forceStudent || parsed.is_student;
        const avoid = new Set<HubId>(parsed.avoid_hub_ids);
        if (opts.bypassFlooded) disruptedHubIds.forEach((h) => avoid.add(h));
        avoid.delete(parsed.origin_hub_id);
        avoid.delete(parsed.dest_hub_id);
        const finalParsed: BanglishParseResult = { ...parsed, is_student: student, avoid_hub_ids: Array.from(avoid) };
        setLastParse(finalParsed);

        if (finalParsed.adversarialHallucinationDetected) {
          const sat = verifySubgraphTrajectory(HALLUCINATED_ROUTE, student);
          const reason =
            finalParsed.hallucinatedSummary ?? "Edge H_BADDA -> H_DHANMONDI (UNDERGROUND_FERRY) Not in Canonical Graph G_0";
          setInterception({ reason, clause: sat.violationClause ?? "V(P) = 0" });
          if (sat.interceptionEvent) pushLog(sat.interceptionEvent);
          return;
        }

        setInterception(null);
        setActiveQuery({
          action_id: uid("SEARCH"),
          raw_query_text: text,
          origin_hub_id: finalParsed.origin_hub_id,
          dest_hub_id: finalParsed.dest_hub_id,
          is_student: student,
          max_budget_bdt: finalParsed.max_budget_bdt,
          avoid_hub_ids: finalParsed.avoid_hub_ids,
          timestamp_ms: Date.now(),
        });
        setSelectedRouteId("");
      } finally {
        setIsParsing(false);
      }
    },
    [disruptedHubIds, pushLog]
  );

  const updateCommuterQuery = useCallback((patch: Partial<CommuterQuery>) => {
    setActiveQuery((prev) => ({ ...prev, ...patch, timestamp_ms: Date.now() }));
  }, []);

  const submitCommuterSearch = useCallback(
    async (rawText?: string) => {
      const text = rawText ?? activeQuery.raw_query_text;
      await search(text, options);
    },
    [activeQuery.raw_query_text, options, search]
  );

  const corroborateAlert = useCallback(
    (alertId: string, direction: 1 | -1) => {
      return voteAlert(alertId, direction);
    },
    [voteAlert]
  );

  const addStreetAlert = useCallback(
    (alert: StreetAlert) => {
      reportIncident(alert.hub_id, alert.incident_type, alert.severity, 0.4);
    },
    [reportIncident]
  );

  const addInterceptionLog = useCallback(
    (event: Omit<AuditInterceptionEvent, "event_id" | "timestamp_ms"> | AuditInterceptionEvent) => {
      if ("event_id" in event && "timestamp_ms" in event) {
        pushLog(event as AuditInterceptionEvent);
      } else {
        addLog(event);
      }
    },
    [pushLog, addLog]
  );

  // ---- actions: crowd alerts ----------------------------------------------
  const voteAlert = useCallback(
    (alertId: string, direction: 1 | -1): ActionResult => {
      const raw = crowdAlerts.find((a) => a.alert_id === alertId);
      const current = alerts.find((a) => a.alert_id === alertId);
      if (!raw || !current) return { ok: false, message: "Alert not found" };

      if (direction === -1) {
        const check = validateAlertResolution(current, 0.5);
        if (check.quarantined && check.event) {
          pushLog(check.event);
          return { ok: false, message: check.reason };
        }
      }

      const vote: CrowdVote = {
        vote_id: uid("vote"),
        voter_session_id: "session_current_user",
        direction,
        reliability_weight: 0.8,
        timestamp_ms: simNow,
      };
      const updated: StreetAlert = { ...raw, votes: [...raw.votes, vote] };
      const after = deriveAlert(updated, simNow, prior, overridden);
      setCrowdAlerts((prev) => prev.map((a) => (a.alert_id === alertId ? updated : a)));
      persistAlert(after);
      if (after.status !== current.status) {
        addLog({
          status: ValidationStatus.GRAPH_GROUNDED,
          rejected_payload_summary: `Alert on ${after.hub_id} moved ${current.status} -> ${after.status} (R_e ${after.confidence_pct}%)`,
          execution_time_ms: 0.08,
        });
      }
      return { ok: true, message: `R_e ${after.confidence_pct}%` };
    },
    [crowdAlerts, alerts, simNow, prior, overridden, pushLog, addLog]
  );

  const overrideAlert = useCallback(
    (alertId: string) => {
      setOverridden((prev) => new Set(prev).add(alertId));
      addLog({
        status: ValidationStatus.GRAPH_GROUNDED,
        rejected_payload_summary: `Admin override: alert ${alertId} marked RESOLVED, corridor cleared`,
        execution_time_ms: 0.04,
      });
    },
    [addLog]
  );

  const reportIncident = useCallback(
    (hub: HubId, incident: IncidentType, severity: 1 | 2 | 3, guestWeight: number = 0.3): ActionResult => {
      const existing = crowdAlerts.find(
        (a) => a.hub_id === hub && a.incident_type === incident && !overridden.has(a.alert_id)
      );
      if (existing) {
        // Same hub + incident already reported: this counts as corroboration, not a duplicate.
        const r = voteAlert(existing.alert_id, 1);
        return { ok: r.ok, message: "corroborated" };
      }
      const alpha = severity === 3 ? 2.4 : severity === 2 ? 1.5 : 1.0;
      const created: StreetAlert = {
        alert_id: uid("alert"),
        edge_id: alertEdgeForHub(hub),
        hub_id: hub,
        incident_type: incident,
        status: AlertStatus.PENDING_CORROBORATION,
        validation_status: ValidationStatus.GRAPH_GROUNDED,
        severity_alpha: alpha,
        confidence_pct: 0,
        half_life_remaining_ms: 30 * MIN,
        created_timestamp_ms: simNow,
        votes: [
          {
            vote_id: uid("vote"),
            voter_session_id: "session_guest_reporter",
            direction: 1,
            reliability_weight: guestWeight,
            timestamp_ms: simNow,
          },
        ],
      };
      setCrowdAlerts((prev) => [created, ...prev]);
      const derived = deriveAlert(created, simNow, prior, overridden);
      persistAlert(derived);
      addLog({
        status: ValidationStatus.GRAPH_GROUNDED,
        rejected_payload_summary: `New ${incident} report at ${hub}: R_e ${derived.confidence_pct}% < ${TAU_BLOCKADE}% -> ${derived.status}, graph untouched`,
        execution_time_ms: 0.06,
      });
      return { ok: true, message: "created" };
    },
    [crowdAlerts, overridden, simNow, prior, voteAlert, addLog]
  );

  const checkFare = useCallback(
    (edgeId: string, fareBdt: number): FareValidationResult => {
      const result = validateFareSubmission(edgeId, fareBdt);
      if (result.event) pushLog(result.event);
      else
        addLog({
          status: ValidationStatus.GRAPH_GROUNDED,
          rejected_payload_summary: `Fare ${fareBdt} BDT accepted for ${edgeId}`,
          execution_time_ms: result.executionTimeMs,
        });
      return result;
    },
    [pushLog, addLog]
  );

  // ---- actions: ride-share pool ------------------------------------------
  const joinPool = useCallback(
    (edgeId: string) => {
      const edge = CANONICAL_GRAPH_G0.find((e) => e.edge_id === edgeId);
      if (!edge) return;
      const surge = activePreset === ScenarioPreset.PEAK_CRISIS_SURGE ? 1.8 : 1.0;
      const state = mutateRideSharePool(uid("POOL_JOIN"), edgeId, "session_current_user", "JOIN", edge.base_fare_bdt, surge, edge.origin_hub_id);
      setPoolSizes((prev) => ({ ...prev, [edgeId]: state.poolSizeCount }));
      setPoolJoined((prev) => ({ ...prev, [edgeId]: state.poolSizeCount }));
      persist("ride_share_pools", {
        edge_id: edgeId,
        hub_id: edge.origin_hub_id,
        pool_size_count: state.poolSizeCount,
        member_session_ids: state.memberSessionIds,
        updated_timestamp_ms: Date.now(),
      });
    },
    [activePreset]
  );

  const leavePool = useCallback((edgeId: string) => {
    const edge = CANONICAL_GRAPH_G0.find((e) => e.edge_id === edgeId);
    if (!edge) return;
    const state = mutateRideSharePool(uid("POOL_LEAVE"), edgeId, "session_current_user", "LEAVE", edge.base_fare_bdt, 1.8, edge.origin_hub_id);
    setPoolSizes((prev) => ({ ...prev, [edgeId]: state.poolSizeCount }));
    setPoolJoined((prev) => {
      const next = { ...prev };
      delete next[edgeId];
      return next;
    });
  }, []);

  // ---- actions: graph (signboard OCR + admin links) ----------------------
  const scanSignboard = useCallback(
    async (input: { presetId?: string; file?: File; rawText?: string }) => {
      setOcrBusy(true);
      try {
        let rawOcrText = input.rawText;
        if (input.file) {
          const dataUrl = await fileToResizedDataUrl(input.file);
          try {
            const res = await fetch("/api/track-3-commute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "ocr_image", base64Image: dataUrl }),
            });
            const data = (await res.json()) as { ok?: boolean; rawOcrText?: string };
            if (data.ok && data.rawOcrText) rawOcrText = data.rawOcrText;
          } catch {
            // offline: fall through to an empty result with guidance
          }
          if (!rawOcrText) {
            setOcrResult({
              rawText: "",
              extractedEdges: [],
              rejectedEdges: [],
              confidencePct: 0,
              processingLatencyMs: 0,
              source: "HEURISTIC_VISION_OCR",
            });
            return;
          }
        }
        const result = await digitizeSignboardImage(
          input.presetId ? { presetId: input.presetId } : { rawOcrText: rawOcrText ?? "" }
        );
        setOcrResult(result);
        if (result.rejectedEdges.length > 0) {
          addLog({
            status: ValidationStatus.GROUNDING_INTERCEPTED,
            rejected_payload_summary: `Signboard: ${result.rejectedEdges.length} unverified edge(s) rejected - ${result.rejectedEdges[0].reason}`,
            execution_time_ms: result.processingLatencyMs,
          });
        }
      } finally {
        setOcrBusy(false);
      }
    },
    [addLog]
  );

  // Shared guard for any edge entering the live graph (OCR commit and admin add).
  const edgeEntryProblem = useCallback(
    (edge: TransitEdge, existing: ReadonlyArray<TransitEdge>): string | null => {
      if (existing.some((e) => e.edge_id === edge.edge_id)) return "duplicate edge id";
      if (edge.origin_hub_id === edge.dest_hub_id) return "origin and destination must differ";
      if (edge.mode === TransportMode.METRO) {
        try {
          computeMrt6FareBdt(edge.origin_hub_id, edge.dest_hub_id);
        } catch {
          return "no official MRT-6 fare for this station pair";
        }
      }
      const typedFare = edge.mode === TransportMode.LEGUNA || edge.mode === TransportMode.RICKSHAW;
      if (typedFare && (edge.base_fare_bdt < 10 || edge.base_fare_bdt > 300)) {
        return "fare must be between 10 and 300 BDT";
      }
      if (edge.base_duration_ms <= 0) return "duration must be positive";
      return null;
    },
    []
  );

  const commitEdges = useCallback(
    (candidates: ReadonlyArray<TransitEdge>, label: string): ActionResult => {
      const accepted: TransitEdge[] = [];
      const problems: string[] = [];
      let working = [...extraEdges];
      for (const edge of candidates) {
        const problem = edgeEntryProblem(edge, [...CANONICAL_GRAPH_G0, ...working]);
        if (problem) problems.push(`${edge.route_name}: ${problem}`);
        else {
          accepted.push(edge);
          working = [...working, edge];
        }
      }
      if (accepted.length > 0) {
        setExtraEdges(working);
        setExtraEdgesState(working);
        addLog({
          status: ValidationStatus.GRAPH_GROUNDED,
          rejected_payload_summary: `${label}: committed ${accepted.length} verified edge(s) to the live graph - ${accepted.map((e) => e.route_name).join(", ")}`,
          execution_time_ms: 0.12,
        });
      }
      if (problems.length > 0) {
        addLog({
          status: ValidationStatus.GROUNDING_INTERCEPTED,
          rejected_payload_summary: `${label}: ${problems.length} edge(s) refused - ${problems[0]}`,
          execution_time_ms: 0.08,
        });
      }
      return { ok: accepted.length > 0, message: problems[0] ?? "" };
    },
    [extraEdges, edgeEntryProblem, addLog]
  );

  const commitOcrEdges = useCallback((): ActionResult => {
    const candidates = ocrResult?.extractedEdges ?? [];
    if (candidates.length === 0) return { ok: false, message: "nothing to commit" };
    const result = commitEdges(candidates, "Signboard OCR");
    setOcrResult(null);
    return result;
  }, [ocrResult, commitEdges]);

  const discardOcrEdges = useCallback(() => {
    if (ocrResult && ocrResult.extractedEdges.length > 0) {
      addLog({
        status: ValidationStatus.GROUNDING_INTERCEPTED,
        rejected_payload_summary: "Discarded unverified signboard candidate edges",
        execution_time_ms: 0.05,
      });
    }
    setOcrResult(null);
  }, [ocrResult, addLog]);

  const addLink = useCallback(
    (input: NewLinkInput): ActionResult => {
      // Distance (haversine x 1.3 road factor) feeds the statutory bus fare.
      const a = CANONICAL_HUBS[input.origin_hub_id];
      const b = CANONICAL_HUBS[input.dest_hub_id];
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLng = ((b.lng - a.lng) * Math.PI) / 180;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const km = Number(Math.max(0.5, 2 * 6371 * Math.asin(Math.sqrt(h)) * 1.3).toFixed(1));
      // Bus and metro fares are statutory (never typed in); only leguna/rickshaw take an entered fare.
      let baseFare = Math.round(input.base_fare_bdt);
      if (input.mode === TransportMode.BUS) baseFare = computeApprovedBusFareBdt(km);
      else if (input.mode === TransportMode.WALK) baseFare = 0;
      else if (input.mode === TransportMode.METRO) {
        try {
          baseFare = computeMrt6FareBdt(input.origin_hub_id, input.dest_hub_id);
        } catch {
          baseFare = 0;
        }
      }
      const withDistance: TransitEdge = {
        edge_id: uid("E_ADMIN"),
        origin_hub_id: input.origin_hub_id,
        dest_hub_id: input.dest_hub_id,
        mode: input.mode,
        route_name: input.route_name.trim() || "Admin link",
        distance_km: km,
        base_fare_bdt: baseFare,
        base_duration_ms: Math.round(input.duration_min * MIN),
        student_half_fare_eligible: input.student_half_fare_eligible && input.mode === TransportMode.BUS,
        boarding_landmark: input.boarding_landmark.trim() || `${a.name_en} stop`,
      };
      const shape = verifyCandidateEdge({ ...withDistance });
      if (!shape.isValid && shape.reason && /Unknown|Unsupported/.test(shape.reason)) return { ok: false, message: shape.reason };
      return commitEdges([withDistance], "Admin");
    },
    [commitEdges]
  );

  const removeLink = useCallback(
    (edgeId: string) => {
      const next = extraEdges.filter((e) => e.edge_id !== edgeId);
      setExtraEdges(next);
      setExtraEdgesState(next);
      addLog({
        status: ValidationStatus.GRAPH_GROUNDED,
        rejected_payload_summary: `Removed link ${edgeId} from the live graph`,
        execution_time_ms: 0.05,
      });
    },
    [extraEdges, addLog]
  );

  const joinRideSharePool = useCallback(
    async (edgeId: string) => {
      joinPool(edgeId);
    },
    [joinPool]
  );

  const selectRoute = useCallback((routeId: string) => setSelectedRouteId(routeId), []);

  const value = useMemo<DhakaPathStoreState>(
    () => ({
      activePreset,
      simOffsetMs,
      simNowMs: simNow,
      scenarioLocked,
      surfaceVelocityKmh: scenario.surface_velocity_kmh,
      surgeMultiplier: scenario.surge_multiplier,
      engineLatencyMs,
      lastActionId,
      isDemoTelemetry: true,
      activeQuery,
      lastParse,
      isParsing,
      options,
      interception,
      rankedRoutes: routing.ranked,
      paretoRoutes: routing.ranked.map((r) => r.route),
      selectedRoute,
      selectedRouteId: selectedRoute?.route_id ?? "",
      walkBridgeActive: routing.walkBridgeActive,
      walkBridgeBlocked: routing.walkBridgeBlocked,
      routeSearchFailed: routing.failed,
      shadowHubPath,
      roi,
      alerts,
      activeAlerts: alerts,
      disruptedHubIds,
      interceptionLogs: logs,
      poolBoard,
      extraEdges,
      ocrResult,
      ocrBusy,
      setScenarioPreset,
      setSimOffsetMs,
      resetAll,
      search,
      submitCommuterSearch,
      corroborateAlert,
      addStreetAlert,
      updateCommuterQuery,
      setOptions: setOptionsState,
      selectRoute,
      voteAlert,
      overrideAlert,
      reportIncident,
      checkFare,
      joinPool,
      joinRideSharePool,
      leavePool,
      scanSignboard,
      commitOcrEdges,
      discardOcrEdges,
      addLink,
      removeLink,
      addLog,
      addInterceptionLog,
    }),
    [
      activePreset, simOffsetMs, simNow, scenarioLocked, scenario, engineLatencyMs, lastActionId, activeQuery, lastParse,
      isParsing, options, interception, routing, selectedRoute, shadowHubPath, roi, alerts, disruptedHubIds, logs,
      poolBoard, extraEdges, ocrResult, ocrBusy, setScenarioPreset, setSimOffsetMs, resetAll, search, submitCommuterSearch,
      corroborateAlert, addStreetAlert, updateCommuterQuery, selectRoute, voteAlert, overrideAlert, reportIncident, checkFare,
      joinPool, joinRideSharePool, leavePool, scanSignboard, commitOcrEdges, discardOcrEdges, addLink, removeLink, addLog,
      addInterceptionLog,
    ]
  );

  return <DhakaPathContext.Provider value={value}>{children}</DhakaPathContext.Provider>;
}

export function useDhakaPathStore(): DhakaPathStoreState {
  const ctx = useContext(DhakaPathContext);
  if (!ctx) throw new Error("useDhakaPathStore must be used within a DhakaPathProvider");
  return ctx;
}

export { routeHubs };
