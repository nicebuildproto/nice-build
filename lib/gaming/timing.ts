export function randomWaitMs(min = 800, max = 3000) {
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return low + (bytes[0] / 0x1_0000_0000) * (high - low)
}

export function average(values: number[]) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function cpsFromClicks(clicks: number, windowMs: number) {
  if (windowMs <= 0) return 0
  return (clicks * 1000) / windowMs
}

export function remainingWindow(endsAt: number, now: number) {
  return Math.max(0, endsAt - now)
}
