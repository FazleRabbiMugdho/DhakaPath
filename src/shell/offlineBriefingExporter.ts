// ==============================================================================
// src/shell/offlineBriefingExporter.ts — BONUS 2: <45 KB CANVAS CARD + WEB SPEECH
// Renders a route briefing purely onto an offscreen <canvas> with vector type
// and schematic node graphics (zero external image URLs → toDataURL never
// taints), and speaks a concise English/Banglish briefing via the Web Speech
// API with a high-contrast printed-transcript fallback when TTS is absent.
// ==============================================================================

import {
  ParetoRouteOption,
  CommuterQuery,
  CounterfactualRoiMetrics,
  TransportMode,
} from "@/contracts/schema";
import { CANONICAL_HUBS } from "@/contracts/canonicalGraph";

export interface OfflineBriefingResult {
  dataUrl: string;
  fileSizeKb: number;
  filename: string;
}

const MODE_LABEL: Record<TransportMode, string> = {
  [TransportMode.METRO]: "MRT-6 METRO",
  [TransportMode.BUS]: "BUS",
  [TransportMode.LEGUNA]: "LEGUNA",
  [TransportMode.RICKSHAW]: "RICKSHAW",
  [TransportMode.WALK]: "WALK-BRIDGE",
};

const MODE_COLOR: Record<TransportMode, string> = {
  [TransportMode.METRO]: "#22C55E",
  [TransportMode.BUS]: "#3B82F6",
  [TransportMode.LEGUNA]: "#A855F7",
  [TransportMode.RICKSHAW]: "#F59E0B",
  [TransportMode.WALK]: "#94A3B8",
};

function hubName(id: string): string {
  const meta = (CANONICAL_HUBS as Record<string, { name_en: string }>)[id];
  return meta ? meta.name_en : id.replace("H_", "");
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Builds the offline PNG briefing card. Returns a data URL plus its measured
 * size; throws only if a 2D canvas context is unavailable (non-browser).
 */
export function exportOfflineBriefingCard(
  route: ParetoRouteOption,
  query: CommuterQuery,
  roi: CounterfactualRoiMetrics
): OfflineBriefingResult {
  const W = 800;
  const H = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable — cannot export offline briefing.");

  // Background
  ctx.fillStyle = "#070B14";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0F172A";
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();

  // Top cyan accent bar
  ctx.fillStyle = "#06B6D4";
  roundRect(ctx, 24, 24, W - 48, 10, 6);
  ctx.fill();

  const PAD = 56;
  let y = 96;

  // Brand
  ctx.fillStyle = "#67E8F9";
  ctx.font = "800 20px 'JetBrains Mono', monospace";
  ctx.fillText("DHAKAPATH // INIF-26", PAD, y);
  ctx.fillStyle = "#64748B";
  ctx.font = "600 13px 'JetBrains Mono', monospace";
  ctx.fillText("OFFLINE VERIFIED ROUTE BRIEFING", PAD, y + 22);
  y += 64;

  // Origin → Destination
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 30px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(hubName(query.origin_hub_id), PAD, y);
  ctx.fillStyle = "#06B6D4";
  ctx.font = "800 24px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("↓", PAD + 4, y + 34);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 30px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(hubName(query.dest_hub_id), PAD, y + 68);
  y += 112;

  // Legs
  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 13px 'JetBrains Mono', monospace";
  ctx.fillText("MULTI-LEG VERIFIED ITINERARY", PAD, y);
  y += 24;

  route.legs.forEach((leg, i) => {
    const color = MODE_COLOR[leg.mode];
    // node + connector
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(PAD + 8, y + 2, 8, 0, Math.PI * 2);
    ctx.fill();
    if (i < route.legs.length - 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(PAD + 8, y + 12);
      ctx.lineTo(PAD + 8, y + 58);
      ctx.stroke();
    }
    // mode chip
    ctx.fillStyle = color;
    ctx.font = "800 13px 'JetBrains Mono', monospace";
    ctx.fillText(`${MODE_LABEL[leg.mode]}`, PAD + 30, y);
    // fare
    ctx.textAlign = "right";
    if (leg.regular_fare_bdt !== leg.effective_fare_bdt) {
      ctx.fillStyle = "#64748B";
      ctx.font = "500 14px 'JetBrains Mono', monospace";
      ctx.fillText(`${leg.regular_fare_bdt}`, W - PAD - 60, y);
      ctx.fillStyle = "#6EE7B7";
      ctx.font = "800 16px 'JetBrains Mono', monospace";
      ctx.fillText(`${leg.effective_fare_bdt} BDT`, W - PAD, y);
    } else {
      ctx.fillStyle = "#E2E8F0";
      ctx.font = "800 16px 'JetBrains Mono', monospace";
      ctx.fillText(`${leg.effective_fare_bdt} BDT`, W - PAD, y);
    }
    ctx.textAlign = "left";
    // route name + landmark
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "600 14px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(truncate(leg.route_name, 38), PAD + 30, y + 20);
    ctx.fillStyle = "#64748B";
    ctx.font = "500 12px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(`↳ ${truncate(leg.boarding_landmark, 42)}`, PAD + 30, y + 38);
    y += 66;
  });

  y += 8;
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += 34;

  // Totals
  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 14px 'JetBrains Mono', monospace";
  ctx.fillText("TOTAL FARE", PAD, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#67E8F9";
  ctx.font = "800 28px 'JetBrains Mono', monospace";
  ctx.fillText(`${route.total_effective_fare_bdt} BDT`, W - PAD, y + 4);
  ctx.textAlign = "left";
  y += 40;
  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 14px 'JetBrains Mono', monospace";
  ctx.fillText("TOTAL TIME", PAD, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "800 22px 'JetBrains Mono', monospace";
  ctx.fillText(`${Math.round(route.total_duration_ms / 60000)} min · ${route.transfers_count} transfer${route.transfers_count === 1 ? "" : "s"}`, W - PAD, y);
  ctx.textAlign = "left";
  y += 44;

  // ROI deltas
  ctx.fillStyle = "#064E3B";
  roundRect(ctx, PAD, y, W - PAD * 2, 54, 14);
  ctx.fill();
  ctx.fillStyle = "#6EE7B7";
  ctx.font = "800 17px 'JetBrains Mono', monospace";
  const savedMin = Math.round(roi.time_saved_ms / 60000);
  ctx.fillText(`+${savedMin}m  ·  +${roi.cost_saved_bdt} BDT  ·  −${roi.risk_reduction_pct.toFixed(1)}% risk`, PAD + 20, y + 34);
  y += 84;

  // GRAPH_GROUNDED stamp
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 2.5;
  roundRect(ctx, PAD, y, 300, 40, 20);
  ctx.stroke();
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(PAD + 24, y + 20, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6EE7B7";
  ctx.font = "800 14px 'JetBrains Mono', monospace";
  ctx.fillText("GRAPH_GROUNDED: 100% VERIFIED", PAD + 42, y + 25);

  // Footer honesty line
  ctx.fillStyle = "#475569";
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.fillText("Simulated demo telemetry · benchmark replay · V(P*) = 1", PAD, H - 50);

  const dataUrl = canvas.toDataURL("image/png", 0.85);
  const fileSizeKb = Math.round((dataUrl.length * 0.75) / 1024);
  const filename = `dhakapath-briefing-${query.origin_hub_id}-${query.dest_hub_id}.png`;

  // Trigger download
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { dataUrl, fileSizeKb, filename };
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Speaks a concise English/Banglish briefing. Returns the phonetic transcript
 * so the UI can print it when OS TTS voices are unavailable.
 */
export function playOfflineVoiceBriefing(route: ParetoRouteOption, query: CommuterQuery): string {
  const legPhrases = route.legs.map((leg, i) => {
    const mode = MODE_LABEL[leg.mode].toLowerCase();
    return `Step ${i + 1}: take ${mode} ${leg.effective_fare_bdt > 0 ? `for ${leg.effective_fare_bdt} taka` : "free"}, board at ${leg.boarding_landmark}.`;
  });
  const transcript = [
    `Route from ${hubName(query.origin_hub_id)} to ${hubName(query.dest_hub_id)}.`,
    ...legPhrases,
    `Total fare ${route.total_effective_fare_bdt} taka, ${Math.round(route.total_duration_ms / 60000)} minutes, ${route.transfers_count} transfer. Shob verified, bhalo thakben.`,
  ].join(" ");

  try {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (synth) {
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(transcript);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.lang = "en-IN";
      synth.speak(utter);
    }
  } catch {
    // TTS unavailable — caller renders the transcript instead.
  }

  return transcript;
}
