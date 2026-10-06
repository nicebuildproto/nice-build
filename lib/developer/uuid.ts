export const UUID_MAX = 500
export const UUID_PRESETS = [1, 10, 50, 100] as const
export type UuidVersion = "v4" | "v7"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function clampUuidCount(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(UUID_MAX, Math.max(1, Math.round(value)))
}

function formatUuid(bytes: Uint8Array) {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function uuidv4() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return formatUuid(bytes)
}

export function uuidv7(now = Date.now()) {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[0] = Math.floor(now / 2 ** 40) & 255
  bytes[1] = Math.floor(now / 2 ** 32) & 255
  bytes[2] = Math.floor(now / 2 ** 24) & 255
  bytes[3] = Math.floor(now / 2 ** 16) & 255
  bytes[4] = Math.floor(now / 2 ** 8) & 255
  bytes[5] = now & 255
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return formatUuid(bytes)
}

export function makeUuids(count: number, version: UuidVersion = "v4", now = Date.now()) {
  const amount = clampUuidCount(count)
  return Array.from({ length: amount }, (_, index) => (version === "v7" ? uuidv7(now + index) : uuidv4()))
}

export function uuidVersionNibble(id: string) {
  return id.replace(/-/g, "")[12] ?? ""
}

export function isUuid(value: string) {
  return UUID_RE.test(value.trim())
}
