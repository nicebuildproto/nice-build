"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SlidersHorizontal, Table2 } from "lucide-react"
import { useState, type ReactNode, type RefObject } from "react"
import { ExportMenu } from "./export-menu"

export function VizStudio({
  filename,
  csv,
  svgRef,
  data,
  canvas,
  customize,
  notice,
}: {
  filename: string
  csv?: string
  svgRef: RefObject<SVGSVGElement | null>
  data: ReactNode
  canvas: ReactNode
  customize: ReactNode
  notice?: ReactNode
}) {
  const [dataOpen, setDataOpen] = useState(false)
  const [styleOpen, setStyleOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[var(--nb-secondary)]">Your data stays in this browser.</p>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={() => setDataOpen(true)}>
            <Table2 />
            Data
          </Button>
          <Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={() => setStyleOpen(true)}>
            <SlidersHorizontal />
            Customize
          </Button>
          <ExportMenu svgRef={svgRef} filename={filename} csv={csv} />
        </div>
      </div>

      {notice}

      <div className="hidden overflow-hidden rounded-2xl border border-black/[0.08] lg:grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(220px,260px)]">
        <aside className="min-h-0 border-r border-black/[0.06] p-4">
          <Panel title="Data">{data}</Panel>
        </aside>
        <section className="min-h-[520px] bg-[var(--nb-accent)]/40 p-5">{canvas}</section>
        <aside className="min-h-0 border-l border-black/[0.06] p-4">
          <Panel title="Customize">{customize}</Panel>
        </aside>
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="chart">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="style">Customize</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="pt-4">
            <div className="rounded-2xl border border-black/[0.08] bg-[var(--nb-accent)]/40 p-3">{canvas}</div>
          </TabsContent>
          <TabsContent value="data" className="pt-4">
            {data}
          </TabsContent>
          <TabsContent value="style" className="pt-4">
            {customize}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={dataOpen} onOpenChange={setDataOpen}>
        <SheetContent side="left" className="w-[min(100%,24rem)] overflow-y-auto p-5">
          <SheetHeader>
            <SheetTitle>Data</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{data}</div>
        </SheetContent>
      </Sheet>
      <Sheet open={styleOpen} onOpenChange={setStyleOpen}>
        <SheetContent side="right" className="w-[min(100%,22rem)] overflow-y-auto p-5">
          <SheetHeader>
            <SheetTitle>Customize</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{customize}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-full max-h-[70vh] min-h-0 flex-col">
      <h2 className="mb-4 text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
        {title}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
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
    <div className="flex flex-col gap-1.5">
      {examples.map((example) => (
        <button
          key={example.id}
          type="button"
          onClick={() => onLoad(example.data, example.title)}
          className="rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--nb-accent)]"
        >
          <span className="block text-[13px] font-medium text-[var(--nb-primary)]">{example.title}</span>
          <span className="block text-[12px] text-[var(--nb-secondary)]">{example.description}</span>
        </button>
      ))}
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
        <Button type="button" size="sm" onClick={onExample}>
          Start with example
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onManual}>
          Enter data
        </Button>
      </div>
    </div>
  )
}
