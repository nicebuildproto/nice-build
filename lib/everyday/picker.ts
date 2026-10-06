export type ParsedList = {
  items: string[]
  unique: number
  duplicates: { value: string; count: number }[]
}

export function parseList(source: string): ParsedList {
  const items = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }))
  return { items, unique: counts.size, duplicates }
}

export function joinList(items: string[]) {
  return items.join("\n")
}

export function removeAt<T>(items: T[], index: number) {
  if (index < 0 || index >= items.length) return items
  return items.filter((_, item) => item !== index)
}

export function duplicateNote(list: ParsedList) {
  if (!list.duplicates.length) return null
  if (list.duplicates.length === 1) {
    const [entry] = list.duplicates
    return `“${entry.value}” appears ${entry.count} times, so it is more likely to be drawn.`
  }
  return `${list.duplicates.length} names are repeated. Each line is a separate chance, so repeats are more likely.`
}
