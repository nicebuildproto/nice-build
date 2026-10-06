export type JsonError = {
  message: string
  line: number | null
  column: number | null
  offset: number | null
}

export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: JsonError }

const PREVIEW_LIMIT = 120_000

export function offsetToLineColumn(source: string, offset: number) {
  let line = 1
  let column = 1
  const end = Math.max(0, Math.min(offset, source.length))
  for (let index = 0; index < end; index += 1) {
    if (source[index] === "\n") {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }
  return { line, column }
}

export function lineColumnToOffset(source: string, line: number, column: number) {
  const lines = source.split("\n")
  const row = Math.max(1, Math.min(line, lines.length))
  let offset = 0
  for (let index = 0; index < row - 1; index += 1) offset += lines[index].length + 1
  return offset + Math.max(0, Math.min(column - 1, lines[row - 1]?.length ?? 0))
}

export function parseJsonError(source: string, error: unknown): JsonError {
  const raw = error instanceof Error ? error.message : "That is not valid JSON."
  const position = raw.match(/position\s+(\d+)/i)
  const lineCol = raw.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  let offset = position ? Number(position[1]) : null
  let line = lineCol ? Number(lineCol[1]) : null
  let column = lineCol ? Number(lineCol[2]) : null
  if (offset != null && Number.isFinite(offset) && line == null) {
    const loc = offsetToLineColumn(source, offset)
    line = loc.line
    column = loc.column
  } else if (line != null && column != null && offset == null) {
    offset = lineColumnToOffset(source, line, column)
  }
  const core = simplifyJsonMessage(raw)
  const message = line != null && column != null ? `${core} at line ${line}, column ${column}.` : core
  return { message, line, column, offset }
}

function simplifyJsonMessage(raw: string) {
  const stripped = raw
    .replace(/\s+in JSON at position \d+/i, "")
    .replace(/\s+\(line \d+ column \d+\)/i, "")
    .replace(/^JSON\.parse:\s*/i, "")
    .trim()
  if (/unexpected end of json/i.test(stripped)) {
    return "The JSON ended too early — a string, array, or object is probably unclosed"
  }
  if (/bad control character/i.test(stripped)) return "A string contains a control character that JSON does not allow"
  if (/unexpected token/i.test(stripped)) return "Unexpected token"
  return stripped || "That is not valid JSON"
}

export function parseJsonSource(source: string): JsonParseResult {
  const text = source.trim()
  if (!text) {
    return {
      ok: false,
      error: { message: "Paste JSON to continue.", line: null, column: null, offset: null },
    }
  }
  try {
    return { ok: true, value: JSON.parse(source) }
  } catch (error) {
    return { ok: false, error: parseJsonError(source, error) }
  }
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys)
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, sortJsonKeys(record[key])]))
  }
  return value
}

export function formatJson(value: unknown, space: number | string | undefined, sortKeys = false) {
  return JSON.stringify(sortKeys ? sortJsonKeys(value) : value, null, space)
}

export function jsonPreview(text: string, limit = PREVIEW_LIMIT) {
  if (text.length <= limit) return { text, truncated: false, hidden: 0 }
  return {
    text: `${text.slice(0, limit)}\n\n… ${text.length - limit} more characters. Copy or download for the full output.`,
    truncated: true,
    hidden: text.length - limit,
  }
}

export function jsonStats(value: unknown, source: string) {
  let keys = 0
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const record = node as Record<string, unknown>
    keys += Object.keys(record).length
    for (const item of Object.values(record)) walk(item)
  }
  walk(value)
  const type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value
  return {
    type,
    keys,
    chars: source.length,
    lines: source ? source.split("\n").length : 0,
    bytes: new TextEncoder().encode(source).length,
  }
}

export const sampleJson = `{
  "name": "Nice Tools",
  "live": true,
  "tools": ["JSON", "Regex"],
  "count": 2
}`
