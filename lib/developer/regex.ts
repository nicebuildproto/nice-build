export const REGEX_FLAGS = [
  { flag: "g", label: "g", hint: "All matches" },
  { flag: "i", label: "i", hint: "Ignore case" },
  { flag: "m", label: "m", hint: "Multiline ^ $" },
  { flag: "s", label: "s", hint: "Dot matches newline" },
  { flag: "u", label: "u", hint: "Unicode" },
  { flag: "y", label: "y", hint: "Sticky" },
] as const

export const ALLOWED_FLAGS = "gimsuy"
export const MAX_MATCHES = 500
export const MAX_SAMPLE_CHARS = 250_000
export const REGEX_TIMEOUT_MS = 120

export type RegexMatch = {
  text: string
  index: number
  groups: string[]
  named?: Record<string, string>
}

export type RegexResult =
  | { ok: true; matches: RegexMatch[]; truncated: boolean }
  | { ok: false; error: string }

export const regexExamples = [
  {
    id: "email",
    label: "Email",
    pattern: String.raw`\b[\w.+-]+@[\w-]+\.[\w.-]+\b`,
    flags: "g",
    sample: "Write to hello@nice.build or team@nice.build — not a@b.",
  },
  {
    id: "url",
    label: "URL",
    pattern: String.raw`https?:\/\/[^\s]+`,
    flags: "gi",
    sample: "See https://nicetools.co/developer/regex-tester and HTTP://example.com/a.",
  },
  {
    id: "iso-date",
    label: "ISO date",
    pattern: String.raw`\d{4}-\d{2}-\d{2}`,
    flags: "g",
    sample: "Shipped 2026-10-03, due 2026-11-01, skip 10-03-2026.",
  },
] as const

export function sanitizeFlags(flags: string) {
  let next = ""
  for (const char of flags) {
    if (ALLOWED_FLAGS.includes(char) && !next.includes(char)) next += char
  }
  return next
}

export function toggleFlag(flags: string, flag: string) {
  const current = sanitizeFlags(flags)
  return current.includes(flag) ? current.replace(flag, "") : sanitizeFlags(current + flag)
}

export function describeRegexError(error: unknown) {
  const raw = error instanceof Error ? error.message : "Invalid pattern."
  return raw.replace(/^Invalid regular expression:\s*/i, "").trim() || "Invalid pattern."
}

export function serializeMatch(match: RegExpMatchArray): RegexMatch {
  const groups = match.slice(1).filter((item): item is string => item != null)
  const named = match.groups && Object.keys(match.groups).length ? { ...match.groups } : undefined
  return { text: match[0], index: match.index ?? 0, groups, named }
}

export function collectMatches(pattern: string, flags: string, sample: string, maxMatches = MAX_MATCHES): RegexResult {
  if (!pattern) {
    return { ok: false, error: "Enter a JavaScript regular expression to test." }
  }
  const safeFlags = sanitizeFlags(flags)
  const text = sample.length > MAX_SAMPLE_CHARS ? sample.slice(0, MAX_SAMPLE_CHARS) : sample
  try {
    const expression = new RegExp(pattern, safeFlags)
    const matches: RegexMatch[] = []
    if (expression.global) {
      expression.lastIndex = 0
      for (const match of text.matchAll(expression)) {
        matches.push(serializeMatch(match))
        if (matches.length >= maxMatches) return { ok: true, matches, truncated: true }
      }
      return { ok: true, matches, truncated: text.length < sample.length }
    }
    const match = expression.exec(text)
    if (match) matches.push(serializeMatch(match))
    return { ok: true, matches, truncated: false }
  } catch (error) {
    return { ok: false, error: describeRegexError(error) }
  }
}
