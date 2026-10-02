export const diceCountMax = 6

export function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6)
}
