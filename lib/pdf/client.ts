import type { PDFDocumentProxy } from "pdfjs-dist"

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null

export async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
      return mod
    })
  }
  return pdfjsPromise
}

export async function openPdf(file: File) {
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Choose a PDF file.")
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("That PDF is larger than 25 MB.")
  }
  const pdfjs = await loadPdfjs()
  const data = await file.arrayBuffer()
  const document = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise
  return { document, bytes: new Uint8Array(data) }
}

export async function renderPage(document: PDFDocumentProxy, pageNumber: number, maxWidth = 720) {
  const page = await document.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale = Math.min(2, maxWidth / base.width)
  const viewport = page.getViewport({ scale })
  const canvas = globalThis.document.createElement("canvas")
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not draw that page.")
  await page.render({ canvasContext: context, viewport }).promise
  return { canvas, width: viewport.width, height: viewport.height, pageWidth: base.width, pageHeight: base.height }
}

export async function extractPdfText(document: PDFDocumentProxy) {
  const pages: string[] = []
  for (let i = 1; i <= document.numPages; i += 1) {
    const page = await document.getPage(i)
    const content = await page.getTextContent()
    const lines: string[] = []
    let current = ""
    let lastY: number | null = null
    for (const item of content.items) {
      if (!("str" in item)) continue
      const y = "transform" in item ? Number(item.transform[5]) : 0
      if (lastY !== null && Math.abs(lastY - y) > 4) {
        lines.push(current.trimEnd())
        current = ""
      }
      current += (current && !current.endsWith(" ") && item.str ? " " : "") + item.str
      lastY = y
    }
    if (current.trim()) lines.push(current.trimEnd())
    pages.push(lines.join("\n").trim())
  }
  return pages
}

export function looksScanned(pages: string[]) {
  const text = pages.join("\n").replace(/\s+/g, " ").trim()
  return text.length < 40
}
