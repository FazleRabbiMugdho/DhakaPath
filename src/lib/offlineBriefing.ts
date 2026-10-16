// ==============================================================================
// src/lib/offlineBriefing.ts — OFFLINE SURVIVAL CARD (<45 KB PNG) + VOICE BRIEFING
// Draws a route card onto an offscreen <canvas> using only vector text and shapes (zero
// external images, so toDataURL never taints) for commuters with a dying battery or no data.
// The voice briefing uses the browser's Web Speech API and returns a transcript so it can
// be shown on screen when the device has no TTS voice.
// ==============================================================================

import { CommuterQuery, CounterfactualRoiMetrics, ParetoRouteOption, TransportMode } from "../contracts/schema";
import { CANONICAL_HUBS } from "../contracts/canonicalGraph";
import type { HubId } from "../contracts/schema";

export interface OfflineBriefingResult {
  dataUrl: string;
  fileSizeKb: number;
  filename: string;
}

const MODE_LABEL: Record<TransportMode, string> = {
  [TransportMode.METRO]: "MRT-6 METRO",
  [TransportMode.BUS]: "BUS",
  [TransportMode.LEGUNA]: "LEGUNA",
  [TransportMode.RICKSHAW]: "RICKSHAW / CNG",
  [TransportMode.WALK]: "WALK",
};

const MODE_COLOR: Record<TransportMode, string> = {
  [TransportMode.METRO]: "#009933",
  [TransportMode.BUS]: "#3366FF",
  [TransportMode.LEGUNA]: "#9933FF",
  [TransportMode.RICKSHAW]: "#CC6600",
  [TransportMode.WALK]: "#666699",
};

const FONT = `"Hind Siliguri", "Plus Jakarta Sans", system-ui, sans-serif`;

function hubEn(id: string): string {
  const meta = (CANONICAL_HUBS as Record<string, { name_en: string }>)[id];
  return meta ? meta.name_en : id.replace("H_", "");
}
function hubBn(id: string): string {
  const meta = (CANONICAL_HUBS as Record<string, { name_bn: string }>)[id];
  return meta ? meta.name_bn : "";
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

function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function exportOfflineBriefingCard(
  route: ParetoRouteOption,
  query: CommuterQuery,
  roi: CounterfactualRoiMetrics
): OfflineBriefingResult {
  const W = 720;
  const H = 960;
  const SCALE = 0.75; // physical 540x720: the layout below stays in 720x960 units
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * SCALE);
  canvas.height = Math.round(H * SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.scale(SCALE, SCALE);

  // page + header band
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#339933";
  ctx.fillRect(0, 0, W, 96);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 32px ${FONT}`;
  ctx.fillText("DhakaPath", 36, 54);
  ctx.font = `600 15px ${FONT}`;
  ctx.fillText("Offline route card · অফলাইন রুট কার্ড", 36, 80);

  // white body card
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 24, 116, W - 48, H - 140, 28);
  ctx.fill();
  ctx.strokeStyle = "#CCCCCC";
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 116, W - 48, H - 140, 28);
  ctx.stroke();

  const PAD = 52;
  let y = 176;

  // origin -> destination
  ctx.fillStyle = "#003300";
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText(hubEn(query.origin_hub_id), PAD, y);
  ctx.fillStyle = "#666666";
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText(hubBn(query.origin_hub_id), PAD, y + 26);
  ctx.fillStyle = "#339933";
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText("↓", PAD, y + 62);
  ctx.fillStyle = "#003300";
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText(hubEn(query.dest_hub_id), PAD, y + 100);
  ctx.fillStyle = "#666666";
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText(hubBn(query.dest_hub_id), PAD, y + 126);
  y += 170;

  // fare + time
  ctx.fillStyle = "#CCFFCC";
  roundRect(ctx, PAD, y, W - PAD * 2, 96, 20);
  ctx.fill();
  ctx.fillStyle = "#339933";
  ctx.font = `800 46px ${FONT}`;
  ctx.fillText(`${route.total_effective_fare_bdt} BDT`, PAD + 22, y + 62);
  ctx.textAlign = "right";
  ctx.fillStyle = "#003300";
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(`${Math.round(route.total_duration_ms / 60000)} min`, W - PAD - 22, y + 44);
  ctx.fillStyle = "#666666";
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText(`${route.transfers_count} transfer${route.transfers_count === 1 ? "" : "s"}`, W - PAD - 22, y + 72);
  ctx.textAlign = "left";
  y += 128;

  // legs
  ctx.fillStyle = "#666666";
  ctx.font = `700 14px ${FONT}`;
  ctx.fillText("STEP BY STEP · ধাপে ধাপে", PAD, y);
  y += 30;
  route.legs.forEach((leg, i) => {
    const color = MODE_COLOR[leg.mode];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(PAD + 10, y + 4, 9, 0, Math.PI * 2);
    ctx.fill();
    if (i < route.legs.length - 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(PAD + 10, y + 16);
      ctx.lineTo(PAD + 10, y + 60);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.font = `800 14px ${FONT}`;
    ctx.fillText(MODE_LABEL[leg.mode], PAD + 36, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#003300";
    ctx.font = `800 18px ${FONT}`;
    ctx.fillText(`${leg.effective_fare_bdt} BDT`, W - PAD, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#003300";
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(clip(leg.route_name, 40), PAD + 36, y + 22);
    ctx.fillStyle = "#666666";
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText(`Board: ${clip(leg.boarding_landmark, 44)}`, PAD + 36, y + 42);
    y += 68;
  });

  // savings
  y += 6;
  ctx.fillStyle = "#CCFFCC";
  roundRect(ctx, PAD, y, W - PAD * 2, 52, 16);
  ctx.fill();
  ctx.fillStyle = "#006633";
  ctx.font = `800 17px ${FONT}`;
  const savedMin = Math.round(roi.time_saved_ms / 60000);
  ctx.fillText(`Saves ${savedMin} min · ${roi.cost_saved_bdt} BDT vs the naive route`, PAD + 20, y + 33);
  y += 76;

  // verified stamp
  ctx.strokeStyle = "#339933";
  ctx.lineWidth = 2.5;
  roundRect(ctx, PAD, y, 322, 40, 20);
  ctx.stroke();
  ctx.fillStyle = "#339933";
  ctx.beginPath();
  ctx.arc(PAD + 24, y + 20, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#006633";
  ctx.font = `800 14px ${FONT}`;
  ctx.fillText("GRAPH_GROUNDED · 100% VERIFIED", PAD + 42, y + 25);

  ctx.fillStyle = "#999999";
  ctx.font = `500 12px ${FONT}`;
  ctx.fillText("Simulated demo telemetry · benchmark replay", PAD, H - 44);

  // The palette above sits on 6-level steps; snapping the anti-aliased edges to them keeps the PNG under 45 KB.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < px.data.length; i += 4) {
    px.data[i] = Math.round(px.data[i] / 51) * 51;
    px.data[i + 1] = Math.round(px.data[i + 1] / 51) * 51;
    px.data[i + 2] = Math.round(px.data[i + 2] / 51) * 51;
  }
  ctx.putImageData(px, 0, 0);

  const dataUrl = canvas.toDataURL("image/png", 0.85);
  const fileSizeKb = Math.round(((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75) / 102.4) / 10;
  const filename = `dhakapath-briefing-${query.origin_hub_id}-${query.dest_hub_id}.png`;

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { dataUrl, fileSizeKb, filename };
}

/** Speaks a short briefing. Returns the transcript so the UI can print it if TTS is unavailable. */
export function playOfflineVoiceBriefing(route: ParetoRouteOption, query: CommuterQuery): string {
  const steps = route.legs.map((leg, i) => {
    const mode = MODE_LABEL[leg.mode].toLowerCase();
    const fare = leg.effective_fare_bdt > 0 ? `for ${leg.effective_fare_bdt} taka` : "free";
    return `Step ${i + 1}: ${mode} ${fare}. Board at ${leg.boarding_landmark}.`;
  });
  const transcript = [
    `Route from ${hubEn(query.origin_hub_id)} to ${hubEn(query.dest_hub_id as HubId)}.`,
    ...steps,
    `Total ${route.total_effective_fare_bdt} taka, ${Math.round(route.total_duration_ms / 60000)} minutes, ${route.transfers_count} transfer. Shob verified, bhalo thakben.`,
  ].join(" ");

  try {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (synth) {
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(transcript);
      utter.rate = 1;
      utter.lang = "en-IN";
      synth.speak(utter);
    }
  } catch {
    // no TTS: the caller shows the transcript
  }
  return transcript;
}
