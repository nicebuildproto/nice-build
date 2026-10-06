export type Slot = { a: string | null; b: string | null; winner: string | null }

export function parseNames(source: string) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function seedBracket(names: string[]): Slot[][] {
  const count = Math.max(names.length, 2)
  const size = 2 ** Math.ceil(Math.log2(count))
  const slots: (string | null)[] = [...names]
  while (slots.length < size) slots.push(null)
  const rounds: Slot[][] = []
  let current: Slot[] = []
  for (let i = 0; i < size; i += 2) {
    const a = slots[i]
    const b = slots[i + 1]
    current.push({ a, b, winner: a && !b ? a : b && !a ? b : null })
  }
  rounds.push(current)
  while (current.length > 1) {
    const next: Slot[] = []
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i].winner
      const b = current[i + 1].winner
      next.push({ a, b, winner: a && !b ? a : b && !a ? b : null })
    }
    rounds.push(next)
    current = next
  }
  return rounds
}

export function advanceBracket(rounds: Slot[][], round: number, index: number, name: string) {
  const next = rounds.map((column) => column.map((match) => ({ ...match })))
  next[round][index].winner = name
  for (let r = round + 1; r < next.length; r += 1) {
    for (let i = 0; i < next[r].length; i += 1) {
      const a = next[r - 1][i * 2]?.winner ?? null
      const b = next[r - 1][i * 2 + 1]?.winner ?? null
      const previous = next[r][i].winner
      const options = [a, b].filter((value): value is string => Boolean(value))
      next[r][i] = { a, b, winner: previous && options.includes(previous) ? previous : options.length === 1 ? options[0] : null }
    }
  }
  return next
}

export function championOf(rounds: Slot[][]) {
  return rounds.at(-1)?.[0]?.winner ?? null
}
