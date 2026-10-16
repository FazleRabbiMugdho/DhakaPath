"use client";

// ==============================================================================
// src/shell/transitArt.tsx — TRACK 4 TRANSIT ICON REGISTRY
// Binds the Bangladesh transit sticker + landmark SVGs (public/icons/*.svg,
// die-cut from the source Pictures/) to transport modes and scene art so the
// map, ledger, and legend all speak one visual language.
// ==============================================================================

import React from "react";
import Image from "next/image";
import { TransportMode } from "@/contracts/schema";
import { cn } from "@/lib/utils";

export interface ModeVisual {
  readonly color: string; // Stroke + token color
  readonly strokeWidth: number; // SVG schematic edge weight (px)
  readonly dashArray: string; // "" = solid
  readonly label: string;
  readonly icon: string; // /icons/*.svg path
}

// 5 Transport Mode Visual Tokens (Stroke Geometry + Color) from Master Design §4.2
export const MODE_VISUALS: Readonly<Record<TransportMode, ModeVisual>> = {
  [TransportMode.METRO]: {
    color: "#22C55E",
    strokeWidth: 5,
    dashArray: "",
    label: "Metro MRT-6",
    icon: "/icons/mode-metro.svg",
  },
  [TransportMode.BUS]: {
    color: "#3B82F6",
    strokeWidth: 3.5,
    dashArray: "",
    label: "Bus",
    icon: "/icons/mode-bus.svg",
  },
  [TransportMode.LEGUNA]: {
    color: "#A855F7",
    strokeWidth: 3,
    dashArray: "7 3 1.5 3", // dash-dot
    label: "Leguna",
    icon: "/icons/mode-leguna.svg",
  },
  [TransportMode.RICKSHAW]: {
    color: "#F59E0B",
    strokeWidth: 3,
    dashArray: "5 4", // short dash
    label: "Rickshaw",
    icon: "/icons/mode-rickshaw.svg",
  },
  [TransportMode.WALK]: {
    color: "#94A3B8",
    strokeWidth: 2.5,
    dashArray: "0.5 4", // dotted
    label: "Walk-Bridge",
    icon: "/icons/mode-bicycle.svg",
  },
};

// Secondary connector stickers reused by the ride-share pool + telemetry chrome.
export const EXTRA_ICONS = {
  cng: "/icons/mode-cng.svg",
  minibus: "/icons/mode-minibus.svg",
  car: "/icons/mode-car.svg",
  motorcycle: "/icons/mode-motorcycle.svg",
} as const;

// Dhaka landmark silhouettes keyed to canonical hubs for map node badges.
export const HUB_LANDMARK: Readonly<Record<string, string>> = {
  H_UTTARA: "/icons/lm-metro-viaduct.svg",
  H_MIRPUR10: "/icons/lm-metro-viaduct.svg",
  H_AGARGAON: "/icons/lm-parliament.svg",
  H_MOHAKHALI: "/icons/lm-cityscape.svg",
  H_BADDA: "/icons/lm-cityscape.svg",
  H_BANASREE: "/icons/lm-river-boat.svg",
  H_MALIBAGH: "/icons/lm-cng.svg",
  H_FARMGATE: "/icons/lm-martyrs-memorial.svg",
  H_MOHAMMADPUR: "/icons/lm-banyan.svg",
  H_DHANMONDI: "/icons/lm-ahsan-manzil.svg",
  H_SCIENCELAB: "/icons/lm-curzon-hall.svg",
  H_SHAHBAGH: "/icons/lm-shaheed-minar.svg",
  H_MOTIJHEEL: "/icons/lm-motijheel-skyline.svg",
  H_GULISTAN: "/icons/lm-lalbagh-fort.svg",
  H_JATRABARI: "/icons/lm-mosque.svg",
};

// Duotone scene plates (Obsidian → cyan) used as atmospheric backing art.
export const SCENE_ART = {
  skylineHorizon: "/icons/scene-skyline-horizon.svg",
  modeCollage: "/icons/scene-mode-collage.svg",
  cityLayers: "/icons/scene-city-layers.svg",
  metroStrip: "/icons/scene-metro-strip.svg",
  streetStrip: "/icons/scene-street-strip.svg",
} as const;

interface TransitModeIconProps {
  mode: TransportMode;
  size?: number;
  className?: string;
  ringed?: boolean;
}

/**
 * Die-cut transport sticker inside a tactical chip — the base64 data URI is
 * embedded in each SVG, so a plain <Image> renders it with zero extra fetches.
 */
export function TransitModeIcon({ mode, size = 40, className, ringed = true }: TransitModeIconProps) {
  const v = MODE_VISUALS[mode];
  return (
    <span
      className={cn(
        "relative inline-grid place-items-center overflow-hidden rounded-xl bg-[#0B1220]",
        ringed && "border-[1.5px]",
        className
      )}
      style={{
        width: size,
        height: size,
        borderColor: ringed ? `${v.color}66` : undefined,
        boxShadow: ringed ? `inset 0 1px 0 0 rgba(255,255,255,0.08)` : undefined,
      }}
      title={v.label}
    >
      <Image
        src={v.icon}
        alt={v.label}
        width={size}
        height={size}
        className="h-[82%] w-[82%] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]"
        unoptimized
      />
    </span>
  );
}

interface SceneArtProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

/** Full-bleed duotone scene plate for atmospheric panels (object-cover). */
export function SceneArt({ src, alt, className, imgClassName, priority }: SceneArtProps) {
  return (
    <span className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        priority={priority}
        className={cn("object-cover", imgClassName)}
        unoptimized
      />
    </span>
  );
}
