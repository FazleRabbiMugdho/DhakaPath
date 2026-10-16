import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const EPSILON = 1e-6;

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Extracts and parses JSON payload safely from raw LLM or OCR output.
 * Strips non-JSON preamble/fences by locating first '{' and last '}'.
 */
export function safeExtractJson<T>(rawLlmText: string, fallback: T): T {
  if (!rawLlmText || typeof rawLlmText !== "string") return fallback;
  const start = rawLlmText.indexOf("{");
  const end = rawLlmText.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return fallback;
  try {
    const candidate = rawLlmText.slice(start, end + 1);
    return JSON.parse(candidate) as T;
  } catch {
    return fallback;
  }
}

/**
 * Formats duration in milliseconds into human-readable minutes (e.g., 2280000ms -> "38 mins").
 */
export function formatDurationMin(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) return "0 mins";
  const minutes = Math.round(durationMs / 60000);
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

/**
 * Clamps a number safely within [min, max], falling back if non-finite (protects from NaN/Infinity).
 */
export function clampFinite(val: number, min: number, max: number, fallback: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, val));
}
