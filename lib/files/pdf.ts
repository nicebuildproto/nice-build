import { PDFDocument } from "pdf-lib"

export async function mergePdfBytes(buffers: ArrayBuffer[] | Uint8Array[]) {
  if (buffers.length < 2) throw new Error("Add at least two PDFs to merge.")
  const out = await PDFDocument.create()
  for (const bytes of buffers) {
    const src = await PDFDocument.load(bytes)
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach((page) => out.addPage(page))
  }
  return out.save()
}

export async function pageCount(bytes: ArrayBuffer | Uint8Array) {
  const src = await PDFDocument.load(bytes)
  return src.getPageCount()
}
