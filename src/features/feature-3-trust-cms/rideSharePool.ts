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
  const safeBaseFare = Number.isFinite(baseFareBdt) ? Math.max(0, baseFareBdt) : 0;
  const safeSurge = Number.isFinite(surgeMultiplier)
    ? Math.min(3.0, Math.max(1.0, surgeMultiplier))
    : 1.0;
  const safePoolSize = Number.isFinite(poolSizeCount)
    ? Math.min(4, Math.max(1, Math.floor(poolSizeCount)))
    : 1;

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

type PoolDirection = "JOIN" | "LEAVE";

interface PoolActionSnapshot {
  readonly direction: PoolDirection;
  readonly actorSessionId: string;
  readonly members: ReadonlyArray<string>;
  readonly baseFare: number;
  readonly surge: number;
  readonly hubId: string;
  readonly timestampMs: number;
}

interface PoolEntry {
  readonly members: Set<string>;
  readonly baseFare: number;
  readonly surge: number;
  readonly hubId: string;
  lastActionId: string;
  readonly actionHistory: Map<string, PoolActionSnapshot>;
}

const ACTION_HISTORY_MAX = 128;
const ACTION_TTL_MS = 10 * 60 * 1000;

function createPoolEntry(
  baseFare: number,
  surge: number,
  hubId: string,
  members: string[]
): PoolEntry {
  return {
    members: new Set(members),
    baseFare,
    surge,
    hubId,
    lastActionId: "INIT",
    actionHistory: new Map(),
  };
}

/**
 * In-memory pool registry for track 2 demonstration and offline runtime.
 * The API binds callers to an HttpOnly session cookie; this module enforces the
 * capacity and idempotency rules but never trusts client-supplied pool sizes.
 */
const inMemoryPoolRegistry: Map<string, PoolEntry> = new Map([
  [
    "E_RICK_MOTIJHEEL_LASTMILE",
    createPoolEntry(50, 1.8, "H_MOTIJHEEL", ["commuter_seed_1", "commuter_seed_2"]),
  ],
  [
    "E_RICK_MIRPUR10_FEEDER",
    createPoolEntry(40, 1.5, "H_MIRPUR10", ["commuter_seed_3", "commuter_seed_4", "commuter_seed_5"]),
  ],
]);

function pruneActionHistory(entry: PoolEntry, nowMs: number): void {
  for (const [actionId, snapshot] of entry.actionHistory) {
    if (nowMs - snapshot.timestampMs > ACTION_TTL_MS) entry.actionHistory.delete(actionId);
  }
  while (entry.actionHistory.size > ACTION_HISTORY_MAX) {
    const oldest = entry.actionHistory.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    entry.actionHistory.delete(oldest);
  }
}

function buildState(
  edgeId: string,
  entry: PoolEntry,
  members: ReadonlyArray<string>,
  sessionUserId: string,
  actionId: string,
  updatedTimestampMs: number
): HubRideSharePoolState {
  const currentSize = Math.min(4, Math.max(1, members.length));
  const split = computePoolSplit(entry.baseFare, entry.surge, currentSize);
  return {
    edgeId,
    hubId: entry.hubId,
    baseFareBdt: entry.baseFare,
    surgeMultiplier: entry.surge,
    poolSizeCount: split.poolSizeCount,
    perPersonFareBdt: split.perPersonFareBdt,
    totalSurgedFareBdt: split.totalSurgedFareBdt,
    savingsBdt: split.savingsBdt,
    memberSessionIds: [...members],
    isUserJoined: members.includes(sessionUserId),
    lastResolvedActionId: actionId,
    updatedTimestampMs,
  };
}

/**
 * Idempotently mutates the ride-share pool state. Each action ID is stored with
 * a bounded, 10-minute action-history snapshot, so replaying an older action
 * after a newer one returns the original result instead of re-applying it.
 */
export function mutateRideSharePool(
  actionId: string,
  edgeId: string,
  sessionUserId: string,
  direction: PoolDirection,
  customBaseFareBdt?: number,
  customSurgeMultiplier?: number,
  customHubId?: string
): HubRideSharePoolState {
  if (!actionId || typeof actionId !== "string" || actionId.length > 160) {
    throw new RangeError("Invalid pool action ID");
  }
  if (!edgeId || typeof edgeId !== "string") throw new RangeError("Invalid pool edge");
  if (!sessionUserId || typeof sessionUserId !== "string") {
    throw new RangeError("Invalid pool session");
  }
  if (direction !== "JOIN" && direction !== "LEAVE") {
    throw new RangeError("Invalid pool direction");
  }

  let poolEntry = inMemoryPoolRegistry.get(edgeId);
  const now = Date.now();

  if (poolEntry) {
    const previous = poolEntry.actionHistory.get(actionId);
    if (previous) {
      // The action ID is the idempotency key. Replays return the original
      // snapshot regardless of which cookie happened to accompany the retry,
      // so a rapid double-click (or a retried request) can never double-apply.
      return buildState(
        edgeId,
        poolEntry,
        previous.members,
        sessionUserId,
        actionId,
        previous.timestampMs
      );
    }
  }

  if (!poolEntry) {
    const safeBase = Number.isFinite(customBaseFareBdt)
      ? Math.max(0, customBaseFareBdt as number)
      : 50;
    const safeSurge = Number.isFinite(customSurgeMultiplier)
      ? Math.min(3.0, Math.max(1.0, customSurgeMultiplier as number))
      : 1.8;
    poolEntry = createPoolEntry(safeBase, safeSurge, customHubId ?? "H_MOTIJHEEL", [
      "commuter_seed_1",
    ]);
    inMemoryPoolRegistry.set(edgeId, poolEntry);
  }

  if (direction === "JOIN") {
    if (poolEntry.members.size < 4 && !poolEntry.members.has(sessionUserId)) {
      poolEntry.members.add(sessionUserId);
    }
  } else if (poolEntry.members.has(sessionUserId)) {
    poolEntry.members.delete(sessionUserId);
  }

  poolEntry.lastActionId = actionId;
  const members = Array.from(poolEntry.members);
  poolEntry.actionHistory.set(actionId, {
    direction,
    actorSessionId: sessionUserId,
    members,
    baseFare: poolEntry.baseFare,
    surge: poolEntry.surge,
    hubId: poolEntry.hubId,
    timestampMs: now,
  });
  pruneActionHistory(poolEntry, now);

  return buildState(edgeId, poolEntry, members, sessionUserId, actionId, now);
}

/**
 * Returns current snapshot of a pool without mutating state.
 */
export function getPoolSnapshot(
  edgeId: string,
  sessionUserId: string = "current_commuter"
): HubRideSharePoolState {
  const poolEntry = inMemoryPoolRegistry.get(edgeId) ??
    createPoolEntry(50, 1.8, "H_MOTIJHEEL", ["commuter_seed_1", "commuter_seed_2"]);

  return buildState(edgeId, poolEntry, Array.from(poolEntry.members), sessionUserId, poolEntry.lastActionId, Date.now());
}
