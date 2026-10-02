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
  onChange,
  onAdd,
  onDelete,
  onDuplicate,
}: {
  rows: SankeyRow[]
  onChange: (id: string, key: Col, value: string) => void
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
      <div className="grid grid-cols-[1fr_1fr_72px_56px] gap-1.5 px-0.5 text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
        <span>Source</span>
        <span>Target</span>
        <span>Value</span>
        <span className="sr-only">Row actions</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((row, index) => {
          const issue = rowIssue(row)
          return (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_72px_56px] items-center gap-1.5">
              <Cell
                cellId={`${row.id}-source`}
                value={row.source}
                invalid={issue === "missing-source"}
                placeholder="Revenue"
                onChange={(value) => onChange(row.id, "source", value)}
                onKeyDown={(event) => onKeyDown(event, index, "source")}
              />
              <Cell
                cellId={`${row.id}-target`}
                value={row.target}
                invalid={issue === "missing-target"}
                placeholder="Product"
                onChange={(value) => onChange(row.id, "target", value)}
                onKeyDown={(event) => onKeyDown(event, index, "target")}
              />
              <Cell
                cellId={`${row.id}-value`}
                value={row.value}
                invalid={issue === "invalid-value" || issue === "negative"}
                placeholder="500"
                inputMode="decimal"
                onChange={(value) => onChange(row.id, "value", value)}
                onKeyDown={(event) => onKeyDown(event, index, "value")}
              />
              <div className="flex items-center justify-end gap-0.5">
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
            </div>
          )
        })}
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
      className={cn("h-8 text-[13px]", invalid && "border-destructive/50")}
    />
  )
}
