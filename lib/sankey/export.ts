const SVG_NS = "http://www.w3.org/2000/svg"
const FALLBACK_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const DEFAULT_FAMILY = "Geist"

export interface ExportSvg {
  xml: string
  width: number
  height: number
}

/** The site's body sans family, as next/font registered it (the first name in body's font-family). */
function bodyFamily(): string {
  if (typeof document === "undefined") return DEFAULT_FAMILY
  const first = getComputedStyle(document.body).fontFamily.split(",")[0]?.trim().replace(/^["']|["']$/g, "")
  return first || DEFAULT_FAMILY
}

function fontStack(family: string): string {
  return `"${family}", ${FALLBACK_STACK}`
}

// ---- Font embedding -------------------------------------------------------

const fontDataCache = new Map<string, Promise<string>>()

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/** Fetch a font file once and keep it as a base64 data URI, so repeat exports are instant. */
function fontDataUri(url: string): Promise<string> {
  let cached = fontDataCache.get(url)
  if (!cached) {
    cached = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("font fetch failed")
        return response.arrayBuffer()
      })
      .then((buffer) => {
        const ext = url.split("?")[0].split(".").pop()?.toLowerCase()
        const mime = ext === "woff" ? "font/woff" : ext === "ttf" ? "font/ttf" : ext === "otf" ? "font/otf" : "font/woff2"
        return `data:${mime};base64,${toBase64(buffer)}`
      })
    cached.catch(() => fontDataCache.delete(url))
    fontDataCache.set(url, cached)
  }
  return cached
}

interface FaceRule {
  style: string
  weight: string
  range: string
  src: string
  base: string
}

function collectFaces(family: string): FaceRule[] {
  const faces: FaceRule[] = []
  const visit = (rules: CSSRuleList, base: string) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) {
        const name = rule.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/g, "")
        if (name !== family) continue
        faces.push({
          style: rule.style.getPropertyValue("font-style") || "normal",
          weight: rule.style.getPropertyValue("font-weight") || "400",
          range: rule.style.getPropertyValue("unicode-range"),
          src: rule.style.getPropertyValue("src"),
          base,
        })
      } else if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) {
        visit((rule as CSSGroupingRule).cssRules, base)
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules, sheet.href ?? document.baseURI)
    } catch {
      // Cross-origin stylesheet: its rules can't be read, so skip it.
    }
  }
  return faces
}

function weightRange(value: string): [number, number] {
  const parts = value
    .split(/\s+/)
    .map((part) => (part === "normal" ? 400 : part === "bold" ? 700 : Number(part)))
    .filter((n) => Number.isFinite(n))
  if (parts.length === 0) return [400, 400]
  return [parts[0], parts[parts.length - 1]]
}

function rangeCovers(range: string, chars: Set<number>): boolean {
  if (!range) return true
  for (const part of range.split(",")) {
    const match = part.trim().match(/^U\+([0-9a-f?]+)(?:-([0-9a-f]+))?$/i)
    if (!match) continue
    let lo: number
    let hi: number
    if (match[1].includes("?")) {
      lo = parseInt(match[1].replace(/\?/g, "0"), 16)
      hi = parseInt(match[1].replace(/\?/g, "f"), 16)
    } else {
      lo = parseInt(match[1], 16)
      hi = match[2] ? parseInt(match[2], 16) : lo
    }
    for (const code of chars) if (code >= lo && code <= hi) return true
  }
  return false
}

/** Build @font-face CSS (with base64 data URIs) for the weights and characters the diagram uses. */
async function embeddedFontCss(family: string, weights: Set<number>, text: string): Promise<string> {
  const chars = new Set<number>()
  for (const char of text) chars.add(char.codePointAt(0) ?? 0)
  chars.add(32)

  const blocks: string[] = []
  for (const face of collectFaces(family)) {
    const [lo, hi] = weightRange(face.weight)
    if (![...weights].some((weight) => weight >= lo && weight <= hi)) continue
    if (!rangeCovers(face.range, chars)) continue
    const urls = [...face.src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((match) => match[1])
    const url = urls.find((candidate) => /\.woff2(\?|$)/i.test(candidate)) ?? urls[0]
    if (!url) continue
    try {
      const data = await fontDataUri(new URL(url, face.base).href)
      const format = data.startsWith("data:font/woff2") ? "woff2" : data.startsWith("data:font/woff;") ? "woff" : "truetype"
      blocks.push(
        `@font-face{font-family:"${family}";font-style:${face.style};font-weight:${face.weight};` +
          `src:url(${data}) format("${format}");${face.range ? `unicode-range:${face.range};` : ""}}`
      )
    } catch {
      // Embedding failed: the sans-serif fallback stack still applies.
    }
  }
  return blocks.join("\n")
}

// ---- Export SVG -----------------------------------------------------------

function exportSize(svg: SVGSVGElement): { width: number; height: number } {
  const rect = svg.getBoundingClientRect()
  const width = Math.round(rect.width || svg.clientWidth || Number(svg.getAttribute("width")) || 1200)
  const height = Math.round(rect.height || svg.clientHeight || Number(svg.getAttribute("height")) || 720)
  return { width, height }
}

/**
 * Clone the live SVG into a standalone file: explicit size and viewBox, an explicit sans-serif font
 * on every text element (page CSS does not apply inside a standalone SVG), and the site font embedded.
 */
export async function getExportSvg(svg: SVGSVGElement): Promise<ExportSvg> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const { width, height } = exportSize(svg)

  const family = bodyFamily()
  const stack = fontStack(family)
  const liveText = Array.from(svg.querySelectorAll("text, tspan"))
  const cloneText = Array.from(clone.querySelectorAll("text, tspan"))
  const weights = new Set<number>()
  liveText.forEach((live, index) => {
    const target = cloneText[index]
    if (!target) return
    const computed = getComputedStyle(live)
    const weight = computed.fontWeight === "bold" ? "700" : computed.fontWeight === "normal" ? "400" : computed.fontWeight
    weights.add(Number(weight) || 400)
    // An inline style (such as var(--font-geist-sans)) would beat the attributes and cannot resolve here.
    target.removeAttribute("style")
    target.setAttribute("font-family", stack)
    target.setAttribute("font-size", computed.fontSize)
    target.setAttribute("font-weight", weight)
    if (computed.fill && computed.fill !== "none") target.setAttribute("fill", computed.fill)
  })

  const background = svg.dataset.exportBackground
  const box = svg.viewBox.baseVal
  if (background) {
    const rect = document.createElementNS(SVG_NS, "rect")
    rect.setAttribute("x", String(box.x || 0))
    rect.setAttribute("y", String(box.y || 0))
    rect.setAttribute("width", String(box.width || width))
    rect.setAttribute("height", String(box.height || height))
    rect.setAttribute("fill", background)
    clone.insertBefore(rect, clone.firstChild)
  }

  clone.setAttribute("xmlns", SVG_NS)
  clone.setAttribute("width", String(width))
  clone.setAttribute("height", String(height))
  clone.setAttribute("viewBox", box.width && box.height ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 0 ${width} ${height}`)
  clone.removeAttribute("class")
  clone.removeAttribute("style")

  if (liveText.length > 0) {
    const text = liveText.map((node) => node.textContent ?? "").join("")
    const css = await embeddedFontCss(family, weights, text)
    if (css) {
      const defs = document.createElementNS(SVG_NS, "defs")
      const style = document.createElementNS(SVG_NS, "style")
      style.textContent = css
      defs.appendChild(style)
      clone.insertBefore(defs, clone.firstChild)
    }
  }

  return { xml: `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`, width, height }
}

export async function serializeSvg(svg: SVGSVGElement): Promise<string> {
  return (await getExportSvg(svg)).xml
}

export function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  if (document.fonts?.ready) await document.fonts.ready
  const { xml, width, height } = await getExportSvg(svg)
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const img = new Image()

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Could not render the diagram."))
      img.src = url
    })
    // Safari and Firefox can fire load before the image is ready to draw.
    try {
      await img.decode()
    } catch {
      // decode() can reject for SVG images in some browsers; load already succeeded.
    }

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas is unavailable.")
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0, width, height)
    // A first draw can happen before an embedded font is applied; draw again once it has settled.
    await new Promise((resolve) => window.setTimeout(resolve, 60))
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    return await new Promise((resolve, reject) => {
      canvas.toBlob((next) => {
        if (next) resolve(next)
        else reject(new Error("Could not create a PNG."))
      }, "image/png")
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
