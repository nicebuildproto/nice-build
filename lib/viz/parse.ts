export function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(/[$,£€]/g, "").replace(/,/g, "").replace(/%$/, "")
  if (trimmed === "") return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

export function looksNumeric(value: string): boolean {
  return parseNumber(value) != null
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (ch === delimiter && !quoted) {
      cells.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

export function detectDelimiter(text: string): "," | "\t" | ";" {
  const sample = text.split(/\r?\n/).slice(0, 6).join("\n")
  const tabs = (sample.match(/\t/g) ?? []).length
  const semis = (sample.match(/;/g) ?? []).length
  const commas = (sample.match(/,/g) ?? []).length
  if (tabs > 0 && tabs >= commas) return "\t"
  if (semis > commas) return ";"
  return ","
}

export function parseTable(text: string): string[][] {
  const delimiter = detectDelimiter(text)
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => parseDelimitedLine(line, delimiter))
    .filter((row) => row.some((cell) => cell !== ""))
}

const headerHints = [
  "label",
  "name",
  "category",
  "stage",
  "product",
  "region",
  "series",
  "value",
  "amount",
  "count",
  "revenue",
  "date",
  "month",
  "year",
  "task",
  "start",
  "end",
  "progress",
  "event",
  "description",
  "from",
  "to",
  "source",
  "target",
]

export function looksLikeHeader(row: string[]): boolean {
  if (row.length === 0) return false
  const numeric = row.filter(looksNumeric).length
  if (numeric === 0) return true
  const hits = row.filter((cell) => headerHints.includes(cell.trim().toLowerCase())).length
  return hits >= 1 && numeric < row.length
}

export type ColumnKind = "label" | "number" | "date" | "text"

export type InferredColumn = {
  index: number
  name: string
  kind: ColumnKind
}

export type InferredTable = {
  columns: InferredColumn[]
  rows: string[][]
  header: boolean
  mappingNote: string | null
}

function kindForColumn(name: string, values: string[]): ColumnKind {
  const lower = name.toLowerCase()
  if (/(date|month|year|when|day)/.test(lower)) return "date"
  if (/(value|amount|count|revenue|total|qty|quantity|sales|visits|%|percent|progress)/.test(lower)) {
    return "number"
  }
  const filled = values.filter((value) => value !== "")
  if (filled.length === 0) return "text"
  const numeric = filled.filter(looksNumeric).length
  if (numeric / filled.length >= 0.7) return "number"
  return "label"
}

export function inferTable(text: string): InferredTable | null {
  const table = parseTable(text)
  if (table.length === 0) return null
  const header = looksLikeHeader(table[0])
  const names = header
    ? table[0].map((cell, index) => cell || `Column ${index + 1}`)
    : table[0].map((_, index) => (index === 0 ? "Label" : `Series ${index}`))
  const body = header ? table.slice(1) : table
  if (body.length === 0) return null
  const width = Math.max(names.length, ...body.map((row) => row.length))
  const columns: InferredColumn[] = Array.from({ length: width }, (_, index) => {
    const values = body.map((row) => row[index] ?? "")
    return {
      index,
      name: names[index] ?? `Column ${index + 1}`,
      kind: kindForColumn(names[index] ?? "", values),
    }
  })
  if (!columns.some((column) => column.kind === "label")) {
    const firstText = columns.find((column) => column.kind !== "number")
    if (firstText) firstText.kind = "label"
    else columns[0].kind = "label"
  }
  const labels = columns.filter((column) => column.kind === "label" || column.kind === "date")
  const numbers = columns.filter((column) => column.kind === "number")
  let mappingNote: string | null = null
  if (labels.length > 1 && numbers.length > 0) {
    mappingNote = `${labels[0].name} is the category. ${numbers.map((column) => column.name).join(", ")} ${numbers.length === 1 ? "is a value." : "are series."}`
  } else if (numbers.length > 1) {
    mappingNote = `${columns[0].name} is the label. Each other column is a series.`
  }
  return { columns, rows: body.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? "")), header, mappingNote }
}

export type ChartSeriesRow = {
  label: string
  values: number[]
}

export function tableToSeries(inferred: InferredTable): { series: string[]; rows: ChartSeriesRow[] } {
  const labelCol =
    inferred.columns.find((column) => column.kind === "date") ??
    inferred.columns.find((column) => column.kind === "label") ??
    inferred.columns[0]
  const valueCols = inferred.columns.filter((column) => column !== labelCol && column.kind === "number")
  const seriesCols = valueCols.length > 0 ? valueCols : inferred.columns.filter((column) => column !== labelCol)
  const series = seriesCols.length > 0 ? seriesCols.map((column) => column.name) : ["Value"]
  const rows = inferred.rows.map((row) => ({
    label: row[labelCol.index] ?? "",
    values:
      seriesCols.length > 0
        ? seriesCols.map((column) => parseNumber(row[column.index] ?? "") ?? 0)
        : [parseNumber(row[labelCol.index] ?? "") ?? 0],
  }))
  return { series, rows }
}

export function rowsToCsv(headers: string[], rows: string[][]): string {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")
}
