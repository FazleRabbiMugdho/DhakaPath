"use client";

/**
 * CardMotion — Reusable entrance + hover/focus motion for cards.
 *
 * Features:
 * - Entrance: fade-in + rise 10px, staggered by 120ms per card in group
 * - Runs once per card (not on scroll back)
 * - Hover: lift ~3px, deepen shadow, strengthen border (280ms)
 * - Focus: clear focus ring for keyboard navigation (280ms)
 * - Respects prefers-reduced-motion (disables transforms, keeps opacity)
 * - No layout shift, no bounce, consistent with brand palette
 *
 * Usage:
 *   <CardMotion index={0} group="routes" className="...">
 *     <Card>...</Card>
 *   </CardMotion>
 *
 *   Or use the hook directly for custom elements:
 *   const { ref, style, className } = useCardMotion({ index, group, interactive: true });
 * }
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// Default timing constants — tuned for professional, premium feel
const ENTRANCE_DURATION = 1000; // ms — cinematic, unhurried entrance
const ENTRANCE_STAGGER = 120;   // ms per card — generous stagger, especially for 6+ card groups
const HOVER_DURATION = 280;     // ms — weighty, deliberate hover with presence
const FOCUS_DURATION = 280;     // ms — consistent focus

// Easing curves for premium feel
const ENTRANCE_EASING = "cubic-bezier(0.16, 1, 0.3, 1)"; // smooth, natural ease-out (Material's "standard")
const HOVER_EASING = "cubic-bezier(0.2, 0, 0, 1)";       // responsive, crisp ease-out (Material's "decelerated")
const TRANSFORM_DISTANCE = 10; // px — subtle, premium rise distance

// CSS variable names for consistent timing
const CSS_VARS = {
  entranceDuration: "--card-entrance-duration",
  staggerDelay: "--card-stagger-delay",
  hoverDuration: "--card-hover-duration",
  focusDuration: "--card-focus-duration",
} as const;

export interface CardMotionProps {
  children: React.ReactNode;
  /** Index within the group (0-based) for stagger calculation */
  index: number;
  /** Group name to coordinate stagger across siblings */
  group?: string;
  /** Whether the card is interactive (hover/focus lift) */
  interactive?: boolean;
  /** Additional className */
  className?: string;
  /** Custom delay override (ms) - useful for non-sequential groups */
  delayOverride?: number;
  /** Tag override */
  as?: React.ElementType;
}

/**
 * CardMotion - Wrapper component that adds entrance + hover/focus motion
 */
export function CardMotion({
  children,
  index,
  group = "default",
  interactive = false,
  className,
  delayOverride,
  as: Tag = "div",
}: CardMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Reduced motion detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // IntersectionObserver for entrance animation
  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger entrance animation
            requestAnimationFrame(() => {
              setIsVisible(true);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Calculate stagger delay
  const staggerDelay = delayOverride ?? (group ? index * ENTRANCE_STAGGER : 0);

  // Build CSS custom properties for timing
  const style: React.CSSProperties = {
    [CSS_VARS.entranceDuration]: `${ENTRANCE_DURATION}ms`,
    [CSS_VARS.staggerDelay]: `${staggerDelay}ms`,
    [CSS_VARS.hoverDuration]: `${HOVER_DURATION}ms`,
    [CSS_VARS.focusDuration]: `${FOCUS_DURATION}ms`,
    // Initial state for entrance (opacity handled by CSS)
    opacity: isVisible || reducedMotion ? 1 : 0,
    transform: isVisible || reducedMotion ? "none" : `translateY(${TRANSFORM_DISTANCE}px)`,
    transition: `opacity ${ENTRANCE_DURATION}ms ${ENTRANCE_EASING} ${staggerDelay}ms, transform ${ENTRANCE_DURATION}ms ${ENTRANCE_EASING} ${staggerDelay}ms`,
  } as React.CSSProperties;

  // Add hover/focus transitions for interactive cards
  if (interactive && !reducedMotion) {
    style.transition = [
      style.transition,
      `transform ${HOVER_DURATION}ms ${HOVER_EASING}`,
      `box-shadow ${HOVER_DURATION}ms ${HOVER_EASING}`,
      `border-color ${HOVER_DURATION}ms ${HOVER_EASING}`,
    ].join(", ");
  }

  const handleMouseEnter = useCallback(() => {
    if (interactive && !reducedMotion) setIsHovered(true);
  }, [interactive, reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (interactive && !reducedMotion) setIsHovered(false);
  }, [interactive, reducedMotion]);

  const handleFocus = useCallback(() => {
    if (interactive) setIsFocused(true);
  }, [interactive]);

  const handleBlur = useCallback(() => {
    if (interactive) setIsFocused(false);
  }, [interactive]);

  // Compute hover/focus transform
  const hoverTransform = interactive && isHovered && !reducedMotion ? `translateY(-${TRANSFORM_DISTANCE / 3}px)` : "none";
  const focusRing = interactive && isFocused ? "ring-2 ring-brand ring-offset-2" : "";

  return (
    <Tag
      ref={ref}
      className={cn(
        "relative",
        interactive && "cursor-pointer",
        className
      )}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div
        className={cn(
          "transition-transform transition-shadow transition-colors",
          interactive && `duration-${Math.round(HOVER_DURATION / 10) * 10} ease-out`,
          isHovered && `translate-y-[-${Math.round(TRANSFORM_DISTANCE / 3)}px] shadow-lg border-brand/40`,
          isFocused && "ring-2 ring-brand ring-offset-2",
          focusRing
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

/**
 * Hook version for custom implementations
 */
export function useCardMotion(options: {
  index: number;
  group?: string;
  interactive?: boolean;
  delayOverride?: number;
}) {
  const { index, group = "default", interactive = false, delayOverride } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => setIsVisible(true));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const staggerDelay = delayOverride ?? (group ? index * ENTRANCE_STAGGER : 0);

  // Build CSS custom properties for timing
  const style: React.CSSProperties = {
    [CSS_VARS.entranceDuration]: `${ENTRANCE_DURATION}ms`,
    [CSS_VARS.staggerDelay]: `${staggerDelay}ms`,
    [CSS_VARS.hoverDuration]: `${HOVER_DURATION}ms`,
    [CSS_VARS.focusDuration]: `${FOCUS_DURATION}ms`,
    opacity: isVisible || reducedMotion ? 1 : 0,
    transform: isVisible || reducedMotion ? "none" : `translateY(${TRANSFORM_DISTANCE}px)`,
    transition: `opacity ${ENTRANCE_DURATION}ms ${ENTRANCE_EASING} ${staggerDelay}ms, transform ${ENTRANCE_DURATION}ms ${ENTRANCE_EASING} ${staggerDelay}ms`,
  } as React.CSSProperties;

  const handleMouseEnter = () => interactive && !reducedMotion && setIsHovered(true);
  const handleMouseLeave = () => interactive && !reducedMotion && setIsHovered(false);
  const handleFocus = () => interactive && setIsFocused(true);
  const handleBlur = () => interactive && setIsFocused(false);

  const className = cn(
    "transition-transform transition-shadow transition-colors",
    interactive && `duration-${Math.round(HOVER_DURATION / 10) * 10}`,
    interactive && "ease-out",
    isHovered && `translate-y-[-${Math.round(TRANSFORM_DISTANCE / 3)}px] shadow-lg border-brand/40`,
    isFocused && "ring-2 ring-brand ring-offset-2"
  );

  return {
    ref,
    style,
    className,
    isVisible,
    isHovered,
    isFocused,
    reducedMotion,
    onMouseEnter: () => !reducedMotion && setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };
}

/**
 * StaggeredGroup - Wrapper that coordinates stagger for multiple CardMotion children
 * Use when you have a dynamic list and want to reset stagger on re-render
 */
export function StaggeredGroup({
  children,
  group = "default",
  className,
}: {
  children: React.ReactNode;
  group?: string;
  className?: string;
}) {
  // Count children to provide index to each
  const childArray = React.Children.toArray(children);
  const childrenWithIndex = childArray.map((child, index) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<any>, {
          index,
          group,
        } as any)
      : child
  );

  return <div className={cn("space-y-4", className)}>{childrenWithIndex}</div>;
}