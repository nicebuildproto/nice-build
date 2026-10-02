"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { issueMessage, rowIssue } from "@/lib/sankey/parse"
import type { SankeyRow } from "@/lib/sankey/types"
import { cn } from "@/lib/utils"
import { Copy, Plus, Trash2 } from "lucide-react"

type Col = "source" | "target" | "value"

export function DataTable({
  rows,
  flowColors,
  defaultFlowColor,
  onChange,
  onFlowColor,
  onAdd,
  onDelete,
  onDuplicate,
}: {
  rows: SankeyRow[]
  flowColors: Record<string, string>
  defaultFlowColor: string
  onChange: (id: string, key: Col, value: string) => void
  onFlowColor: (id: string, color: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  function focus(rowIndex: number, col: Col) {
    const row = rows[rowIndex]
    if (!row) return
    document
      .querySelector<HTMLInputElement>(`[data-sankey-cell="${row.id}-${col}"]`)
      ?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, col: Col) {
    const cols: Col[] = ["source", "target", "value"]
    const colIndex = cols.indexOf(col)
    const input = event.currentTarget
    const atStart = input.selectionStart === 0
    const atEnd = input.selectionStart === input.value.length

    if (event.key === "Enter") {
      event.preventDefault()
      if (rowIndex === rows.length - 1) onAdd()
      requestAnimationFrame(() => focus(Math.min(rowIndex + 1, rows.length), col))
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      focus(Math.min(rowIndex + 1, rows.length - 1), col)
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      focus(Math.max(rowIndex - 1, 0), col)
    }
    if (event.key === "ArrowRight" && atEnd && colIndex < 2) {
      event.preventDefault()
      focus(rowIndex, cols[colIndex + 1])
    }
    if (event.key === "ArrowLeft" && atStart && colIndex > 0) {
      event.preventDefault()
      focus(rowIndex, cols[colIndex - 1])
    }
  }

  const firstIssue = rows.map(rowIssue).find((issue) => issue !== null) ?? null

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-black/[0.08]">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[var(--nb-accent)] text-left text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
              <th className="px-2 py-2 font-medium">Source</th>
              <th className="px-2 py-2 font-medium">Target</th>
              <th className="w-24 px-2 py-2 font-medium">Value</th>
              <th className="w-16 px-2 py-2 font-medium">Colour</th>
              <th className="w-16 px-1 py-2">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const issue = rowIssue(row)
              return (
                <tr key={row.id} className="border-t border-black/[0.06]">
                  <td className="p-0">
                    <Cell
                      cellId={`${row.id}-source`}
                      value={row.source}
                      invalid={issue === "missing-source"}
                      placeholder="Revenue"
                      onChange={(value) => onChange(row.id, "source", value)}
                      onKeyDown={(event) => onKeyDown(event, index, "source")}
                    />
                  </td>
                  <td className="border-l border-black/[0.06] p-0">
                    <Cell
                      cellId={`${row.id}-target`}
                      value={row.target}
                      invalid={issue === "missing-target"}
                      placeholder="Product"
                      onChange={(value) => onChange(row.id, "target", value)}
                      onKeyDown={(event) => onKeyDown(event, index, "target")}
                    />
                  </td>
                  <td className="border-l border-black/[0.06] p-0">
                    <Cell
                      cellId={`${row.id}-value`}
                      value={row.value}
                      invalid={issue === "invalid-value" || issue === "negative"}
                      placeholder="500"
                      inputMode="decimal"
                      onChange={(value) => onChange(row.id, "value", value)}
                      onKeyDown={(event) => onKeyDown(event, index, "value")}
                    />
                  </td>
                  <td className="border-l border-black/[0.06] px-2">
                    <input
                      type="color"
                      aria-label={`Flow colour for row ${index + 1}`}
                      value={flowColors[row.id] ?? defaultFlowColor}
                      onChange={(event) => onFlowColor(row.id, event.target.value)}
                      className="size-7 cursor-pointer rounded-md border border-black/10 bg-white p-0.5"
                    />
                  </td>
                  <td className="border-l border-black/[0.06] px-1">
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Duplicate row"
                        onClick={() => onDuplicate(row.id)}
                      >
                        <Copy />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Delete row"
                        onClick={() => onDelete(row.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onAdd}>
        <Plus />
        Add row
      </Button>

      {firstIssue ? (
        <p className="text-[13px] text-[var(--nb-secondary)]">{issueMessage(firstIssue)}</p>
      ) : null}
    </div>
  )
}

export function NodeColorTable({
  nodes,
  colors,
  fallback,
  onChange,
}: {
  nodes: string[]
  colors: Record<string, string>
  fallback: string
  onChange: (name: string, color: string) => void
}) {
  if (nodes.length === 0) return null

  return (
    <div className="mt-6 flex flex-col gap-2">
      <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
        Nodes
      </h3>
      <div className="overflow-x-auto rounded-lg border border-black/[0.08]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[var(--nb-accent)] text-left text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
              <th className="px-2 py-2 font-medium">Node</th>
              <th className="w-16 px-2 py-2 font-medium">Colour</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((name) => (
              <tr key={name} className="border-t border-black/[0.06]">
                <td className="px-2 py-1.5 text-[var(--nb-primary)]">{name}</td>
                <td className="border-l border-black/[0.06] px-2 py-1.5">
                  <input
                    type="color"
                    aria-label={`${name} colour`}
                    value={colors[name] ?? fallback}
                    onChange={(event) => onChange(name, event.target.value)}
                    className="size-7 cursor-pointer rounded-md border border-black/10 bg-white p-0.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Cell({
  cellId,
  value,
  onChange,
  onKeyDown,
  placeholder,
  invalid,
  inputMode,
}: {
  cellId: string
  value: string
  onChange: (value: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder: string
  invalid: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  return (
    <Input
      data-sankey-cell={cellId}
      value={value}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete="off"
      aria-invalid={invalid || undefined}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      className={cn(
        "h-9 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-1",
        invalid && "bg-destructive/5"
      )}
    />
  )
}
