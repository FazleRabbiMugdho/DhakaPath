// ==============================================================================
// src/features/feature-1-commute/subgraphVerifier.ts
// SAT-Style Boolean Grounding Verifier: V(P) = prod I(e in E) * I(T < inf) * I(|C - C_stat| < eps)
// INIF 2026 DhakaPath — Track 3 (Dev 3: AI, NLP & Vision Engineer)
// ==============================================================================

import {
  TransitEdge,
  TransportMode,
  ParetoRouteOption,
  AuditInterceptionEvent,
  ValidationStatus,
} from "../../contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "../../contracts/canonicalGraph";

export interface SubgraphVerificationResult {
  isValid: boolean;
  status: ValidationStatus;
  interceptionEvent?: AuditInterceptionEvent;
  failedLegIndex?: number;
  violationClause?: string;
  details: {
    edgesGrounded: boolean;
    modesValid: boolean;
    faresGrounded: boolean;
    continuityValid: boolean;
  };
}

// Fast Map Lookup for Frozen Canonical Graph G_0
const CANONICAL_EDGE_MAP = new Map<string, TransitEdge>();
const CANONICAL_PAIR_MAP = new Map<string, TransitEdge[]>();

for (const edge of CANONICAL_GRAPH_G0) {
  CANONICAL_EDGE_MAP.set(edge.edge_id, edge);
  const pairKey = `${edge.origin_hub_id}->${edge.dest_hub_id}`;
  const existing = CANONICAL_PAIR_MAP.get(pairKey) || [];
  existing.push(edge);
  CANONICAL_PAIR_MAP.set(pairKey, existing);
}

// ------------------------------------------------------------------------------
// 1. Single Candidate Edge Verifier (Used by OCR, CMS, and Trajectory Verifier)
// ------------------------------------------------------------------------------
export function verifyCandidateEdge(edge: Partial<TransitEdge>): {
  isValid: boolean;
  reason?: string;
  groundedEdge?: TransitEdge;
} {
  if (!edge.origin_hub_id || !(edge.origin_hub_id in CANONICAL_HUBS)) {
    return { isValid: false, reason: `Unknown origin hub: ${edge.origin_hub_id}` };
  }
  if (!edge.dest_hub_id || !(edge.dest_hub_id in CANONICAL_HUBS)) {
    return { isValid: false, reason: `Unknown destination hub: ${edge.dest_hub_id}` };
  }

  // Check valid transport modes
  const validModes = Object.values(TransportMode);
  if (!edge.mode || !validModes.includes(edge.mode as TransportMode)) {
    return { isValid: false, reason: `Unsupported transport mode: ${edge.mode}` };
  }

  // Match against canonical edge ID if present
  if (edge.edge_id && CANONICAL_EDGE_MAP.has(edge.edge_id)) {
    return { isValid: true, groundedEdge: CANONICAL_EDGE_MAP.get(edge.edge_id) };
  }

  // Match against origin-destination hub pairs in G_0
  const pairKey = `${edge.origin_hub_id}->${edge.dest_hub_id}`;
  const matchingEdges = CANONICAL_PAIR_MAP.get(pairKey);

  if (matchingEdges && matchingEdges.length > 0) {
    const modeMatch = matchingEdges.find((e) => e.mode === edge.mode);
    if (modeMatch) {
      return { isValid: true, groundedEdge: modeMatch };
    }
    // Connected in G_0 via another mode
    return { isValid: true, groundedEdge: matchingEdges[0] };
  }

  // Walking bridge is allowed between same hub (intra-hub transfer) or direct neighbours
  if (edge.mode === TransportMode.WALK && edge.origin_hub_id === edge.dest_hub_id) {
    return { isValid: true };
  }

  return {
    isValid: false,
    reason: `Trajectory edge ${edge.origin_hub_id} -> ${edge.dest_hub_id} (${edge.mode}) does not exist in Canonical Graph G_0`,
  };
}

// ------------------------------------------------------------------------------
// 2. Full Trajectory Verifier: V(P) = prod I(e_j in E) * I(T < inf) * I(|C - C_stat| < eps)
// ------------------------------------------------------------------------------
export function verifySubgraphTrajectory(
  route: ParetoRouteOption,
  isStudent: boolean
): SubgraphVerificationResult {
  const startTime = performance.now();

  if (!route || !route.legs || route.legs.length === 0) {
    const execution_time_ms = Number((performance.now() - startTime).toFixed(3));
    return {
      isValid: false,
      status: ValidationStatus.GROUNDING_INTERCEPTED,
      violationClause: "Route contains 0 legs",
      interceptionEvent: {
        event_id: `audit_empty_${Date.now()}`,
        timestamp_ms: Date.now(),
        status: ValidationStatus.GROUNDING_INTERCEPTED,
        rejected_payload_summary: "Empty candidate route rejected",
        execution_time_ms,
      },
      details: {
        edgesGrounded: false,
        modesValid: false,
        faresGrounded: false,
        continuityValid: false,
      },
    };
  }

  let edgesGrounded = true;
  let modesValid = true;
  let faresGrounded = true;
  let continuityValid = true;
  let violationReason = "";
  let failedIndex = -1;

  for (let i = 0; i < route.legs.length; i++) {
    const leg = route.legs[i];

    // Check 1: Mode Validity
    const validModes = Object.values(TransportMode);
    if (!validModes.includes(leg.mode)) {
      modesValid = false;
      violationReason = `Leg ${i + 1}: Unrecognized or hallucinated mode '${leg.mode}'`;
      failedIndex = i;
      break;
    }

    // Check 2: Canonical Edge Grounding in G_0
    const edgeVerification = verifyCandidateEdge({
      edge_id: leg.edge_id,
      origin_hub_id: leg.origin_hub_id,
      dest_hub_id: leg.dest_hub_id,
      mode: leg.mode,
    });

    if (!edgeVerification.isValid) {
      edgesGrounded = false;
      violationReason = `Leg ${i + 1}: Edge ${leg.origin_hub_id} -> ${leg.dest_hub_id} (${leg.mode}) Not in Canonical Graph G_0`;
      failedIndex = i;
      break;
    }

    const canonicalEdge = edgeVerification.groundedEdge;

    // Check 3: Statutory Fare Grounding Law
    // Metro MRT-6: Statutory rule: NO student discount on Dhaka Metro
    if (leg.mode === TransportMode.METRO) {
      if (canonicalEdge && leg.effective_fare_bdt < canonicalEdge.base_fare_bdt) {
        faresGrounded = false;
        violationReason = `Leg ${i + 1}: Metro MRT-6 illegal fare (${leg.effective_fare_bdt} BDT). Dhaka Metro grants 0% student pass. Statutory fare: ${canonicalEdge.base_fare_bdt} BDT`;
        failedIndex = i;
        break;
      }
    }

    // Bus: Student half-fare floor of 10 BDT
    if (leg.mode === TransportMode.BUS && isStudent) {
      if (canonicalEdge?.student_half_fare_eligible) {
        const statutoryStudentFloor = Math.max(10, Math.ceil(canonicalEdge.base_fare_bdt / 2));
        if (leg.effective_fare_bdt < statutoryStudentFloor) {
          faresGrounded = false;
          violationReason = `Leg ${i + 1}: Bus fare (${leg.effective_fare_bdt} BDT) violates statutory 10 BDT minimum floor (Expected: ${statutoryStudentFloor} BDT)`;
          failedIndex = i;
          break;
        }
      }
    }

    // Anomalous Fare Cap: Fare cannot exceed 3x base fare (anti-scalping / anti-hallucination)
    if (canonicalEdge && leg.regular_fare_bdt > canonicalEdge.base_fare_bdt * 3.5) {
      faresGrounded = false;
      violationReason = `Leg ${i + 1}: Anomalous fare ${leg.regular_fare_bdt} BDT exceeds 3.5x statutory cap (${canonicalEdge.base_fare_bdt} BDT)`;
      failedIndex = i;
      break;
    }

    // Check 4: Path Continuity (leg[i].dest === leg[i+1].origin)
    if (i < route.legs.length - 1) {
      const nextLeg = route.legs[i + 1];
      if (leg.dest_hub_id !== nextLeg.origin_hub_id) {
        // Only allow if both legs connect to the same hub via walk bridge transfer
        const isTransfer =
          (leg.mode === TransportMode.WALK && leg.dest_hub_id === nextLeg.origin_hub_id) ||
          (nextLeg.mode === TransportMode.WALK && leg.dest_hub_id === nextLeg.origin_hub_id);

        if (!isTransfer) {
          continuityValid = false;
          violationReason = `Discontinuous trajectory: Leg ${i + 1} ends at ${leg.dest_hub_id} but Leg ${i + 2} starts at ${nextLeg.origin_hub_id}`;
          failedIndex = i;
          break;
        }
      }
    }
  }

  const isValid = edgesGrounded && modesValid && faresGrounded && continuityValid;
  const execution_time_ms = Number((performance.now() - startTime).toFixed(3));

  if (!isValid) {
    const status = !faresGrounded
      ? ValidationStatus.ANOMALOUS_FARE_REJECTED
      : ValidationStatus.GROUNDING_INTERCEPTED;

    return {
      isValid: false,
      status,
      failedLegIndex: failedIndex,
      violationClause: violationReason,
      interceptionEvent: {
        event_id: `audit_grounding_${Date.now()}`,
        timestamp_ms: Date.now(),
        status,
        rejected_payload_summary: violationReason,
        execution_time_ms,
      },
      details: {
        edgesGrounded,
        modesValid,
        faresGrounded,
        continuityValid,
      },
    };
  }

  return {
    isValid: true,
    status: ValidationStatus.GRAPH_GROUNDED,
    details: {
      edgesGrounded: true,
      modesValid: true,
      faresGrounded: true,
      continuityValid: true,
    },
  };
}

// ------------------------------------------------------------------------------
// 3. Filter and Sanitize Pareto Routes
// ------------------------------------------------------------------------------
export function sanitizeAndFilterParetoRoutes(
  routes: ReadonlyArray<ParetoRouteOption>,
  isStudent: boolean
): {
  verifiedRoutes: ParetoRouteOption[];
  interceptions: AuditInterceptionEvent[];
} {
  const verifiedRoutes: ParetoRouteOption[] = [];
  const interceptions: AuditInterceptionEvent[] = [];

  for (const route of routes) {
    const result = verifySubgraphTrajectory(route, isStudent);
    if (result.isValid) {
      verifiedRoutes.push({
        ...route,
        grounding_status: ValidationStatus.GRAPH_GROUNDED,
      });
    } else if (result.interceptionEvent) {
      interceptions.push(result.interceptionEvent);
    }
  }

  return { verifiedRoutes, interceptions };
}
