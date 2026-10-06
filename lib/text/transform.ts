import { cleanText } from "@/lib/tools/pure"

export type CleanOptions = {
  trim: boolean
  spaces: boolean
  blanks: boolean
  quotes: boolean
  empty: boolean
  sort: boolean
  dedupe: boolean
}

export function tidyText(text: string, options: CleanOptions) {
  const next = cleanText(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"), {
    trim: options.trim,
    spaces: options.spaces,
    blanks: options.blanks,
    quotes: options.quotes,
  })
  let lines = next.split("\n")
  if (options.empty) lines = lines.filter((line) => line.trim().length > 0)
  if (options.dedupe) {
    const seen = new Set<string>()
    lines = lines.filter((line) => {
      if (seen.has(line)) return false
      seen.add(line)
      return true
    })
  }
  if (options.sort) lines = [...lines].sort((a, b) => a.localeCompare(b))
  return lines.join("\n")
}

export function uniqueLines(text: string) {
  const seen = new Set<string>()
  const kept: string[] = []
  let dropped = 0
  for (const line of text.split("\n")) {
    if (seen.has(line)) {
      dropped += 1
      continue
    }
    seen.add(line)
    kept.push(line)
  }
  return { text: kept.join("\n"), dropped, kept: kept.length }
}

export function markdownTable(headersRaw: string, rowsRaw: string) {
  const headers = headersRaw.split(",").map((item) => item.trim()).filter(Boolean)
  const rows = rowsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((item) => item.trim()))
  if (!headers.length) return ""
  const render = (cells: string[]) => `| ${headers.map((_, index) => cells[index] ?? "").join(" | ")} |`
  return [render(headers), `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map(render)].join("\n")
}
