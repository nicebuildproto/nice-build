import { randomInt, rollDie } from "../everyday/random"

export const diceCountMax = 12
export const diceSidePresets = [4, 6, 8, 10, 12, 20] as const

export function rollD6() {
  return rollDie(6)
}

export { rollDie }

export function clampSides(sides: number) {
  if (!Number.isFinite(sides)) return 6
  return Math.max(2, Math.min(100, Math.floor(sides)))
}

export function clampCount(count: number) {
  if (!Number.isFinite(count)) return 1
  return Math.max(1, Math.min(diceCountMax, Math.floor(count)))
}

export function formatRoll(faces: number[], sides: number) {
  const total = faces.reduce((sum, face) => sum + face, 0)
  return `${faces.length}d${sides}: ${faces.join(", ")} (total ${total})`
}

export function randomExtraTurns() {
  return 4 + randomInt(0, 2)
}
