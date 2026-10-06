function randomSource() {
  const source = globalThis.crypto
  if (!source?.getRandomValues) {
    throw new Error("Secure randomness is not available in this browser.")
  }
  return source
}

/** Uniform float in [0, 1). */
export function randomUnit() {
  const bytes = new Uint32Array(1)
  randomSource().getRandomValues(bytes)
  return bytes[0] / 0x1_0000_0000
}

/** Inclusive integer, unbiased, from `crypto.getRandomValues`. */
export function randomInt(min: number, max: number) {
  const low = Math.ceil(Math.min(min, max))
  const high = Math.floor(Math.max(min, max))
  const span = high - low + 1
  if (!Number.isFinite(span) || span <= 0) return low
  if (span === 1) return low
  const limit = Math.floor(0x1_0000_0000 / span) * span
  const bytes = new Uint32Array(1)
  let value = 0
  do {
    randomSource().getRandomValues(bytes)
    value = bytes[0]
  } while (value >= limit)
  return low + (value % span)
}

export function randomPick<T>(items: T[]) {
  if (!items.length) return undefined
  return items[randomInt(0, items.length - 1)]
}

export function rollDie(sides: number) {
  const faces = Math.max(2, Math.min(1000, Math.floor(sides)))
  return randomInt(1, faces)
}

export function rollDice(count: number, sides: number) {
  const n = Math.max(1, Math.min(24, Math.floor(count)))
  return Array.from({ length: n }, () => rollDie(sides))
}

export function flipCoin(): "Heads" | "Tails" {
  return randomInt(0, 1) === 0 ? "Heads" : "Tails"
}
