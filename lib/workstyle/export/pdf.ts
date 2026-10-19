import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from "pdf-lib"
import { dimensions } from "../dimensions.ts"
import { glyphPath, SIGNATURE_RADIUS } from "../signature.ts"
import { brand } from "../brand.ts"
import type { ExportModel } from "./model.ts"

// The personal work guide as a PDF. Built from the same ExportModel as the text and Markdown exports.
// Standard PDF fonts are used (no font files to ship), so text is limited to the WinAnsi character set;
// anything else is replaced rather than crashing the export.

const PAGE = { width: 595.28, height: 841.89 }
const MARGIN = 54
const COLUMN = PAGE.width - MARGIN * 2
const INK = rgb(0.082, 0.075, 0.059)
const MUTED = rgb(0.29, 0.27, 0.235)
const FAINT = rgb(0.78, 0.76, 0.71)
const PAPER = rgb(0.957, 0.937, 0.902)

const hex = (value: string): RGB => rgb(parseInt(value.slice(1, 3), 16) / 255, parseInt(value.slice(3, 5), 16) / 255, parseInt(value.slice(5, 7), 16) / 255)

/** Replaces characters the standard fonts can’t encode. Exported for tests. */
export function pdfSafe(text: string, font?: { encodeText: (text: string) => unknown }): string {
  const replacements: Record<string, string> = { "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "…": "...", "\u00a0": " ", "\u2011": "-", "\u202f": " " }
  let out = ""
  for (const char of text) {
    const mapped = replacements[char] ?? char
    if (font) {
      try {
        font.encodeText(mapped)
        out += mapped
      } catch {
        out += "?"
      }
    } else out += mapped
  }
  return out
}

type Fonts = { serif: PDFFont; serifBold: PDFFont; serifItalic: PDFFont; sans: PDFFont; sansBold: PDFFont }

class Writer {
  doc: PDFDocument
  fonts: Fonts
  page!: PDFPage
  y = 0
  pages: PDFPage[] = []

  constructor(doc: PDFDocument, fonts: Fonts) {
    this.doc = doc
    this.fonts = fonts
    this.newPage()
  }

  newPage() {
    this.page = this.doc.addPage([PAGE.width, PAGE.height])
    this.pages.push(this.page)
    this.y = PAGE.height - MARGIN
  }

  ensure(space: number) {
    if (this.y - space < MARGIN + 24) this.newPage()
  }

  safe(text: string, font: PDFFont) {
    return pdfSafe(text, font)
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const lines: string[] = []
    for (const paragraph of this.safe(text, font).split("\n")) {
      let line = ""
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line)
          line = word
        } else line = next
      }
      lines.push(line)
    }
    return lines
  }

  paragraph(text: string, options: { font?: PDFFont; size?: number; color?: RGB; width?: number; x?: number; leading?: number; after?: number } = {}) {
    const font = options.font ?? this.fonts.sans
    const size = options.size ?? 10
    const leading = options.leading ?? size * 1.5
    const x = options.x ?? MARGIN
    const lines = this.wrap(text, font, size, options.width ?? COLUMN)
    for (const line of lines) {
      this.ensure(leading)
      this.page.drawText(line, { x, y: this.y - size, size, font, color: options.color ?? INK })
      this.y -= leading
    }
    this.y -= options.after ?? 6
  }

  eyebrow(text: string) {
    this.ensure(40)
    this.page.drawText(this.safe(text.toUpperCase(), this.fonts.sansBold), { x: MARGIN, y: this.y - 8, size: 7.5, font: this.fonts.sansBold, color: MUTED })
    this.y -= 14
  }

  heading(text: string, eyebrow?: string) {
    this.ensure(eyebrow ? 90 : 70)
    this.y -= 14
    if (eyebrow) this.eyebrow(eyebrow)
    this.page.drawText(this.safe(text, this.fonts.serifBold), { x: MARGIN, y: this.y - 17, size: 17, font: this.fonts.serifBold, color: INK })
    this.y -= 28
  }

  rule() {
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE.width - MARGIN, y: this.y }, thickness: 0.5, color: FAINT })
    this.y -= 10
  }

  bullets(items: string[], numbered = false) {
    items.forEach((item, index) => {
      const lines = this.wrap(item, this.fonts.sans, 10, COLUMN - 16)
      this.ensure(lines.length * 15 + 4)
      this.page.drawText(numbered ? `${index + 1}.` : "•", { x: MARGIN, y: this.y - 10, size: 10, font: this.fonts.sansBold, color: MUTED })
      for (const line of lines) {
        this.page.drawText(line, { x: MARGIN + 16, y: this.y - 10, size: 10, font: this.fonts.sans, color: INK })
        this.y -= 15
      }
      this.y -= 4
    })
  }
}

function drawSignature(page: PDFPage, model: ExportModel, cx: number, cy: number, radius: number) {
  const scale = radius / SIGNATURE_RADIUS
  const { signature } = model
  const to = (x: number, y: number) => ({ x: cx + x * scale, y: cy - y * scale })

  for (const ringRadius of signature.rings) page.drawCircle({ x: cx, y: cy, size: ringRadius * scale, borderColor: FAINT, borderWidth: 0.5 })
  for (const spoke of signature.spokes) page.drawLine({ start: to(spoke.x1, spoke.y1), end: to(spoke.x2, spoke.y2), thickness: 0.5, color: FAINT })
  if (signature.curve) {
    page.drawSvgPath(signature.curve, { x: cx, y: cy, scale, color: INK, opacity: 0.06, borderColor: INK, borderWidth: 1.1 })
  }
  for (const link of signature.links) {
    page.drawSvgPath(link.d, { x: cx, y: cy, scale, borderColor: INK, borderWidth: 0.7, borderDashArray: [2, 2.5], borderOpacity: 0.7 })
  }
  for (const node of signature.nodes) {
    if (!node.available) {
      const at = to(node.x, node.y)
      page.drawCircle({ x: at.x, y: at.y, size: 4 * scale, borderColor: FAINT, borderWidth: 0.8, borderDashArray: [1.5, 1.5] })
      continue
    }
    const hue = hex(dimensions[node.id].colour)
    const at = to(node.x, node.y)
    page.drawCircle({ x: at.x, y: at.y, size: node.halo * scale, borderColor: hue, borderWidth: 0.7, borderOpacity: 0.8, borderDashArray: node.haloDashed ? [2, 2.5] : undefined })
    for (const satellite of node.satellites) {
      const dot = to(satellite.x, satellite.y)
      page.drawCircle({ x: dot.x, y: dot.y, size: satellite.r * scale, color: hue, opacity: 0.75 })
    }
    page.drawSvgPath(node.path, { x: cx, y: cy, scale, color: hue })
  }
}

function drawContinuum(page: PDFPage, x: number, y: number, width: number, dimension: ExportModel["dimensions"][number]) {
  const spec = dimensions[dimension.id]
  const hue = hex(spec.colour)
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 1, color: FAINT })
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    page.drawLine({ start: { x: x + width * t, y: y - 3 }, end: { x: x + width * t, y: y + 3 }, thickness: 0.5, color: FAINT })
  }
  // The range the answers covered.
  const lo = x + ((dimension.range[0] + 1) / 2) * width
  const hi = x + ((dimension.range[1] + 1) / 2) * width
  page.drawRectangle({ x: lo, y: y - 2.5, width: Math.max(1, hi - lo), height: 5, color: hue, opacity: 0.22 })
  const at = x + ((dimension.position + 1) / 2) * width
  page.drawSvgPath(glyphPath(spec.glyph, 0, 0, 5), { x: at, y: y, scale: 1, color: hue })
}

export async function buildGuidePdf(model: ExportModel): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`${model.name ? `${model.name}: ` : ""}${model.title} — work guide`)
  doc.setAuthor(brand.name)
  doc.setSubject("Personal work guide")
  doc.setCreator(brand.name)
  const fonts: Fonts = {
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    serifItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
    sans: await doc.embedFont(StandardFonts.Helvetica),
    sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
  }
  const w = new Writer(doc, fonts)

  // ── Page 1: cover ──
  w.page.drawRectangle({ x: 0, y: PAGE.height - 150, width: PAGE.width, height: 150, color: PAPER })
  w.page.drawText(w.safe(brand.wordmark.lead, fonts.sansBold), { x: MARGIN, y: PAGE.height - MARGIN - 8, size: 11, font: fonts.sansBold, color: INK })
  const leadWidth = fonts.sansBold.widthOfTextAtSize(brand.wordmark.lead, 11)
  w.page.drawText(w.safe(brand.wordmark.tail, fonts.serifItalic), { x: MARGIN + leadWidth, y: PAGE.height - MARGIN - 8, size: 12, font: fonts.serifItalic, color: INK })
  const tag = model.name ? `${model.name}’s personal work guide` : "Personal work guide"
  const tagWidth = fonts.sans.widthOfTextAtSize(w.safe(tag, fonts.sans), 9)
  w.page.drawText(w.safe(tag, fonts.sans), { x: PAGE.width - MARGIN - tagWidth, y: PAGE.height - MARGIN - 7, size: 9, font: fonts.sans, color: MUTED })
  w.y = PAGE.height - 96
  for (const line of w.wrap(model.title, fonts.serifBold, 30, COLUMN)) {
    w.page.drawText(line, { x: MARGIN, y: w.y - 30, size: 30, font: fonts.serifBold, color: INK })
    w.y -= 34
  }
  w.y -= 6
  w.paragraph(`“${model.statement}”`, { font: fonts.serifItalic, size: 15, leading: 20, after: 20 })

  // Signature and legend.
  const sigRadius = 112
  const sigY = w.y - sigRadius - 18
  drawSignature(w.page, model, MARGIN + sigRadius + 14, sigY, sigRadius)
  const legendX = MARGIN + sigRadius * 2 + 48
  let legendY = w.y - 10
  w.page.drawText("YOUR SIGNATURE", { x: legendX, y: legendY - 8, size: 7.5, font: fonts.sansBold, color: MUTED })
  legendY -= 24
  for (const dimension of model.dimensions) {
    const spec = dimensions[dimension.id]
    w.page.drawSvgPath(glyphPath(spec.glyph, 0, 0, 4.2), { x: legendX + 5, y: legendY - 4, scale: 1, color: hex(spec.colour) })
    w.page.drawText(w.safe(spec.short, fonts.sansBold), { x: legendX + 17, y: legendY - 7, size: 8.5, font: fonts.sansBold, color: INK })
    w.page.drawText(w.safe(dimension.label, fonts.sans), { x: legendX + 17, y: legendY - 18, size: 8.5, font: fonts.sans, color: MUTED })
    legendY -= 29
  }
  w.y = Math.min(sigY - sigRadius - 20, legendY - 4)
  w.paragraph(
    `Reading the signature: each mark sits on its own spoke. Closer to the centre means the first pole of that dimension, further out the second (poles named in the table below). A bigger mark is a clearer lean, a tighter halo means more evidence, and the dots show how consistent your answers were. Neither end is better.`,
    { size: 8.5, color: MUTED, after: 14 },
  )
  w.paragraph(model.lead, { size: 11, leading: 16, after: 8 })

  if (model.patterns.length) {
    w.heading("Patterns worth noticing", "Across your answers")
    for (const pattern of model.patterns) {
      w.paragraph(pattern.title, { font: fonts.sansBold, size: 10, after: 2 })
      w.paragraph(pattern.text, { size: 10, after: 8 })
    }
  }

  w.heading("Your eight dimensions", "In detail")
  for (const dimension of model.dimensions) {
    w.ensure(112)
    const spec = dimensions[dimension.id]
    w.page.drawSvgPath(glyphPath(spec.glyph, 0, 0, 4.5), { x: MARGIN + 5, y: w.y - 6, scale: 1, color: hex(spec.colour) })
    w.page.drawText(w.safe(spec.title, fonts.sansBold), { x: MARGIN + 18, y: w.y - 9, size: 10.5, font: fonts.sansBold, color: INK })
    const labelWidth = fonts.sans.widthOfTextAtSize(w.safe(dimension.label, fonts.sans), 9.5)
    w.page.drawText(w.safe(dimension.label, fonts.sans), { x: PAGE.width - MARGIN - labelWidth, y: w.y - 9, size: 9.5, font: fonts.sans, color: MUTED })
    w.y -= 22
    drawContinuum(w.page, MARGIN + 6, w.y - 4, COLUMN - 12, dimension)
    w.page.drawText(w.safe(dimension.poleA, fonts.sans), { x: MARGIN, y: w.y - 20, size: 7.5, font: fonts.sans, color: MUTED })
    const bWidth = fonts.sans.widthOfTextAtSize(w.safe(dimension.poleB, fonts.sans), 7.5)
    w.page.drawText(w.safe(dimension.poleB, fonts.sans), { x: PAGE.width - MARGIN - bWidth, y: w.y - 20, size: 7.5, font: fonts.sans, color: MUTED })
    w.y -= 30
    w.paragraph(dimension.summary, { size: 9.5, leading: 13.5, after: 2 })
    w.paragraph(`${dimension.evidence}.${dimension.note ? ` ${dimension.note}` : ""}`, { size: 8.5, color: MUTED, leading: 12, after: 12 })
  }

  w.heading("What brings out your best", "Conditions")
  w.bullets(model.best)
  w.heading("Where friction may show up", "Constructively")
  w.bullets(model.friction)

  w.heading("How to work with me", "Share this part")
  w.paragraph("In my own words, edited by me. Preferences, not rules.", { font: fonts.serifItalic, size: 10, color: MUTED, after: 10 })
  for (const item of model.guide) {
    w.ensure(60)
    w.paragraph(item.label, { font: fonts.sansBold, size: 9.5, after: 2 })
    w.paragraph(item.text, { font: fonts.serif, size: 11.5, leading: 16, after: 12 })
  }

  w.heading("Experiments to try", "Small and reversible")
  w.bullets(model.experiments, true)
  w.heading("What colleagues may notice", "Day to day")
  w.bullets(model.notice.map((item) => `${item.text} (${item.support === "supported" ? "well supported by your answers" : "a tentative guess; check it with them"})`))

  w.heading("One last thing", "Closing")
  w.paragraph(model.closing, { font: fonts.serifItalic, size: 14, leading: 20, after: 18 })

  w.ensure(110)
  w.rule()
  w.eyebrow("What this can and can’t tell you")
  for (const caveat of model.caveats) w.paragraph(caveat, { size: 8.5, color: MUTED, leading: 12, after: 4 })

  // Footer on every page.
  const total = w.pages.length
  w.pages.forEach((page, index) => {
    const date = model.date ? ` · ${model.date}` : ""
    const text = pdfSafe(`${brand.name} · self-reported preferences, not a test${date}`, fonts.sans)
    page.drawText(text, { x: MARGIN, y: 30, size: 7.5, font: fonts.sans, color: MUTED })
    const label = `${index + 1} / ${total}`
    page.drawText(label, { x: PAGE.width - MARGIN - fonts.sans.widthOfTextAtSize(label, 7.5), y: 30, size: 7.5, font: fonts.sans, color: MUTED })
  })

  return doc.save()
}

