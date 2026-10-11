import type { CSSProperties } from "react"

/** Subtle lift for the few floating controls (tool pill, hint, header). The sidebar is flat on purpose. */
export const flashingShadow = "shadow-[0_6px_16px_-8px_rgba(24,24,27,0.18)]"

/** Floating surface over the canvas. Theme tokens only; the light scope is pinned by `flashingInk`. */
export const flashingFloat = "border border-border bg-card text-card-foreground shadow-[0_6px_16px_-8px_rgba(24,24,27,0.18)]"

/** Caption style: 12px, the smallest size anywhere in the designer. */
export const flashingLabel = "text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase"

/** Layers, defined once. Canvas < overlays < chrome < sheets < popovers < modals. */
export const layer = {
  canvas: "z-0",
  overlay: "z-10",
  chrome: "z-20",
  sheet: "z-30",
  popover: "z-40",
  modal: "z-50",
} as const

/** Pins the light scheme for the drawing surface (dark ink on white), including when the site theme is dark. */
export const flashingInk = {
  "--nb-primary": "#18181b",
  "--nb-secondary": "#71717a",
  "--nb-accent": "#f4f4f5",
  "--background": "#ffffff",
  "--foreground": "#18181b",
  "--card": "#ffffff",
  "--card-foreground": "#18181b",
  "--popover": "#ffffff",
  "--popover-foreground": "#18181b",
  "--primary": "#18181b",
  "--primary-foreground": "#ffffff",
  "--secondary": "#f4f4f5",
  "--secondary-foreground": "#18181b",
  "--border": "rgba(24,24,27,0.1)",
  "--input": "rgba(24,24,27,0.16)",
  "--ring": "rgba(24,24,27,0.4)",
  "--muted": "#f4f4f5",
  "--muted-foreground": "#667085",
  "--destructive": "#b42318",
} as CSSProperties

/** Motion: transform and opacity only, 150 to 250ms, off for reduced motion. */
export const flashingMotion = "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"

export const SIDEBAR_WIDE = 320
export const SIDEBAR_NARROW = 288
export const SIDEBAR_RAIL = 56
export const RAIL_WIDTH = 272
export const STAGE_INSET = 16
/** Side-by-side chrome from this width. Below it the touch layout takes over. */
export const FLASHING_DOCK = 1024
