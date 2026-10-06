import assert from "node:assert/strict"
import test from "node:test"
import { PDFDocument } from "pdf-lib"
import { mergePdfBytes, pageCount } from "./pdf.ts"

async function onePagePdf() {
  const doc = await PDFDocument.create()
  doc.addPage([200, 200])
  return doc.save()
}

test("mergePdfBytes concatenates pages in order", async () => {
  const a = await onePagePdf()
  const b = await onePagePdf()
  const merged = await mergePdfBytes([a, b])
  assert.equal(await pageCount(merged), 2)
})

test("mergePdfBytes requires two files", async () => {
  const a = await onePagePdf()
  await assert.rejects(() => mergePdfBytes([a]), /at least two/)
})
