"use client";

// ==============================================================================
// src/shell/useScenarioInjector.ts — ZONE 0 ISOLATED HOOK (Feature 0)
// Owns the Stage Time-Machine: preset switching with a 150ms idempotent lock,
// simulated-clock scrub, global stage hotkeys, and the X-Ray drawer latch.
// ==============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { ScenarioPreset, ActionLockState } from "@/contracts/schema";

export interface ScenarioPresetMeta {
  readonly preset: ScenarioPreset;
  readonly index: 1 | 2 | 3;
  readonly label: string;
  readonly hotkey: string;
  readonly accent: string; // Token color for the active segment
}

export const SCENARIO_PRESETS: ReadonlyArray<ScenarioPresetMeta> = [
  { preset: ScenarioPreset.NORMAL_BASELINE, index: 1, label: "Normal Baseline", hotkey: "Alt+1", accent: "#10B981" },
  { preset: ScenarioPreset.PEAK_CRISIS_SURGE, index: 2, label: "Peak Crisis Surge", hotkey: "Alt+2", accent: "#F43F5E" },
  { preset: ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT, index: 3, label: "Adversarial / Corrupt Input", hotkey: "Alt+3", accent: "#F59E0B" },
];

export interface ScenarioInjectorApi {
  activePreset: ScenarioPreset;
  simOffsetMs: number;
  lockState: ActionLockState;
  isLocked: boolean;
  surfaceVelocityKmh: number;
  surgeMultiplier: number;
  engineLatencyMs: number;
  lastActionId: string;
  xrayOpen: boolean;
  selectPreset: (preset: ScenarioPreset) => void;
  setOffsetMs: (ms: number) => void;
  reset: () => void;
  toggleXray: () => void;
  setXray: (open: boolean) => void;
}

const DEBOUNCE_MS = 150;

export function useScenarioInjector(): ScenarioInjectorApi {
  const store = useDhakaPathStore();
  const [xrayOpen, setXrayOpen] = useState<boolean>(false);
  const [lastActionId, setLastActionId] = useState<string>("SCENARIO_NORMAL_BASELINE_0");
  const debounceUntilRef = useRef<number>(0);

  const isLocked = store.scenarioLockState === ActionLockState.PROCESSING;

  const selectPreset = useCallback(
    (preset: ScenarioPreset) => {
      const now = performance.now();
      // 150ms idempotent debounce lock — 5x rapid clicks collapse to one projection.
      if (now < debounceUntilRef.current || store.scenarioLockState === ActionLockState.PROCESSING) return;
      debounceUntilRef.current = now + DEBOUNCE_MS;
      const simOffsetMin = Math.round(store.simOffsetMs / 60000);
      setLastActionId(`SCENARIO_${preset}_${simOffsetMin}`);
      void store.setScenarioPreset(preset);
    },
    [store]
  );

  const setOffsetMs = useCallback(
    (ms: number) => {
      store.setSimOffsetMs(ms);
      const simOffsetMin = Math.round(ms / 60000);
      setLastActionId(`SCENARIO_${store.activePreset}_${simOffsetMin}`);
    },
    [store]
  );

  const reset = useCallback(() => {
    debounceUntilRef.current = performance.now() + DEBOUNCE_MS;
    setLastActionId("SCENARIO_NORMAL_BASELINE_0");
    store.resetToCanonicalG0();
  }, [store]);

  const toggleXray = useCallback(() => setXrayOpen((v) => !v), []);
  const setXray = useCallback((open: boolean) => setXrayOpen(open), []);

  // Stage hotkeys: Alt+1/2/3 presets, Alt+R reset, Ctrl+Shift+D X-Ray drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;

      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        toggleXray();
        return;
      }
      if (e.altKey && !e.ctrlKey) {
        if (e.key === "1") { e.preventDefault(); selectPreset(ScenarioPreset.NORMAL_BASELINE); }
        else if (e.key === "2") { e.preventDefault(); selectPreset(ScenarioPreset.PEAK_CRISIS_SURGE); }
        else if (e.key === "3") { e.preventDefault(); selectPreset(ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT); }
        else if (e.key === "r" || e.key === "R") { e.preventDefault(); reset(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectPreset, reset, toggleXray]);

  return useMemo(
    () => ({
      activePreset: store.activePreset,
      simOffsetMs: store.simOffsetMs,
      lockState: store.scenarioLockState,
      isLocked,
      surfaceVelocityKmh: store.surfaceVelocityKmh,
      surgeMultiplier: store.surgeMultiplier,
      engineLatencyMs: store.engineRecomputeLatencyMs,
      lastActionId,
      xrayOpen,
      selectPreset,
      setOffsetMs,
      reset,
      toggleXray,
      setXray,
    }),
    [
      store.activePreset,
      store.simOffsetMs,
      store.scenarioLockState,
      store.surfaceVelocityKmh,
      store.surgeMultiplier,
      store.engineRecomputeLatencyMs,
      isLocked,
      lastActionId,
      xrayOpen,
      selectPreset,
      setOffsetMs,
      reset,
      toggleXray,
      setXray,
    ]
  );
}
