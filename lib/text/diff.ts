export type DiffKind = "same" | "add" | "del"
export type DiffRow = { type: DiffKind; text: string }

export function diffLines(before: string, after: string): DiffRow[] {
  return diffTokens(splitLines(before), splitLines(after))
}

export function diffWords(before: string, after: string): DiffRow[] {
  return diffTokens(splitWords(before), splitWords(after))
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

function splitLines(text: string) {
  return text.replace(/\r\n/g, "\n").split("\n")
}

function splitWords(text: string) {
  return text.replace(/\r\n/g, "\n").split(/(\s+)/).filter((part) => part.length)
}

function diffTokens(a: string[], b: string[]): DiffRow[] {
  if (a.length * b.length > 40_000) {
    return [{ type: "same", text: "These texts are too long to compare here. Split them into smaller sections." }]
  }
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const rows: DiffRow[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ type: "same", text: a[i] })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "del", text: a[i] })
      i += 1
    } else {
      rows.push({ type: "add", text: b[j] })
      j += 1
    }
  }
  while (i < a.length) rows.push({ type: "del", text: a[i++] })
  while (j < b.length) rows.push({ type: "add", text: b[j++] })
  return rows
}
