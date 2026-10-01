"use client"

import { Button } from "@/components/ui/button"
import { taperedPoints, type Point } from "@/lib/flashing/geometry"
import { useState } from "react"
import { ToolbarGroup } from "./IconButton"
import { TaperLegend, TaperLines } from "./TaperStep"
import { Viewport } from "./Viewport"

export function AlignStep({
  points,
  taperEnabled,
  lengths,
  anchor,
  isOverride,
  onAnchorChange,
  showGrid,
  onToggleGrid,
}: {
  points: Point[]
  taperEnabled: boolean
  lengths: (number | null)[]
  anchor: number
  isOverride: boolean
  onAnchorChange: (index: number | null) => void
  showGrid: boolean
  onToggleGrid: () => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const taper = taperEnabled ? taperedPoints(points, lengths, anchor) : null

  return (
    <Viewport
      fitPoints={taper ? [...points, ...taper] : points}
      fitKey="align"
      showGrid={showGrid}
      onToggleGrid={onToggleGrid}
      topLeft={
        <ToolbarGroup className="max-w-xs flex-col items-start gap-2 px-3.5 py-3">
          {taperEnabled ? (
            <>
              <span className="text-sm text-[var(--nb-primary)]">
                {isOverride ? "Square edge set by you" : "Square edge found automatically"}
              </span>
              <span className="text-xs text-[var(--nb-secondary)]">
                The marked point keeps a square edge; the taper runs away from it. Click another
                point to change it.
              </span>
              {isOverride ? (
                <Button variant="outline" size="xs" onClick={() => onAnchorChange(null)}>
                  Use automatic
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <span className="text-sm text-[var(--nb-primary)]">Nothing to align</span>
              <span className="text-xs text-[var(--nb-secondary)]">
                Without a taper, every edge is already square. You can continue.
              </span>
            </>
          )}
        </ToolbarGroup>
      }
      bottomLeft={taperEnabled ? <TaperLegend /> : null}
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
                          fill="white"
                          stroke={isHovered ? "var(--nb-primary)" : "#9CA3AF"}
                          strokeWidth={1.5}
                          className="pointer-events-none transition-all"
                        />
                      )}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={14}
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
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-full bg-[var(--nb-primary)] px-2 py-0.5 text-[11px] whitespace-nowrap text-white"
              style={{ left: anchorPoint.x, top: anchorPoint.y - 12 }}
            >
              Square edge
            </span>
          ) : null

        return { svg, overlay }
      }}
    </Viewport>
  )
}
