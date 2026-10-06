export type CountdownParts = {
  past: boolean
  complete: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

export function countdownParts(targetMs: number, nowMs: number): CountdownParts | null {
  if (!Number.isFinite(targetMs) || !Number.isFinite(nowMs)) return null
  const totalMs = targetMs - nowMs
  const abs = Math.abs(totalMs)
  return {
    past: totalMs < 0,
    complete: totalMs <= 0,
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor(abs / 3_600_000) % 24,
    minutes: Math.floor(abs / 60_000) % 60,
    seconds: Math.floor(abs / 1000) % 60,
    totalMs,
  }
}

export function localDateValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function localDatetimeValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function defaultCountdownTarget() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  date.setHours(9, 0, 0, 0)
  return localDatetimeValue(date)
}

export function parseLocalDatetime(value: string) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export function formatStopwatch(ms: number) {
  const total = Math.max(0, ms)
  const hours = Math.floor(total / 3_600_000)
  const minutes = Math.floor(total / 60_000) % 60
  const seconds = Math.floor(total / 1000) % 60
  const tenths = Math.floor((total % 1000) / 100)
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`
  return hours > 0 ? `${hours}:${clock}` : clock
}

export function formatCountdownClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor(total / 60) % 60
  const seconds = total % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function durationFromFields(minutes: string, seconds: string) {
  const mins = Number(minutes)
  const secs = Number(seconds)
  const minPart = Number.isFinite(mins) ? Math.max(0, mins) : 0
  const secPart = Number.isFinite(secs) ? Math.max(0, secs) : 0
  return Math.round(minPart * 60 + secPart) * 1000
}

export function remainingMs(endsAt: number | null, now: number, pausedLeft: number | null) {
  if (pausedLeft !== null) return Math.max(0, pausedLeft)
  if (endsAt === null) return null
  return Math.max(0, endsAt - now)
}

export type WorldCity = { city: string; zone: string }

export const worldCities: WorldCity[] = [
  { city: "Sydney", zone: "Australia/Sydney" },
  { city: "Tokyo", zone: "Asia/Tokyo" },
  { city: "London", zone: "Europe/London" },
  { city: "New York", zone: "America/New_York" },
  { city: "Los Angeles", zone: "America/Los_Angeles" },
  { city: "UTC", zone: "UTC" },
]

export function formatWorldClock(now: Date, zone: string, locale = "en-AU") {
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: zone,
  }).format(now)
  const date = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: zone,
  }).format(now)
  const offset =
    new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? ""
  return { time, date, offset }
}
