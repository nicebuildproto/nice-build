"use client"

import { formatValue } from "@/lib/sankey/layout"
import type { SankeyLayout, StyleSettings } from "@/lib/sankey/types"
import { cn } from "@/lib/utils"

export function SankeySvg({
  layout,
  style,
  selectedNode,
  selectedLink,
  hoveredLink,
  nodeColors,
  flowColors,
  zoom,
  pan,
  onSelectNode,
  onSelectLink,
  onHoverLink,
  onNodePointerDown,
  svgRef,
  className,
}: {
  layout: SankeyLayout
  style: StyleSettings
  selectedNode: string | null
  selectedLink: string | null
  hoveredLink: string | null
  nodeColors: Record<string, string>
  flowColors: Record<string, string>
  zoom: number
  pan: { x: number; y: number }
  onSelectNode: (id: string | null) => void
  onSelectLink: (id: string | null) => void
  onHoverLink: (id: string | null) => void
  onNodePointerDown: (id: string, event: React.PointerEvent) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  className?: string
}) {
  const viewW = layout.width / zoom
  const viewH = layout.height / zoom
  const viewX = (layout.width - viewW) / 2 - pan.x / zoom
  const viewY = (layout.height - viewH) / 2 - pan.y / zoom

  return (
    <svg
      ref={svgRef}
      className={cn("h-full w-full touch-none", className)}
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      role="img"
      aria-label="Sankey diagram"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onSelectNode(null)
          onSelectLink(null)
        }
      }}
    >
      <rect
        x={viewX}
        y={viewY}
        width={viewW}
        height={viewH}
        fill={style.background}
        onPointerDown={() => {
          onSelectNode(null)
          onSelectLink(null)
        }}
      />

      {layout.links.map((link) => (
        <path
          key={link.id}
          d={link.path}
          fill={flowColors[link.id] ?? style.flowColor}
          fillOpacity={hoveredLink === link.id || selectedLink === link.id ? Math.min(1, style.flowOpacity + 0.16) : style.flowOpacity}
          className="cursor-pointer transition-[fill-opacity] duration-150"
          stroke={selectedLink === link.id ? style.labelColor : "transparent"}
          strokeWidth={selectedLink === link.id ? 1.5 / zoom : 0}
          onPointerDown={(event) => {
            event.stopPropagation()
            onSelectNode(null)
            onSelectLink(link.id)
          }}
          onPointerEnter={() => onHoverLink(link.id)}
          onPointerLeave={() => onHoverLink(null)}
        >
          <title>{`${link.source} → ${link.target}: ${formatValue(link.value)}`}</title>
        </path>
      ))}

      {layout.nodes.map((node) => {
        const selected = selectedNode === node.id
        const labelX =
          style.labelPosition === "inside"
            ? node.x + node.width / 2
            : node.layer === 0
              ? node.x - 10
              : node.x + node.width + 10
        const anchor =
          style.labelPosition === "inside" ? "middle" : node.layer === 0 ? "end" : "start"

        return (
          <g
            key={node.id}
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(event) => {
              onSelectLink(null)
              onNodePointerDown(node.id, event)
            }}
          >
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={3}
              fill={nodeColors[node.id] ?? style.nodeColor}
              stroke={selected ? style.labelColor : "transparent"}
              strokeWidth={selected ? 2 / zoom : 0}
            />
            {style.showLabels ? (
              <text
                x={labelX}
                y={node.y + node.height / 2}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill={style.labelColor}
                fontSize={style.labelSize}
                fontWeight={style.labelWeight}
                className="select-none"
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                {node.name}
                {style.showValues ? (
                  <tspan
                    fill={style.labelColor}
                    fillOpacity={0.62}
                    fontSize={style.valueSize}
                    fontWeight={400}
                  >
                    {`  ${formatValue(node.value)}`}
                  </tspan>
                ) : null}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
