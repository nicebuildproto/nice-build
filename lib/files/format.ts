export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    return `${kb < 10 && !Number.isInteger(kb) ? kb.toFixed(1) : Math.round(kb)} KB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb < 10 ? mb.toFixed(2) : mb.toFixed(1)} MB`
}

export function fileStem(name: string) {
  const trimmed = name.trim() || "file"
  const slash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"))
  const base = slash >= 0 ? trimmed.slice(slash + 1) : trimmed
  const dot = base.lastIndexOf(".")
  if (dot <= 0) return base || "file"
  return base.slice(0, dot) || "file"
}

export function withSuffix(name: string, suffix: string, extension: string) {
  const ext = extension.replace(/^\./, "")
  return `${fileStem(name)}${suffix}.${ext}`
}

export function percentChange(from: number, to: number) {
  if (!Number.isFinite(from) || from <= 0 || !Number.isFinite(to)) return 0
  return Math.round(((from - to) / from) * 100)
}

export function describeAccept(accept: string) {
  const parts = accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
  const labels = new Set<string>()
  for (const part of parts) {
    if (part === "image/*") labels.add("images")
    else if (part === "video/*") labels.add("video")
    else if (part === "audio/*") labels.add("audio")
    else if (part === "application/pdf" || part === ".pdf") labels.add("PDF")
    else if (part.includes("jpeg") || part === ".jpg" || part === ".jpeg") labels.add("JPEG")
    else if (part.includes("png") || part === ".png") labels.add("PNG")
    else if (part.includes("webp") || part === ".webp") labels.add("WebP")
    else if (part.includes("svg") || part === ".svg") labels.add("SVG")
    else if (part.includes("gif") || part === ".gif") labels.add("GIF")
    else if (part.startsWith(".")) labels.add(part.slice(1).toUpperCase())
  }
  return [...labels].join(", ")
}

export function fileMatchesAccept(file: File, accept: string) {
  if (!accept.trim()) return true
  const type = (file.type || "").toLowerCase()
  const name = file.name.toLowerCase()
  return accept.split(",").some((raw) => {
    const part = raw.trim().toLowerCase()
    if (!part) return false
    if (part.endsWith("/*")) return type.startsWith(part.slice(0, -1))
    if (part.startsWith(".")) return name.endsWith(part)
    return type === part || name.endsWith(`.${part.replace("image/", "").replace("application/", "")}`)
  })
}

export function rejectReason(file: File, accept: string, maxBytes?: number) {
  if (maxBytes && file.size > maxBytes) {
    return `${file.name} is larger than ${formatBytes(maxBytes)}. Choose a smaller file.`
  }
  if (!fileMatchesAccept(file, accept)) {
    const allowed = describeAccept(accept)
    return `${file.name} isn’t a supported type. Use ${allowed || "a supported file"}.`
  }
  return null
}

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}
