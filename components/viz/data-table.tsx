"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { badNumber, cellInput, DataError } from "@/components/viz/data-entry"
import { cn } from "@/lib/utils"
import { ChevronUp, Copy, Plus, Trash2 } from "lucide-react"

export type VizColumn = {
  key: string
  label: string
  kind?: "text" | "number" | "date"
  placeholder?: string
  width?: string
}

export function VizDataTable<Row extends { id: string }>({
  columns,
  rows,
  get,
  set,
  onAdd,
  onDelete,
  onDuplicate,
  onMove,
  addLabel = "Add row",
}: {
  columns: VizColumn[]
  rows: Row[]
  get: (row: Row, key: string) => string
  set: (id: string, key: string, value: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onDuplicate?: (id: string) => void
  onMove?: (id: string, direction: -1 | 1) => void
  addLabel?: string
}) {
  const invalid = rows.some((row) => columns.some((column) => column.kind === "number" && badNumber(get(row, column.key))))

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-black/[0.08]">
        <table className="w-full min-w-[280px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[var(--nb-accent)] text-left text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
              {onMove ? (
                <th className="w-7 px-1 py-2">
                  <span className="sr-only">Reorder</span>
                </th>
              ) : null}
              {columns.map((column) => (
                <th key={column.key} className="px-2 py-2 font-medium" style={{ width: column.width }}>
                  {column.label}
                </th>
              ))}
              <th className="w-16 px-1 py-2">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-t border-black/[0.06]">
                {onMove ? (
                  <td className="px-1 text-[var(--nb-secondary)]">
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-lg hover:bg-[var(--nb-accent)] disabled:opacity-30"
                      aria-label={`Move ${get(row, columns[0].key) || "row"} up`}
                      disabled={index === 0}
                      onClick={() => onMove(row.id, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </button>
                  </td>
                ) : null}
                {columns.map((column, colIndex) => (
                  <td key={column.key} className={cn("p-0", colIndex > 0 && "border-l border-black/[0.06]")}>
                    <Input
                      value={get(row, column.key)}
                      type={column.kind === "date" ? "date" : "text"}
                      inputMode={column.kind === "number" ? "decimal" : undefined}
                      placeholder={column.placeholder}
                      aria-label={column.label}
                      aria-invalid={column.kind === "number" && badNumber(get(row, column.key)) ? true : undefined}
                      onChange={(event) => set(row.id, column.key, event.target.value)}
                      className={cn(cellInput, column.kind === "number" && badNumber(get(row, column.key)) && "text-red-600")}
                    />
                  </td>
                ))}
                <td className="border-l border-black/[0.06] px-1">
                  <div className="flex justify-end gap-0.5">
                    {onDuplicate ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Duplicate row"
                        onClick={() => onDuplicate(row.id)}
                      >
                        <Copy />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete row"
                      onClick={() => onDelete(row.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" className="h-8 w-fit" onClick={onAdd}>
        <Plus />
        {addLabel}
      </Button>
      <DataError show={invalid} />
    </div>
  )
}
