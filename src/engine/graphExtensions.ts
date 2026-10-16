// ==============================================================================
// src/engine/graphExtensions.ts — RUNTIME EXTENSIONS TO THE FROZEN GRAPH
// CANONICAL_GRAPH_G0 stays frozen. Admin-added links and verified signboard edges
// live here and are merged on top of G0 by the router and the grounding verifier.
// ==============================================================================

import type { TransitEdge } from "../contracts/schema";

let extraEdges: ReadonlyArray<TransitEdge> = Object.freeze([]);
let version = 0;

export function getExtraEdges(): ReadonlyArray<TransitEdge> {
  return extraEdges;
}

export function getGraphVersion(): number {
  return version;
}

export function setExtraEdges(next: ReadonlyArray<TransitEdge>): void {
  extraEdges = Object.freeze([...next]);
  version += 1;
}
