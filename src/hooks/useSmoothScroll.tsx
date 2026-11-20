"use client";

/**
 * useSmoothScroll — Momentum-style smooth scrolling for mouse wheel.
 *
 * Features:
 * - Only activates on discrete mouse-wheel input (not trackpad/touch)
 * - Respects `prefers-reduced-motion: reduce`
 * - Ignores nested scroll containers (maps, dialogs, tables, etc.)
 * - Short, natural-feeling glide with configurable deceleration
 * - Does not hijack scroll, snap to sections, or interfere with keyboard/anchors
 *
 * Usage: wrap the app/page with <SmoothScrollProvider> or call useSmoothScroll() in a client component.
 */

import { useEffect, useRef, useCallback } from "react";

interface SmoothScrollOptions {
  /** Deceleration rate (0-1). Lower = longer glide. Default: 0.92 */
  deceleration?: number;
  /** Minimum velocity to keep gliding (px/frame). Default: 0.5 */
  minVelocity?: number;
  /** Maximum velocity cap (px/frame). Default: 40 */
  maxVelocity?: number;
  /** Frame rate assumption for velocity calc. Default: 60 */
  frameRate?: number;
  /** Selector for nested scroll containers to ignore. */
  ignoreSelectors?: string[];
}

const DEFAULT_OPTIONS: Required<SmoothScrollOptions> = {
  deceleration: 0.95,
  minVelocity: 0.5,
  maxVelocity: 35,
  frameRate: 60,
  ignoreSelectors: [
    // Map containers
    "[data-leaflet-container]",
    ".leaflet-container",
    // Dialogs, drawers, overlays
    "[role='dialog']",
    "[data-radix-dialog]",
    ".fixed.inset-0",
    // Chat/assistant panels
    "[data-assistant-dock]",
    ".assistant-dock",
    // Tables with overflow
    ".overflow-auto",
    ".overflow-y-auto",
    ".overflow-x-auto",
    // Map panels
    "[data-map-panel]",
    ".map-panel",
    // Custom scroll areas
    "[data-smooth-scroll-ignore]",
  ],
};

/**
 * Detects if a wheel event comes from a discrete mouse wheel (vs trackpad/touch).
 * Trackpads typically have event.deltaMode === 0 with small pixel deltas,
 * while mice have larger discrete steps. We also check for high-frequency
 * events which indicate trackpad.
 */
function isMouseWheelEvent(event: WheelEvent): boolean {
  // Touchpads/trackpads often fire many events with small deltas
  // Mice fire fewer events with larger, more consistent deltas
  const isDiscrete = Math.abs(event.deltaY) >= 10;
  const isPrecise = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL;
  
  // Trackpad often has fractional deltas and high frequency
  const isLikelyTrackpad = 
    Math.abs(event.deltaY) < 10 && 
    event.deltaMode === WheelEvent.DOM_DELTA_PIXEL;
  
  return isDiscrete && isPrecise && !isLikelyTrackpad;
}

/**
 * Checks if the event target is inside an ignored scroll container.
 */
function isInIgnoredContainer(
  target: EventTarget | null,
  ignoreSelectors: string[]
): boolean {
  if (!(target instanceof Element)) return false;
  
  // Check if target or any parent matches ignore selectors
  let element: Element | null = target;
  while (element) {
    for (const selector of ignoreSelectors) {
      try {
        if (element.matches(selector)) return true;
      } catch {
        // Invalid selector, skip
      }
    }
    // Also check for overflow scrolling on the element itself
    const style = getComputedStyle(element);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      element.scrollHeight > element.clientHeight
    ) {
      // This is a scroll container - but we only ignore if it's not the main document
      if (element !== document.documentElement && element !== document.body) {
        return true;
      }
    }
    element = element.parentElement;
  }
  return false;
}

/**
 * Custom hook for momentum scrolling.
 * Call this in a client component that mounts at the root of your scrollable content.
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const reducedMotionRef = useRef(false);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;
    
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const animate = useCallback(() => {
    if (Math.abs(velocityRef.current) < opts.minVelocity) {
      velocityRef.current = 0;
      animationRef.current = null;
      return;
    }

    // Apply deceleration with subtle easing for natural feel
    velocityRef.current *= opts.deceleration;
    
    // Scroll with sub-pixel precision for smoothness
    window.scrollBy(0, velocityRef.current);
    
    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  }, [opts.deceleration, opts.minVelocity]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      // Skip if reduced motion is enabled
      if (reducedMotionRef.current) return;

      // Only handle discrete mouse wheel events
      if (!isMouseWheelEvent(event)) return;

      // Ignore if target is in a nested scroll container
      if (isInIgnoredContainer(event.target, opts.ignoreSelectors)) return;

      // Prevent default scroll behavior
      event.preventDefault();

      // Calculate velocity from delta
      const now = performance.now();
      const timeDiff = Math.max(1, now - lastTimeRef.current); // Avoid division by zero
      lastTimeRef.current = now;

      // Normalize delta to pixels - scale down for smoother, more controlled scroll
      let delta = event.deltaY * 0.6; // Scale down mouse wheel delta for gentler scroll
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 12; // Line height approximation (reduced from 16)
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        delta *= window.innerHeight * 0.5; // Reduced from 0.9
      }

      // Calculate velocity with smoothing factor for natural feel
      const frameTime = 1000 / opts.frameRate;
      const rawVelocity = (delta / timeDiff) * frameTime;
      
      // Smooth the velocity change (exponential moving average)
      const SMOOTHING_FACTOR = 0.25; // Slightly less smoothing for more responsive feel
      let velocity = velocityRef.current * (1 - SMOOTHING_FACTOR) + rawVelocity * SMOOTHING_FACTOR;

      // Clamp velocity
      velocity = Math.max(-opts.maxVelocity, Math.min(opts.maxVelocity, velocity));
      
      // If direction changed, dampen more gently
      if (lastDeltaRef.current * delta < 0) {
        velocity *= 0.5;
      }
      lastDeltaRef.current = delta;

      // Set new velocity
      velocityRef.current = velocity;

      // Start animation if not already running
      if (animationRef.current === null) {
        animationRef.current = requestAnimationFrame(animate);
      }
    },
    [animate, opts.frameRate, opts.maxVelocity, opts.ignoreSelectors]
  );

  useEffect(() => {
    if (reducedMotionRef.current) return;
    
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [handleWheel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
}

/**
 * Provider component that enables smooth scrolling for the page.
 * Place this at the root of your app or in a layout component.
 */
export function SmoothScrollProvider({
  children,
  options,
}: {
  children: React.ReactNode;
  options?: SmoothScrollOptions;
}) {
  useSmoothScroll(options);
  return <>{children}</>;
}