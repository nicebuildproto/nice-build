"use client"

import { layoutSankey } from "@/lib/sankey/layout"
import { validFlows } from "@/lib/sankey/parse"
import { sankeyExamples, type SankeyExample } from "@/lib/sankey/examples"
import { defaultStyle } from "@/lib/sankey/types"

export function ExampleCards({
  onLoad,
}: {
  onLoad: (example: SankeyExample) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      {sankeyExamples.map((example) => {
        const layout = layoutSankey(validFlows(example.rows), defaultStyle, {}, { width: 220, height: 92 })
        return (
          <button
            key={example.id}
            type="button"
            onClick={() => onLoad(example)}
            className="flex flex-col gap-2 rounded-xl bg-[var(--nb-accent)]/70 p-3 text-left transition-colors hover:bg-[var(--nb-accent)]"
          >
            <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="h-16 w-full" aria-hidden>
              <rect width={layout.width} height={layout.height} fill="#ffffff" />
              {layout.links.map((link) => (
                <path key={link.id} d={link.path} fill="#111111" fillOpacity={0.22} />
              ))}
              {layout.nodes.map((node) => (
                <rect
                  key={node.id}
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={2}
                  fill="#111111"
                />
              ))}
            </svg>
            <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
              {example.title}
            </span>
            <span className="text-[12px] leading-relaxed text-[var(--nb-secondary)]">
              {example.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
