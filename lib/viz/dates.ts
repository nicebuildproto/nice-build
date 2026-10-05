const months: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

export type FlexibleDate = {
  raw: string
  time: number
  precision: "year" | "quarter" | "month" | "day"
}

export function parseFlexibleDate(value: string): FlexibleDate | null {
  const raw = value.trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const time = Date.parse(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`)
    return Number.isNaN(time) ? null : { raw, time, precision: "day" }
  }

  const yearOnly = raw.match(/^(\d{4})$/)
  if (yearOnly) {
    return { raw, time: Date.parse(`${yearOnly[1]}-01-01T00:00:00`), precision: "year" }
  }

  const quarter = raw.match(/^q([1-4])\s+(\d{4})$/i)
  if (quarter) {
    const month = (Number(quarter[1]) - 1) * 3 + 1
    return {
      raw,
      time: Date.parse(`${quarter[2]}-${String(month).padStart(2, "0")}-01T00:00:00`),
      precision: "quarter",
    }
  }

  const monthYear = raw.match(/^([a-z]+)\s+(\d{4})$/i)
  if (monthYear && months[monthYear[1].toLowerCase()] != null) {
    const month = months[monthYear[1].toLowerCase()] + 1
    return {
      raw,
      time: Date.parse(`${monthYear[2]}-${String(month).padStart(2, "0")}-01T00:00:00`),
      precision: "month",
    }
  }

  const dayMonthYear = raw.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i)
  if (dayMonthYear && months[dayMonthYear[2].toLowerCase()] != null) {
    const month = months[dayMonthYear[2].toLowerCase()] + 1
    const day = dayMonthYear[1].padStart(2, "0")
    const time = Date.parse(`${dayMonthYear[3]}-${String(month).padStart(2, "0")}-${day}T00:00:00`)
    return Number.isNaN(time) ? null : { raw, time, precision: "day" }
  }

  const slash = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (slash) {
    const a = Number(slash[1])
    const b = Number(slash[2])
    const year = slash[3]
    const dayFirst = a > 12 || b <= 12
    const day = dayFirst ? a : b
    const month = dayFirst ? b : a
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const time = Date.parse(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`)
      return Number.isNaN(time) ? null : { raw, time, precision: "day" }
    }
  }

  const native = Date.parse(raw)
  if (!Number.isNaN(native)) return { raw, time: native, precision: "day" }
  return null
}

export function dateInputValue(value: string): string {
  const parsed = parseFlexibleDate(value)
  if (!parsed) return value
  const date = new Date(parsed.time)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
