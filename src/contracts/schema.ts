// ==============================================================================
// src/contracts/schema.ts — LOCKED CONTRACT FOR DHAKAPATH (INIF 2026)
// Zero-Drift Serialization Law:
// 1. Zero raw magic strings: Always use shared enums
// 2. Strict unit suffixes: _ms, _bdt, _pct
// 3. Non-nullable arrays: Default to []
// ==============================================================================

export enum HubId {
  H_UTTARA = "H_UTTARA",
  H_MIRPUR10 = "H_MIRPUR10",
  H_AGARGAON = "H_AGARGAON",
  H_MOHAKHALI = "H_MOHAKHALI",
  H_BADDA = "H_BADDA",
  H_BANASREE = "H_BANASREE",
  H_MALIBAGH = "H_MALIBAGH",
  H_FARMGATE = "H_FARMGATE",
  H_MOHAMMADPUR = "H_MOHAMMADPUR",
  H_DHANMONDI = "H_DHANMONDI",
  H_SCIENCELAB = "H_SCIENCELAB",
  H_SHAHBAGH = "H_SHAHBAGH",
  H_MOTIJHEEL = "H_MOTIJHEEL",
  H_JATRABARI = "H_JATRABARI",
  H_GULISTAN = "H_GULISTAN",
}

export enum TransportMode {
  BUS = "BUS",
  METRO = "METRO",
  LEGUNA = "LEGUNA",
  RICKSHAW = "RICKSHAW",
  WALK = "WALK",
}

export enum ScenarioPreset {
  NORMAL_BASELINE = "NORMAL_BASELINE",
  PEAK_CRISIS_SURGE = "PEAK_CRISIS_SURGE",
  ADVERSARIAL_CORRUPT_INPUT = "ADVERSARIAL_CORRUPT_INPUT",
}

export enum IncidentType {
  WATERLOGGING = "WATERLOGGING",
  INTERSECTION_BLOCKADE = "INTERSECTION_BLOCKADE",
  SEVERE_GRIDLOCK = "SEVERE_GRIDLOCK",
  ROAD_CONSTRUCTION = "ROAD_CONSTRUCTION",
}

export enum AlertStatus {
  VERIFIED_ACTIVE = "VERIFIED_ACTIVE",
  PENDING_CORROBORATION = "PENDING_CORROBORATION",
  EXPIRED = "EXPIRED",
  RESOLVED = "RESOLVED",
}

export enum ValidationStatus {
  GRAPH_GROUNDED = "GRAPH_GROUNDED",
  ANOMALOUS_FARE_REJECTED = "ANOMALOUS_FARE_REJECTED",
  CONTRADICTORY_REPORT_QUARANTINED = "CONTRADICTORY_REPORT_QUARANTINED",
  GROUNDING_INTERCEPTED = "GROUNDING_INTERCEPTED",
}

export enum ActionLockState {
  IDLE = "IDLE",
  PROCESSING = "PROCESSING",
  RESOLVED = "RESOLVED",
}

export interface HubMetadata {
  readonly hub_id: HubId;
  readonly index: number;
  readonly name_en: string;
  readonly name_bn: string;
  readonly lat: number;
  readonly lng: number;
  readonly svg_x: number;
  readonly svg_y: number;
  readonly keywords: ReadonlyArray<string>;
}

export interface TransitEdge {
  readonly edge_id: string;
  readonly origin_hub_id: HubId;
  readonly dest_hub_id: HubId;
  readonly mode: TransportMode;
  readonly route_name: string;
  readonly distance_km: number;
  readonly base_fare_bdt: number;
  readonly base_duration_ms: number;
  readonly student_half_fare_eligible: boolean;
  readonly boarding_landmark: string;
}

export interface CrowdVote {
  readonly vote_id: string;
  readonly voter_session_id: string;
  readonly direction: 1 | -1;
  readonly reliability_weight: number;
  readonly timestamp_ms: number;
}

export interface StreetAlert {
  readonly alert_id: string;
  readonly edge_id: string;
  readonly hub_id: HubId;
  readonly incident_type: IncidentType;
  readonly status: AlertStatus;
  readonly validation_status: ValidationStatus;
  readonly severity_alpha: number;
  readonly confidence_pct: number; // 0 to 100
  readonly half_life_remaining_ms: number;
  readonly created_timestamp_ms: number;
  readonly votes: ReadonlyArray<CrowdVote>; // Always defaults to []
}

export interface CommuterQuery {
  readonly action_id: string;
  readonly raw_query_text: string;
  readonly origin_hub_id: HubId;
  readonly dest_hub_id: HubId;
  readonly is_student: boolean;
  readonly max_budget_bdt: number;
  readonly avoid_hub_ids: ReadonlyArray<HubId>; // Defaults to []
  readonly timestamp_ms: number;
}

export interface RouteLeg {
  readonly edge_id: string;
  readonly origin_hub_id: HubId;
  readonly dest_hub_id: HubId;
  readonly mode: TransportMode;
  readonly route_name: string;
  readonly regular_fare_bdt: number;
  readonly effective_fare_bdt: number;
  readonly surge_multiplier: number;
  readonly pool_size_count: number;
  readonly effective_duration_ms: number;
  readonly boarding_landmark: string;
}

export interface ParetoRouteOption {
  readonly route_id: string;
  readonly legs: ReadonlyArray<RouteLeg>; // Defaults to []
  readonly total_regular_fare_bdt: number;
  readonly total_effective_fare_bdt: number;
  readonly total_duration_ms: number;
  readonly transfers_count: number;
  readonly generalized_cost_score: number;
  readonly grounding_status: ValidationStatus;
}

export interface CounterfactualRoiMetrics {
  readonly time_saved_ms: number;
  readonly cost_saved_bdt: number;
  readonly risk_reduction_pct: number;
  readonly shadow_duration_ms: number;
  readonly shadow_fare_bdt: number;
  readonly benchmark_manual_latency_ms: number; // 510,000 ms (8.5 min)
  readonly benchmark_engine_latency_ms: number; // ~1,400 ms (1.4 sec)
}

export interface AuditInterceptionEvent {
  readonly event_id: string;
  readonly timestamp_ms: number;
  readonly status: ValidationStatus;
  readonly rejected_payload_summary: string;
  readonly execution_time_ms: number;
}

export interface ScenarioInjectorViewState {
  readonly active_preset: ScenarioPreset;
  readonly sim_offset_ms: number;
  readonly lock_state: ActionLockState;
  readonly last_action_id: string;
  readonly surface_velocity_kmh: number;
  readonly active_surge_multiplier: number;
  readonly engine_recompute_latency_ms: number;
  readonly is_demo_telemetry: true;
}

export interface CommuteCommandViewState {
  readonly active_query: CommuterQuery;
  readonly parser_source: "LLM_SANDBOX" | "DETERMINISTIC_REGEX_FALLBACK";
  readonly parse_latency_ms: number;
  readonly pareto_routes: ReadonlyArray<ParetoRouteOption>;
  readonly selected_route_id: string;
  readonly pool_lock_state: ActionLockState;
  readonly export_lock_state: ActionLockState;
  readonly last_exported_png_kb: number;
  readonly grounding_audit_status: ValidationStatus;
}

export interface MapAndRoiViewState {
  readonly active_optimal_route: ParetoRouteOption | null;
  readonly shadow_baseline_hubs: ReadonlyArray<HubId>;
  readonly active_alerts: ReadonlyArray<StreetAlert>;
  readonly walk_bridge_active: boolean;
  readonly osm_tiles_online: boolean;
  readonly roi_metrics: CounterfactualRoiMetrics;
}

export interface TrustShieldCmsViewState {
  readonly active_alerts: ReadonlyArray<StreetAlert>;
  readonly interception_log: ReadonlyArray<AuditInterceptionEvent>;
  readonly ocr_extracted_edges: ReadonlyArray<TransitEdge>;
  readonly vote_lock_state: ActionLockState;
  readonly ocr_lock_state: ActionLockState;
}
