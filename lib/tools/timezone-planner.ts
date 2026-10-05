export type ZoneCity = { id: string; city: string; zone: string }

export const zoneCities: ZoneCity[] = [
  { id: "syd", city: "Sydney", zone: "Australia/Sydney" },
  { id: "mel", city: "Melbourne", zone: "Australia/Melbourne" },
  { id: "adl", city: "Adelaide", zone: "Australia/Adelaide" },
  { id: "per", city: "Perth", zone: "Australia/Perth" },
  { id: "akl", city: "Auckland", zone: "Pacific/Auckland" },
  { id: "tok", city: "Tokyo", zone: "Asia/Tokyo" },
  { id: "sel", city: "Seoul", zone: "Asia/Seoul" },
  { id: "sgp", city: "Singapore", zone: "Asia/Singapore" },
  { id: "hkg", city: "Hong Kong", zone: "Asia/Hong_Kong" },
  { id: "del", city: "Delhi", zone: "Asia/Kolkata" },
  { id: "dxb", city: "Dubai", zone: "Asia/Dubai" },
  { id: "jnb", city: "Johannesburg", zone: "Africa/Johannesburg" },
  { id: "cai", city: "Cairo", zone: "Africa/Cairo" },
  { id: "lon", city: "London", zone: "Europe/London" },
  { id: "par", city: "Paris", zone: "Europe/Paris" },
  { id: "ber", city: "Berlin", zone: "Europe/Berlin" },
  { id: "ams", city: "Amsterdam", zone: "Europe/Amsterdam" },
  { id: "waw", city: "Warsaw", zone: "Europe/Warsaw" },
  { id: "ist", city: "Istanbul", zone: "Europe/Istanbul" },
  { id: "nyc", city: "New York", zone: "America/New_York" },
  { id: "chi", city: "Chicago", zone: "America/Chicago" },
  { id: "den", city: "Denver", zone: "America/Denver" },
  { id: "lax", city: "Los Angeles", zone: "America/Los_Angeles" },
  { id: "van", city: "Vancouver", zone: "America/Vancouver" },
  { id: "sao", city: "São Paulo", zone: "America/Sao_Paulo" },
  { id: "utc", city: "UTC", zone: "UTC" },
]

export type HourCell = {
  hour: number
  localHour: number
  localDate: string
  offsetDays: number
  work: boolean
}

export type ZoneRow = {
  city: ZoneCity
  cells: HourCell[]
}

const workStart = 9
const workEnd = 17

export function plannerGrid(dateIso: string, zoneIds: string[]): ZoneRow[] {
  const zones = zoneIds
    .map((id) => zoneCities.find((city) => city.id === id))
    .filter((city): city is ZoneCity => Boolean(city))
  const anchor = zones[0]?.zone ?? "UTC"
  return zones.map((city) => ({
    city,
    cells: Array.from({ length: 24 }, (_, hour) => cellFor(dateIso, hour, city.zone, anchor)),
  }))
}

export function overlapHours(rows: ZoneRow[]) {
  if (!rows.length) return []
  return Array.from({ length: 24 }, (_, hour) => hour).filter((hour) => rows.every((row) => row.cells[hour]?.work))
}

function cellFor(dateIso: string, hour: number, zone: string, anchor: string): HourCell {
  const instant = zonedTime(dateIso, hour, anchor)
  const parts = formatParts(instant, zone)
  const localHour = Number(parts.hour)
  const localDate = `${parts.year}-${parts.month}-${parts.day}`
  const offsetDays = dateDiff(localDate, dateIso)
  return {
    hour,
    localHour,
    localDate,
    offsetDays,
    work: localHour >= workStart && localHour < workEnd,
  }
}

function zonedTime(dateIso: string, hour: number, zone: string) {
  const [year, month, day] = dateIso.split("-").map(Number)
  let utc = Date.UTC(year, month - 1, day, hour, 0, 0)
  for (let i = 0; i < 4; i += 1) {
    const parts = formatParts(new Date(utc), zone)
    const got = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute || "0"),
    )
    const want = Date.UTC(year, month - 1, day, hour, 0)
    utc += want - got
  }
  return new Date(utc)
}

function formatParts(date: Date, zone: string) {
  const fmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const bag: Record<string, string> = {}
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value
  }
  return bag
}

function dateDiff(local: string, base: string) {
  const a = Date.parse(`${local}T00:00:00Z`)
  const b = Date.parse(`${base}T00:00:00Z`)
  return Math.round((a - b) / 86_400_000)
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`
}
