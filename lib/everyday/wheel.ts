export function wheelSlice(count: number) {
  return count > 0 ? 360 / count : 0
}

export function wheelIndex(count: number, angleDeg: number) {
  if (count <= 0) return -1
  const normalized = ((angleDeg % 360) + 360) % 360
  const atTop = (360 - normalized) % 360
  const slice = wheelSlice(count)
  return Math.floor(atTop / slice) % count
}

export function wheelWinner(names: string[], angleDeg: number) {
  if (!names.length) return null
  const index = wheelIndex(names.length, angleDeg)
  return { index, name: names[index] }
}

export function wheelGradient(count: number) {
  if (count <= 0) return "var(--nb-accent)"
  const tones = ["#111111", "#3f3f46", "#71717a", "#d4d4d8"]
  const slice = 100 / count
  const stops = Array.from({ length: count }, (_, index) => {
    const color = tones[index % tones.length]
    const start = (index * slice).toFixed(4)
    const end = ((index + 1) * slice).toFixed(4)
    return `${color} ${start}% ${end}%`
  })
  return `conic-gradient(${stops.join(", ")})`
}
