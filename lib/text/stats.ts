export type TextStats = {
  words: number
  characters: number
  withoutSpaces: number
  lines: number
  paragraphs: number
  sentences: number
  readingMinutes: number
}

export function countText(text: string, wordsPerMinute = 200): TextStats {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
  const sentences = trimmed ? trimmed.split(/[.!?]+/).filter((part) => part.trim()).length : 0
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((part) => part.trim()).length : 0
  const lines = text.length ? text.split("\n").length : 0
  const readingMinutes = words ? Math.max(1, Math.round(words / Math.max(1, wordsPerMinute))) : 0
  return {
    words,
    characters: text.length,
    withoutSpaces: text.replace(/\s/g, "").length,
    lines,
    paragraphs,
    sentences,
    readingMinutes,
  }
}

export function readingClock(words: number, wordsPerMinute: number) {
  const pace = Math.max(1, wordsPerMinute)
  const totalSeconds = words ? Math.round((words / pace) * 60) : 0
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return { minutes, seconds, totalSeconds }
}

export function formatReading(words: number, wordsPerMinute = 200) {
  const { minutes, seconds } = readingClock(words, wordsPerMinute)
  if (!words) return "0s"
  if (!minutes) return `${seconds}s`
  if (!seconds) return `${minutes}m`
  return `${minutes}m ${seconds}s`
}

export function utf8Bytes(text: string) {
  return new TextEncoder().encode(text).length
}
