// ==============================================================================
// src/features/feature-3-trust-cms/rideSharePool.ts
// WAVE 1 — TRACK 2: BONUS 3 AUTOMATED HUB RIDE-SHARE POOL BOT
// Dynamic Fare Splitting for Surged Connector Rickshaws / CNGs (K_e = 1..4)
// ==============================================================================

import { EPSILON } from "../../lib/utils";

export interface PoolSplitResult {
  readonly baseFareBdt: number;
  readonly surgeMultiplier: number;
  readonly poolSizeCount: number;
  readonly totalSurgedFareBdt: number;
  readonly perPersonFareBdt: number;
  readonly savingsBdt: number; // Savings compared to solo surged ride
}

export interface HubRideSharePoolState {
  readonly edgeId: string;
  readonly hubId: string;
  readonly baseFareBdt: number;
  readonly surgeMultiplier: number;
  readonly poolSizeCount: number; // 1 to 4
  readonly perPersonFareBdt: number;
  readonly totalSurgedFareBdt: number;
  readonly savingsBdt: number;
  readonly memberSessionIds: ReadonlyArray<string>;
  readonly isUserJoined: boolean;
  readonly lastResolvedActionId: string;
  readonly updatedTimestampMs: number;
}

/**
 * Computes exact integer BDT fare split and savings per commuter.
 * C_pool(e, K_e, t) = ceil((F_base(e) * gamma_e(t)) / (K_e + epsilon))
 * Delta S_pool = ceil(F_base(e) * gamma_e(t)) - C_pool
 */
export function computePoolSplit(
  baseFareBdt: number,
  surgeMultiplier: number,
  poolSizeCount: number
): PoolSplitResult {
  const safeBaseFare = Math.max(0, baseFareBdt);
  const safeSurge = Math.min(3.0, Math.max(1.0, surgeMultiplier));
  const safePoolSize = Math.min(4, Math.max(1, Math.floor(poolSizeCount)));

  const totalSurgedFareBdt = Math.ceil(safeBaseFare * safeSurge);
  const perPersonFareBdt = Math.ceil(totalSurgedFareBdt / (safePoolSize + EPSILON));
  const savingsBdt = Math.max(0, totalSurgedFareBdt - perPersonFareBdt);

  return {
    baseFareBdt: safeBaseFare,
    surgeMultiplier: safeSurge,
    poolSizeCount: safePoolSize,
    totalSurgedFareBdt,
    perPersonFareBdt,
    savingsBdt,
  };
}

/**
 * In-memory pool registry for track 2 demonstration and offline runtime.
 */
const inMemoryPoolRegistry: Map<string, { members: Set<string>; baseFare: number; surge: number; hubId: string; lastActionId: string }> = new Map([
  [
    "E_RICK_MOTIJHEEL_LASTMILE",
    {
      members: new Set(["commuter_seed_1", "commuter_seed_2"]),
      baseFare: 50,
      surge: 1.8, // 50 * 1.8 = 90 BDT
      hubId: "H_MOTIJHEEL",
      lastActionId: "INIT",
    },
  ],
  [
    "E_RICK_MIRPUR10_FEEDER",
    {
      members: new Set(["commuter_seed_3", "commuter_seed_4", "commuter_seed_5"]),
      baseFare: 40,
      surge: 1.5, // 40 * 1.5 = 60 BDT
      hubId: "H_MIRPUR10",
      lastActionId: "INIT",
    },
  ],
]);

/**
 * Idempotently mutates the ride-share pool state.
 * Double-clicking [Join Hub Pool] will not increment beyond 4 or duplicate the user.
 */
export function mutateRideSharePool(
  actionId: string,
  edgeId: string,
  sessionUserId: string,
  direction: "JOIN" | "LEAVE",
  customBaseFareBdt?: number,
  customSurgeMultiplier?: number,
  customHubId?: string
): HubRideSharePoolState {
  let poolEntry = inMemoryPoolRegistry.get(edgeId);

  if (!poolEntry) {
    poolEntry = {
      members: new Set(["commuter_seed_1"]),
      baseFare: customBaseFareBdt ?? 50,
      surge: customSurgeMultiplier ?? 1.8,
      hubId: customHubId ?? "H_MOTIJHEEL",
      lastActionId: "INIT",
    };
    inMemoryPoolRegistry.set(edgeId, poolEntry);
  }

  // Idempotency check: If this exact actionId was already processed, return current snapshot
  if (actionId && actionId === poolEntry.lastActionId) {
    const split = computePoolSplit(poolEntry.baseFare, poolEntry.surge, poolEntry.members.size);
    return {
      edgeId,
      hubId: poolEntry.hubId,
      baseFareBdt: poolEntry.baseFare,
      surgeMultiplier: poolEntry.surge,
      poolSizeCount: split.poolSizeCount,
      perPersonFareBdt: split.perPersonFareBdt,
      totalSurgedFareBdt: split.totalSurgedFareBdt,
      savingsBdt: split.savingsBdt,
      memberSessionIds: Array.from(poolEntry.members),
      isUserJoined: poolEntry.members.has(sessionUserId),
      lastResolvedActionId: poolEntry.lastActionId,
      updatedTimestampMs: Date.now(),
    };
  }

  if (direction === "JOIN") {
    // Only add if pool has not reached capacity 4 and user is not already in it
    if (poolEntry.members.size < 4 && !poolEntry.members.has(sessionUserId)) {
      poolEntry.members.add(sessionUserId);
    }
  } else if (direction === "LEAVE") {
    // Leave pool / Solo rickshaw rollback
    if (poolEntry.members.has(sessionUserId)) {
      poolEntry.members.delete(sessionUserId);
    }
  }

  poolEntry.lastActionId = actionId;

  const currentSize = Math.min(4, Math.max(1, poolEntry.members.size));
  const split = computePoolSplit(poolEntry.baseFare, poolEntry.surge, currentSize);

  return {
    edgeId,
    hubId: poolEntry.hubId,
    baseFareBdt: poolEntry.baseFare,
    surgeMultiplier: poolEntry.surge,
    poolSizeCount: split.poolSizeCount,
    perPersonFareBdt: split.perPersonFareBdt,
    totalSurgedFareBdt: split.totalSurgedFareBdt,
    savingsBdt: split.savingsBdt,
    memberSessionIds: Array.from(poolEntry.members),
    isUserJoined: poolEntry.members.has(sessionUserId),
    lastResolvedActionId: actionId,
    updatedTimestampMs: Date.now(),
  };
}

/**
 * Returns current snapshot of a pool without mutating state.
 */
export function getPoolSnapshot(
  edgeId: string,
  sessionUserId: string = "current_commuter"
): HubRideSharePoolState {
  const poolEntry = inMemoryPoolRegistry.get(edgeId) ?? {
    members: new Set(["commuter_seed_1", "commuter_seed_2"]),
    baseFare: 50,
    surge: 1.8,
    hubId: "H_MOTIJHEEL",
    lastActionId: "INIT",
  };

  const currentSize = Math.min(4, Math.max(1, poolEntry.members.size));
  const split = computePoolSplit(poolEntry.baseFare, poolEntry.surge, currentSize);

  return {
    edgeId,
    hubId: poolEntry.hubId,
    baseFareBdt: poolEntry.baseFare,
    surgeMultiplier: poolEntry.surge,
    poolSizeCount: split.poolSizeCount,
    perPersonFareBdt: split.perPersonFareBdt,
    totalSurgedFareBdt: split.totalSurgedFareBdt,
    savingsBdt: split.savingsBdt,
    memberSessionIds: Array.from(poolEntry.members),
    isUserJoined: poolEntry.members.has(sessionUserId),
    lastResolvedActionId: poolEntry.lastActionId,
    updatedTimestampMs: Date.now(),
  };
}
