export function money(value: number) {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value)
}

export function num(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(value)
}

export function percent(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—"
  return `${num(value, digits)}%`
}

export function parseHex(input: string) {
  let hex = input.trim().replace(/^#/, "")
  if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex.split("").map((char) => char + char).join("")
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return `#${hex.toLowerCase()}`
}

export function hexToRgb(hex: string) {
  const value = parseHex(hex)
  if (!value) return null
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number) {
  const channel = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0")
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

export function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

export function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360
  if (s === 0) {
    const v = l * 255
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  const hk = hue / 360
  return {
    r: channel(hk + 1 / 3) * 255,
    g: channel(hk) * 255,
    b: channel(hk - 1 / 3) * 255,
  }
}

export function shiftHex(hex: string, hue: number, lightness: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const next = hslToRgb(hsl.h + hue, hsl.s, Math.min(0.96, Math.max(0.06, hsl.l + lightness)))
  return rgbToHex(next.r, next.g, next.b)
}

function linearize(channel: number) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function contrastRatio(a: string, b: string) {
  const left = hexToRgb(a)
  const right = hexToRgb(b)
  if (!left || !right) return null
  const lum = (rgb: { r: number; g: number; b: number }) =>
    0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b)
  const l1 = lum(left)
  const l2 = lum(right)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function exactAge(from: Date, to: Date) {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return null
  let years = to.getFullYear() - from.getFullYear()
  let months = to.getMonth() - from.getMonth()
  let days = to.getDate() - from.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { years, months, days }
}

export type DiffRow = { type: "same" | "add" | "del"; text: string }

export function diffLines(before: string, after: string): DiffRow[] {
  const a = before.replace(/\r\n/g, "\n").split("\n")
  const b = after.replace(/\r\n/g, "\n").split("\n")
  if (a.length * b.length > 40000) {
    return [{ type: "same", text: "These texts are too long to compare here." }]
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
