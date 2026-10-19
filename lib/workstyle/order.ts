import type { Question } from "./types.ts"

// DISPLAY ORDER. Options are shuffled per participant so the answer you want is never in a fixed place.
// The shuffle is a pure function of a seed saved with the session, so a refresh shows the same order.
// Scoring never depends on display order: it works from option ids.

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mixes the session seed with a key (a question id) into a new 32-bit seed. */
export function seedFor(seed: number, key: string): number {
  let hash = (seed ^ 0x9e3779b9) >>> 0
  for (let i = 0; i < key.length; i += 1) hash = Math.imul(hash ^ key.charCodeAt(i), 0x01000193) >>> 0
  return hash
}

/** Fisher–Yates, returning a new array. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The options of a question in this participant’s order. Options marked `last` stay last. */
export function displayOptions<T extends { last?: boolean }>(questionId: string, options: readonly T[], seed: number): T[] {
  const movable = options.filter((option) => !option.last)
  const pinned = options.filter((option) => option.last)
  return [...shuffle(movable, mulberry32(seedFor(seed, questionId))), ...pinned]
}

/** Where a ranking starts for this participant: a seeded random order, the same after a refresh. */
export function initialRankOrder(question: Extract<Question, { format: "rank" }>, seed: number): string[] {
  return shuffle(
    question.options.map((option) => option.id),
    mulberry32(seedFor(seed, `${question.id}:rank`)),
  )
}
