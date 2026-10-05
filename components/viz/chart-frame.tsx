"use client"

import type { VizMeta } from "@/lib/viz/style"
import type { VizTheme } from "@/lib/viz/themes"
import { forwardRef, type ReactNode } from "react"

export const ChartFrame = forwardRef<
  SVGSVGElement,
  {
    width: number
    height: number
    theme: VizTheme
    meta: VizMeta
    children: ReactNode
    description?: string
  }
>(function ChartFrame({ width, height, theme, meta, children, description }, ref) {
  const title = meta.title.trim()
  const subtitle = meta.subtitle.trim()
  const source = meta.source.trim()
  const header = title || subtitle ? (title ? 28 : 0) + (subtitle ? 18 : 0) + 8 : 0
  const footer = source ? 22 : 0
  const total = height + header + footer

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${total}`}
      width="100%"
      role="img"
      aria-label={description || title || "Chart"}
      style={{ background: theme.background, maxHeight: 560 }}
    >
      <rect width={width} height={total} fill={theme.background} />
      {title ? (
        <text
          x={24}
          y={26}
          fill={theme.ink}
          fontSize={18}
          fontWeight={600}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {title}
        </text>
      ) : null}
      {subtitle ? (
        <text
          x={24}
          y={title ? 46 : 26}
          fill={theme.muted}
          fontSize={12}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {subtitle}
        </text>
      ) : null}
      <g transform={`translate(0 ${header})`}>{children}</g>
      {source ? (
        <text
          x={24}
          y={total - 10}
          fill={theme.muted}
          fontSize={11}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          Source: {source}
        </text>
      ) : null}
    </svg>
  )
})
