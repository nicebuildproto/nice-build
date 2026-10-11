"use client"

import { ToolStage, type StageStat, type StageTool, type StageViewControl } from "@/components/stage/ToolStage"
import { Button } from "@/components/ui/button"
import type { ReactNode, RefObject } from "react"
import { ExportMenu } from "./export-menu"

export function VizStudio({
  title,
  filename,
  csv,
  svgRef,
  data,
  canvas,
  customize,
  notice,
  stats,
  spatial = false,
  view,
  onFit,
  tools,
  onReset,
  fill = false,
  surface,
}: {
  title: string
  filename: string
  csv?: string
  svgRef: RefObject<SVGSVGElement | null>
  data: ReactNode
  canvas: ReactNode
  customize: ReactNode
  notice?: ReactNode
  stats?: StageStat[]
  spatial?: boolean
  view?: StageViewControl
  onFit?: () => void
  tools?: StageTool[]
  onReset?: () => void
  fill?: boolean
  surface?: { background: string; dot: string }
}) {
  return (
    <ToolStage
      toolId={filename}
      title={title}
      stats={stats}
      left={
        <>
          <p className="text-[12px] text-[var(--nb-secondary)]">Your data stays in this browser.</p>
          {data}
        </>
      }
      right={customize}
      notice={notice}
      spatial={spatial}
      view={view}
      onFit={onFit}
      tools={tools}
      fill={fill}
      surface={surface}
      actions={
        <>
          <ExportMenu svgRef={svgRef} filename={filename} csv={csv} />
          {onReset ? (
            <Button type="button" variant="ghost" className="h-8" onClick={onReset}>
              Reset
            </Button>
          ) : null}
        </>
      }
    >
      {canvas}
    </ToolStage>
  )
}

export function ExampleList<T>({
  examples,
  onLoad,
}: {
  examples: { id: string; title: string; description: string; data: T }[]
  onLoad: (data: T, title: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">Templates</p>
      <div className="flex flex-wrap gap-1.5">
      {examples.map((example) => (
        <button
          key={example.id}
          type="button"
          title={example.description}
          onClick={() => onLoad(example.data, example.title)}
          className="h-8 rounded-lg bg-[var(--nb-accent)] px-2.5 text-[13px] font-medium text-[var(--nb-primary)] transition-colors hover:bg-[var(--nb-primary)] hover:text-white"
        >
          {example.title}
        </button>
      ))}
      </div>
    </div>
  )
}

export function EmptyViz({
  onExample,
  onManual,
}: {
  onExample: () => void
  onManual: () => void
}) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div>
        <p className="text-[15px] font-medium text-[var(--nb-primary)]">What would you like to visualise?</p>
        <p className="mt-1 text-[13px] text-[var(--nb-secondary)]">Start from an example, or enter your own data.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" className="h-8" onClick={onExample}>
          Start with example
        </Button>
        <Button type="button" className="h-8" variant="outline" onClick={onManual}>
          Enter data
        </Button>
      </div>
    </div>
  )
}
