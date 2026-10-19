import { brand, productPath } from "./brand.ts"
import { dimensionIds } from "./dimensions.ts"
import { followUps, recordsNote } from "./questions.ts"
import { SCORING_VERSION } from "./scoring.ts"
import type { DimensionId, DimensionSummary, FollowUpId, ProfileSummary } from "./types.ts"

// SHARING — a profile is shared as a short code in the URL path. The code contains ONLY what the
// person chose to share: a position, a spread and an evidence level for each included dimension,
// plus an optional first name. It never contains answers, and a dimension left out is not in the
// code at all (not hidden — absent).
//
// Layout (bytes): [format=2][scoringVersion][dimension mask][context lo][context hi]
//                 per included dimension (in canonical order): [position+100][spread×100][context << 2 | evidence]
//                 [name length][name utf-8…][checksum]
// Then base64url, no padding.

const FORMAT = 2
export const MAX_NAME_LENGTH = 40
const EVIDENCE_CODES = { thin: 1, some: 2, good: 3 } as const
const EVIDENCE_FROM_CODE = [null, "thin", "some", "good"] as const

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

function toBase64Url(bytes: number[]): string {
  let out = ""
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes[i], bytes[i + 1], bytes[i + 2]]
    out += ALPHABET[a >> 2]
    out += ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)]
    if (b !== undefined) out += ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)]
    if (c !== undefined) out += ALPHABET[c & 63]
  }
  return out
}

function fromBase64Url(code: string): number[] | null {
  if (!/^[A-Za-z0-9_-]+$/.test(code) || code.length % 4 === 1) return null
  const values = [...code].map((char) => ALPHABET.indexOf(char))
  const bytes: number[] = []
  for (let i = 0; i < values.length; i += 4) {
    const [a, b, c, d] = [values[i], values[i + 1], values[i + 2], values[i + 3]]
    bytes.push((a << 2) | (b >> 4))
    if (c !== undefined) bytes.push(((b & 15) << 4) | (c >> 2))
    if (d !== undefined) bytes.push(((c & 3) << 6) | d)
  }
  return bytes
}

function checksum(bytes: number[]): number {
  return bytes.reduce((total, byte, index) => (total + byte * (index + 1)) % 251, 7)
}

/** Follow-ups whose notes can travel in a share code. Private ones (pressure-shift) stay on the device. */
const sharedFollowUps = followUps.filter((followUp) => !followUp.private)

/** The options a context byte can hold for each follow-up, in a fixed order (excluding “varies”). */
function contextOptions(id: FollowUpId): string[] {
  const followUp = followUps.find((candidate) => candidate.id === id)
  return followUp ? followUp.options.map((option) => option.context).filter(recordsNote) : []
}

export function sanitizeName(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim()
  return cleaned ? [...cleaned].slice(0, MAX_NAME_LENGTH).join("") : undefined
}

export function encodeShare(summary: ProfileSummary): string {
  const bytes: number[] = [FORMAT, summary.scoringVersion]
  let mask = 0
  dimensionIds.forEach((id, index) => {
    if (summary.dimensions[id]) mask |= 1 << index
  })
  bytes.push(mask)

  let contextByte = 0
  sharedFollowUps.forEach((followUp, index) => {
    const context = summary.contexts[followUp.id]
    const position = context ? contextOptions(followUp.id).indexOf(context) + 1 : 0
    const dimensionsPresent = followUp.dimensions.every((dimension) => summary.dimensions[dimension])
    if (position > 0 && dimensionsPresent) contextByte |= position << (index * 3)
  })
  bytes.push(contextByte & 255, contextByte >> 8)

  for (const id of dimensionIds) {
    const entry = summary.dimensions[id]
    if (!entry) continue
    bytes.push(Math.round(entry.position * 100) + 100)
    bytes.push(Math.round(entry.spread * 100))
    bytes.push((Math.min(3, Math.max(0, entry.context ?? 0)) << 2) | EVIDENCE_CODES[entry.evidence])
  }

  const name = sanitizeName(summary.name)
  const nameBytes = name ? [...new TextEncoder().encode(name)] : []
  bytes.push(nameBytes.length, ...nameBytes)
  bytes.push(checksum(bytes))
  return toBase64Url(bytes)
}

export type DecodeResult = { ok: true; summary: ProfileSummary } | { ok: false; reason: string }

export function decodeShare(code: string): DecodeResult {
  const bytes = fromBase64Url(code)
  if (!bytes || bytes.length < 7 || bytes.length > 200) return { ok: false, reason: "This link isn’t a valid profile link." }
  const body = bytes.slice(0, -1)
  if (checksum(body) !== bytes[bytes.length - 1]) return { ok: false, reason: "This link looks incomplete or has been changed." }
  if (body[0] !== FORMAT) return { ok: false, reason: "This link was made with a different version." }
  if (body[1] !== SCORING_VERSION) return { ok: false, reason: "This profile was made with a different version of the scoring." }

  const mask = body[2]
  const contextByte = body[3] | (body[4] << 8)
  let cursor = 5
  const dims = {} as Record<DimensionId, DimensionSummary | null>
  for (const [index, id] of dimensionIds.entries()) {
    if (!(mask & (1 << index))) {
      dims[id] = null
      continue
    }
    const position = body[cursor]
    const spread = body[cursor + 1]
    const packed = body[cursor + 2]
    cursor += 3
    if (position === undefined || spread === undefined || packed === undefined || position > 200) return { ok: false, reason: "This link isn’t a valid profile link." }
    const evidence = EVIDENCE_FROM_CODE[packed & 3]
    const context = packed >> 2
    if (!evidence || spread > 100 || context > 3) return { ok: false, reason: "This link isn’t a valid profile link." }
    dims[id] = { position: (position - 100) / 100, spread: spread / 100, evidence, ...(context > 0 ? { context } : {}) }
  }

  const nameLength = body[cursor]
  cursor += 1
  if (nameLength === undefined || nameLength > MAX_NAME_LENGTH * 4 || cursor + nameLength !== body.length) {
    return { ok: false, reason: "This link isn’t a valid profile link." }
  }
  let name: string | undefined
  if (nameLength > 0) {
    try {
      name = sanitizeName(new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(body.slice(cursor, cursor + nameLength))))
    } catch {
      return { ok: false, reason: "This link isn’t a valid profile link." }
    }
  }

  const contexts: ProfileSummary["contexts"] = {}
  sharedFollowUps.forEach((followUp, index) => {
    const position = (contextByte >> (index * 3)) & 7
    const context = position > 0 ? contextOptions(followUp.id)[position - 1] : undefined
    if (context && followUp.dimensions.every((dimension) => dims[dimension])) contexts[followUp.id] = context
  })

  return { ok: true, summary: { scoringVersion: body[1], dimensions: dims, contexts, ...(name ? { name } : {}) } }
}

export function profilePath(code: string): string {
  return productPath(`/p/${code}`)
}

export function cardPath(code: string, format: CardFormat = "og"): string {
  return productPath(`/p/${code}/card${format === "og" ? "" : `?format=${format}`}`)
}

export function comparePath(code: string): string {
  return productPath(`/compare/${code}`)
}

export type CardFormat = "og" | "square" | "story"

export const cardSizes: Record<CardFormat, { width: number; height: number; label: string }> = {
  og: { width: 1200, height: 630, label: "Wide (LinkedIn, links)" },
  square: { width: 1080, height: 1080, label: "Square (chat, feed)" },
  story: { width: 1080, height: 1350, label: "Portrait (stories)" },
}

export function absoluteUrl(origin: string, path: string): string {
  return `${origin.replace(/\/$/, "")}${path}`
}

/** A short plain-text summary suitable for chat, email or a social post. */
export function shareText(options: { title: string; statement: string; url: string; name?: string; invite?: boolean }): string {
  const owner = options.name ? `${options.name}’s` : "My"
  const lines = [`${owner} work style: ${options.title} — “${options.statement}”`]
  lines.push(
    options.invite
      ? `I’d like to compare how we like to work. It takes ${brand.estimatedMinutesLabel}, no account: ${options.url}`
      : `${brand.cardInvite} ${options.url}`,
  )
  return lines.join("\n")
}
