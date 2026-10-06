import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import {
  copySummary,
  filenameFor,
  formatAud,
  formatDateAu,
  parsedLines,
  totalsFor,
  type BusinessDocument,
} from "./document"

const PAGE = { width: 595.28, height: 841.89 }
const MARGIN = 48
const INK = rgb(0.067, 0.067, 0.067)
const MUTED = rgb(0.42, 0.45, 0.5)
const RULE = rgb(0.88, 0.88, 0.88)

function wrap(font: PDFFont, text: string, size: number, max: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > max && current) {
      lines.push(current)
      current = word
    } else current = next
  }
  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

export async function documentPdf(doc: BusinessDocument) {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const totals = totalsFor(doc)
  const noun = doc.kind === "invoice" ? "INVOICE" : "QUOTE"
  let page = pdf.addPage([PAGE.width, PAGE.height])
  let y = PAGE.height - MARGIN

  function addPage() {
    page = pdf.addPage([PAGE.width, PAGE.height])
    y = PAGE.height - MARGIN
  }

  function ensure(space: number) {
    if (y < MARGIN + space) addPage()
  }

  function text(target: PDFPage, value: string, x: number, pos: number, size: number, font: PDFFont, color = INK) {
    target.drawText(value, { x, y: pos, size, font, color })
  }

  function block(font: PDFFont, value: string, x: number, size: number, max: number, color = INK) {
    const rows = value.split("\n").flatMap((line) => wrap(font, line, size, max))
    rows.forEach((line, index) => {
      text(page, line, x, y - index * (size + 3), size, font, color)
    })
    return rows.length * (size + 3)
  }

  text(page, noun, MARGIN, y, 22, bold)
  const numberWidth = bold.widthOfTextAtSize(doc.number || "", 12)
  text(page, doc.number || "", PAGE.width - MARGIN - numberWidth, y + 4, 12, bold)
  y -= 18
  text(page, "Amounts in AUD", MARGIN, y, 9, regular, MUTED)
  y -= 26

  const col = (PAGE.width - MARGIN * 2 - 24) / 2
  text(page, "From", MARGIN, y, 9, bold, MUTED)
  text(page, "Bill to", MARGIN + col + 24, y, 9, bold, MUTED)
  y -= 14
  const left = [
    doc.from.name,
    doc.from.address,
    doc.from.email,
    doc.from.phone,
    doc.from.abn ? `ABN ${doc.from.abn}` : "",
  ]
    .filter(Boolean)
    .join("\n")
  const right = [doc.to.name, doc.to.address, doc.to.email, doc.to.phone].filter(Boolean).join("\n")
  const leftH = block(regular, left || "—", MARGIN, 10, col)
  const rightH = (() => {
    const rows = (right || "—").split("\n").flatMap((line) => wrap(regular, line, 10, col))
    rows.forEach((line, index) => {
      text(page, line, MARGIN + col + 24, y - index * 13, 10, regular)
    })
    return rows.length * 13
  })()
  y -= Math.max(leftH, rightH) + 18

  const meta = [
    `Issued ${formatDateAu(doc.issueDate)}`,
    doc.dueDate ? `${doc.kind === "invoice" ? "Due" : "Valid until"} ${formatDateAu(doc.dueDate)}` : "",
    doc.terms,
    doc.project ? `Project ${doc.project}` : "",
  ].filter(Boolean)
  ensure(24)
  text(page, meta.join("   ·   "), MARGIN, y, 9, regular, MUTED)
  y -= 22

  const cols = [MARGIN, 330, 390, 455]
  text(page, "Description", cols[0], y, 9, bold, MUTED)
  text(page, "Qty", cols[1], y, 9, bold, MUTED)
  text(page, "Rate", cols[2], y, 9, bold, MUTED)
  text(page, "Amount", cols[3], y, 9, bold, MUTED)
  y -= 8
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE.width - MARGIN, y }, thickness: 0.6, color: RULE })
  y -= 16

  for (const line of parsedLines(doc.lines)) {
    if (!line.description.trim() && line.amount === null) continue
    const desc = wrap(regular, line.description || "—", 10, 270)
    ensure(desc.length * 13 + 20)
    desc.forEach((row, index) => {
      text(page, row, cols[0], y - index * 13, 10, regular)
    })
    text(page, line.qty || "—", cols[1], y, 10, regular)
    text(page, line.rateValue === null ? "—" : formatAud(line.rateValue), cols[2], y, 10, regular)
    text(page, line.amount === null ? "—" : formatAud(line.amount), cols[3], y, 10, regular)
    y -= Math.max(16, desc.length * 13 + 6)
  }

  ensure(110)
  y -= 6
  page.drawLine({ start: { x: 330, y }, end: { x: PAGE.width - MARGIN, y }, thickness: 0.6, color: RULE })
  y -= 18
  const taxLabel = doc.taxInclusive ? `GST included (${doc.taxRate || 0}%)` : `GST (${doc.taxRate || 0}%)`
  const rows: [string, string, boolean][] = [
    ["Subtotal", formatAud(totals.subtotal), false],
    [taxLabel, formatAud(totals.tax), false],
    [doc.kind === "invoice" ? "Amount due" : "Quoted total", formatAud(totals.total), true],
  ]
  for (const [label, value, strong] of rows) {
    const font = strong ? bold : regular
    const size = strong ? 12 : 10
    text(page, label, 330, y, size, font)
    text(page, value, PAGE.width - MARGIN - font.widthOfTextAtSize(value, size), y, size, font)
    y -= strong ? 20 : 16
  }

  if (doc.notes.trim()) {
    ensure(48)
    y -= 10
    text(page, "Notes", MARGIN, y, 9, bold, MUTED)
    y -= 14
    const noteRows = doc.notes.split("\n").flatMap((line) => wrap(regular, line, 10, PAGE.width - MARGIN * 2))
    for (const row of noteRows) {
      ensure(16)
      text(page, row, MARGIN, y, 10, regular, MUTED)
      y -= 13
    }
  }

  const bytes = await pdf.save()
  return { bytes, filename: filenameFor(doc), text: copySummary(doc) }
}
