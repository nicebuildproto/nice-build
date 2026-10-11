"use client"

import { taperedPoints, type Point } from "@/lib/flashing/geometry"
import { useState, type RefObject } from "react"
import { TaperLines } from "./TaperStep"
import { Viewport, type ViewportControls, type ViewportInset } from "./Viewport"

export function AlignStep({
  points,
  taperEnabled,
  lengths,
  anchor,
  onAnchorChange,
  showGrid,
  controlsRef,
  onPanModeChange,
  fitInset,
}: {
  points: Point[]
  taperEnabled: boolean
  lengths: (number | null)[]
  anchor: number
  onAnchorChange: (index: number | null) => void
  showGrid: boolean
  controlsRef?: RefObject<ViewportControls | null>
  onPanModeChange?: (on: boolean) => void
  fitInset?: ViewportInset
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const taper = taperEnabled ? taperedPoints(points, lengths, anchor) : null

  return (
    <Viewport
      fitPoints={taper ? [...points, ...taper] : points}
      fitKey="align"
      showGrid={showGrid}
      controlsRef={controlsRef}
      onPanModeChange={onPanModeChange}
      fitInset={fitInset}
    >
      {(api) => {
        const screen = points.map(api.toScreen)
        const taperScreen = taper ? taper.map(api.toScreen) : null
        const anchorPoint = screen[anchor]

        const svg = (
          <g>
            <TaperLines base={screen} taper={taperScreen} />
            {taperEnabled
              ? screen.map((point, index) => {
                  const isAnchor = index === anchor
                  const isHovered = hovered === index
                  return (
                    <g key={`target-${index}`}>
                      {isAnchor ? (
                        <rect
                          x={point.x - 6}
                          y={point.y - 6}
                          width={12}
                          height={12}
                          rx={2}
                          fill="var(--nb-primary)"
                          className="pointer-events-none"
                        />
                      ) : (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isHovered ? 6 : 4.5}
                          fill="var(--background)"
                          stroke={isHovered ? "var(--nb-primary)" : "var(--nb-secondary)"}
                          strokeWidth={1.5}
                          className="pointer-events-none"
                        />
                      )}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={api.coarse ? 24 : 16}
                        fill="transparent"
                        style={{ cursor: "pointer", pointerEvents: api.panning ? "none" : "all" }}
                        onPointerEnter={() => setHovered(index)}
                        onPointerLeave={() => setHovered(null)}
                        onPointerDown={(event) => {
                          event.stopPropagation()
                          onAnchorChange(index)
                        }}
                      />
                    </g>
                  )
                })
              : null}
          </g>
        )

        const overlay =
          taperEnabled && anchorPoint ? (
            <span
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-full bg-primary px-2.5 py-0.5 text-xs whitespace-nowrap text-primary-foreground"
              style={{ left: anchorPoint.x, top: anchorPoint.y - 14 }}
            >
              Square edge
            </span>
          ) : null

        return { svg, overlay }
      }}
    </Viewport>
  )
}
