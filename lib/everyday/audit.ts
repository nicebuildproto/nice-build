export const screenKeys = ["social", "video", "games", "work", "other"] as const
export type ScreenKey = (typeof screenKeys)[number]

export const screenLabels: Record<ScreenKey, string> = {
  social: "Social",
  video: "Video",
  games: "Games",
  work: "Work",
  other: "Other",
}

export function screenTime(hours: Record<ScreenKey, number>) {
  const parts = screenKeys.map((key) => ({ key, label: screenLabels[key], hours: hours[key] ?? 0 }))
  const day = parts.reduce((sum, part) => sum + part.hours, 0)
  if (![day, ...parts.map((part) => part.hours)].every((value) => Number.isFinite(value) && value >= 0)) return null
  return {
    day,
    week: day * 7,
    year: day * 365,
    yearDays: day * 365 / 24,
    percentDay: (day / 24) * 100,
    parts,
  }
}

export const STREAM_G_PER_HOUR = 36
export const AI_G_PER_PROMPT = 0.03

export function carbonEstimate(streamingHoursWeek: number, promptsPerDay: number) {
  if (![streamingHoursWeek, promptsPerDay].every((value) => Number.isFinite(value) && value >= 0)) return null
  const streamYearG = streamingHoursWeek * 52 * STREAM_G_PER_HOUR
  const aiYearG = promptsPerDay * 365 * AI_G_PER_PROMPT
  return {
    streamYearG,
    aiYearG,
    combinedKg: (streamYearG + aiYearG) / 1000,
    streamWeekG: streamingHoursWeek * STREAM_G_PER_HOUR,
    aiDayG: promptsPerDay * AI_G_PER_PROMPT,
  }
}
