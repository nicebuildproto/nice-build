export type DiffKind = "same" | "add" | "del"
export type DiffRow = { type: DiffKind; text: string }
export type DiffView = DiffRow | { type: "skip"; count: number }

export type TextDiff =
  | { limited: false; rows: DiffRow[] }
  | { limited: true; message: string }

const CELL_LIMIT = 120_000

export function diffLines(before: string, after: string): TextDiff {
  return diffTokens(splitLines(before), splitLines(after), "line")
}

export function diffWords(before: string, after: string): TextDiff {
  return diffTokens(splitWords(before), splitWords(after), "word")
}

export function diffSummary(rows: DiffRow[]) {
  let added = 0
  let removed = 0
  let unchanged = 0
  for (const row of rows) {
    if (row.type === "add") added += 1
    else if (row.type === "del") removed += 1
    else unchanged += 1
  }
  return { added, removed, unchanged, total: rows.length }
}

export function unifiedDiff(rows: DiffRow[]) {
  return rows
    .map((row) => (row.type === "add" ? `+ ${row.text}` : row.type === "del" ? `- ${row.text}` : `  ${row.text}`))
    .join("\n")
}

export function foldUnchanged(rows: DiffRow[], context = 2): DiffView[] {
  const out: DiffView[] = []
  let index = 0
  while (index < rows.length) {
    if (rows[index].type !== "same") {
      out.push(rows[index])
      index += 1
      continue
    }
    let end = index
    while (end < rows.length && rows[end].type === "same") end += 1
    const run = rows.slice(index, end)
    if (context <= 0) {
      out.push({ type: "skip", count: run.length })
    } else if (run.length <= context * 2 + 1) {
      out.push(...run)
    } else {
      out.push(...run.slice(0, context))
      out.push({ type: "skip", count: run.length - context * 2 })
      out.push(...run.slice(run.length - context))
    }
    index = end
  }
  return out
}

function splitLines(text: string) {
  return text.replace(/\r\n/g, "\n").split("\n")
}

function splitWords(text: string) {
  return text.replace(/\r\n/g, "\n").split(/(\s+)/).filter((part) => part.length)
}

function diffTokens(before: string[], after: string[], mode: "line" | "word"): TextDiff {
  let start = 0
  const shared = Math.min(before.length, after.length)
  while (start < shared && before[start] === after[start]) start += 1
  let endBefore = before.length
  let endAfter = after.length
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore -= 1
    endAfter -= 1
  }
  const midBefore = before.slice(start, endBefore)
  const midAfter = after.slice(start, endAfter)
  if (midBefore.length * midAfter.length > CELL_LIMIT) {
    return {
      limited: true,
      message:
        mode === "word"
          ? "These texts are too different to compare word by word. Switch to lines, or paste a shorter section."
          : "These texts are too different to compare in full. Paste a shorter section.",
    }
  }
  const middle = align(midBefore, midAfter)
  return {
    limited: false,
    rows: [
      ...before.slice(0, start).map((text) => ({ type: "same" as const, text })),
      ...middle,
      ...before.slice(endBefore).map((text) => ({ type: "same" as const, text })),
    ],
  }
}

function align(before: string[], after: string[]): DiffRow[] {
  const dp = Array.from({ length: before.length + 1 }, () => Array<number>(after.length + 1).fill(0))
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      dp[i][j] = before[i] === after[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const rows: DiffRow[] = []
  let i = 0
  let j = 0
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      rows.push({ type: "same", text: before[i] })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "del", text: before[i] })
      i += 1
    } else {
      rows.push({ type: "add", text: after[j] })
      j += 1
    }
  }
  while (i < before.length) rows.push({ type: "del", text: before[i++] })
  while (j < after.length) rows.push({ type: "add", text: after[j++] })
  return rows
}
