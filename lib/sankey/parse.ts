import { newRow, type RowIssue, type SankeyRow, type ValidFlow } from "@/lib/sankey/types"

export function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "")
  if (trimmed === "") return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

export function isRowEmpty(row: SankeyRow): boolean {
  return row.source.trim() === "" && row.target.trim() === "" && row.value.trim() === ""
}

export function rowIssue(row: SankeyRow): RowIssue {
  if (isRowEmpty(row)) return null
  if (row.source.trim() === "") return "missing-source"
  if (row.target.trim() === "") return "missing-target"
  const n = parseNumber(row.value)
  if (n === null) return "invalid-value"
  if (n < 0) return "negative"
  return null
}

export function issueMessage(issue: RowIssue): string | null {
  switch (issue) {
    case "missing-source":
      return "Add a source."
    case "missing-target":
      return "Add a target."
    case "invalid-value":
      return "Value needs to be a number."
    case "negative":
      return "Values can’t be negative."
    default:
      return null
  }
}

export function validFlows(rows: SankeyRow[]): ValidFlow[] {
  return rows.flatMap((row) => {
    if (isRowEmpty(row) || rowIssue(row)) return []
    const value = parseNumber(row.value)
    if (value === null || value === 0) return []
    const source = row.source.trim()
    const target = row.target.trim()
    if (source === target) return []
    return [{ id: row.id, source, target, value }]
  })
}

export function parsePastedTable(text: string): SankeyRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const normalized = lines.map((line) => {
    const cols = line.includes("\t")
      ? line.split("\t")
      : line.includes(",")
        ? line.split(",")
        : line.split(/\s{2,}/)
    return cols.map((cell) => cell.trim())
  })

  const first = normalized[0]?.map((cell) => cell.toLowerCase()) ?? []
  const looksLikeHeader =
    first.includes("source") ||
    first.includes("from") ||
    first.includes("target") ||
    first.includes("to") ||
    first.includes("value") ||
    first.includes("amount")

  const body = looksLikeHeader ? normalized.slice(1) : normalized

  return body
    .map((cols) => {
      const row = newRow()
      row.source = cols[0] ?? ""
      row.target = cols[1] ?? ""
      row.value = cols[2] ?? ""
      return row
    })
    .filter((row) => !isRowEmpty(row))
}
