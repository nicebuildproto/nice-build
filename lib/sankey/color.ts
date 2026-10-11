/** Mix a hex colour toward white so a flow reads as a lighter version of its node. */
export function lighterHex(hex: string, amount = 0.5) {
  const raw = hex.trim().replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return hex
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount)
  const parts = [0, 2, 4].map((index) => mix(parseInt(raw.slice(index, index + 2), 16)))
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`
}
