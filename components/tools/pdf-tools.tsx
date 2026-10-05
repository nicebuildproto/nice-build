"use client"

import { CopyButton, ErrorNote, FileDrop, ResetButton, ToolNote, selectClass } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { downloadBytes, downloadText } from "@/lib/tools/download"
import { extractPdfText, looksScanned, openPdf, renderPage } from "@/lib/pdf/client"
import { PDFDocument } from "pdf-lib"
import { useEffect, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"

type Opened = { document: PDFDocumentProxy; bytes: Uint8Array; name: string }

export function PdfSigner() {
  const [opened, setOpened] = useState<Opened | null>(null)
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState({ width: 1, height: 1, pageWidth: 1, pageHeight: 1 })
  const [mode, setMode] = useState<"draw" | "type" | "image">("draw")
  const [typed, setTyped] = useState("Ada Lovelace")
  const [signature, setSignature] = useState<string | null>(null)
  const [box, setBox] = useState({ x: 0.58, y: 0.78, w: 0.32, h: 0.1 })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const drawRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    if (!opened) return
    let cancel = false
    renderPage(opened.document, page)
      .then((result) => {
        if (cancel) return
        setPageSize({ width: result.width, height: result.height, pageWidth: result.pageWidth, pageHeight: result.pageHeight })
        setPreview(result.canvas.toDataURL("image/png"))
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not draw that page."))
    return () => {
      cancel = true
    }
  }, [opened, page])

  async function onFile(file: File) {
    setError(null)
    try {
      const next = await openPdf(file)
      setOpened({ ...next, name: file.name })
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that PDF.")
      setOpened(null)
    }
  }

  function pointer(event: React.PointerEvent<HTMLCanvasElement>, end = false) {
    const canvas = drawRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height
    const context = canvas.getContext("2d")
    if (!context) return
    if (event.type === "pointerdown") {
      drawing.current = true
      canvas.setPointerCapture(event.pointerId)
      context.beginPath()
      context.moveTo(x, y)
    } else if (drawing.current) {
      context.lineTo(x, y)
      context.strokeStyle = "#111111"
      context.lineWidth = 3
      context.lineCap = "round"
      context.lineJoin = "round"
      context.stroke()
    }
    if (end) {
      drawing.current = false
      setSignature(canvas.toDataURL("image/png"))
    }
  }

  function typeSignature() {
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 180
    const context = canvas.getContext("2d")
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = "#111111"
    context.font = "italic 64px Georgia, serif"
    context.textBaseline = "middle"
    context.fillText(typed.trim() || "Signature", 24, 90)
    setSignature(canvas.toDataURL("image/png"))
  }

  async function onSigFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose a PNG or JPEG signature image.")
      return
    }
    const url = URL.createObjectURL(file)
    setSignature(url)
  }

  async function sign() {
    if (!opened || !signature) {
      setError("Add a signature first.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const pdf = await PDFDocument.load(opened.bytes)
      const target = pdf.getPages()[page - 1]
      if (!target) throw new Error("That page is missing.")
      const pngBytes = await (await fetch(signature)).arrayBuffer()
      const image = await pdf.embedPng(pngBytes).catch(async () => pdf.embedJpg(pngBytes))
      const width = box.w * target.getWidth()
      const height = box.h * target.getHeight()
      const x = box.x * target.getWidth()
      const y = (1 - box.y - box.h) * target.getHeight()
      target.drawImage(image, { x, y, width, height })
      const bytes = await pdf.save()
      downloadBytes(bytes, opened.name.replace(/\.pdf$/i, "") + "-signed.pdf", "application/pdf")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign that PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>The PDF stays in this browser. Draw, type, or upload a signature, place it on a page, then download a signed copy.</ToolNote>
      <FileDrop accept="application/pdf,.pdf" onFile={onFile} idle="Drop a PDF here, or browse" maxBytes={25 * 1024 * 1024} />
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {opened ? (
        <>
          <label className="flex max-w-xs flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
            Page
            <select className={selectClass} value={page} onChange={(event) => setPage(Number(event.target.value))}>
              {Array.from({ length: opened.document.numPages }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} of {opened.document.numPages}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {(["draw", "type", "image"] as const).map((item) => (
              <Button key={item} type="button" variant={mode === item ? "default" : "outline"} className="h-10 capitalize" onClick={() => setMode(item)}>
                {item}
              </Button>
            ))}
          </div>
          {mode === "draw" ? (
            <canvas
              ref={drawRef}
              width={640}
              height={180}
              className="w-full max-w-xl cursor-crosshair rounded-xl border border-border bg-white touch-none"
              onPointerDown={pointer}
              onPointerMove={(event) => pointer(event)}
              onPointerUp={(event) => pointer(event, true)}
              onPointerLeave={(event) => pointer(event, true)}
            />
          ) : null}
          {mode === "type" ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-56 flex-1 flex-col gap-2 text-[13px]">
                Name
                <input value={typed} onChange={(event) => setTyped(event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-3 text-lg italic" />
              </label>
              <Button type="button" className="h-10" onClick={typeSignature}>
                Use this name
              </Button>
            </div>
          ) : null}
          {mode === "image" ? <FileDrop accept="image/png,image/jpeg" onFile={onSigFile} idle="Drop a signature image" /> : null}
          {preview ? (
            <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={`Page ${page}`} className="block w-full" />
              {signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signature}
                  alt="Signature"
                  draggable={false}
                  className="absolute cursor-move"
                  style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
                  onPointerDown={(event) => {
                    const parent = event.currentTarget.parentElement
                    if (!parent) return
                    const rect = parent.getBoundingClientRect()
                    const startX = event.clientX
                    const startY = event.clientY
                    const origin = { ...box }
                    function move(next: PointerEvent) {
                      setBox((current) => ({
                        ...current,
                        x: Math.min(1 - current.w, Math.max(0, origin.x + (next.clientX - startX) / rect.width)),
                        y: Math.min(1 - current.h, Math.max(0, origin.y + (next.clientY - startY) / rect.height)),
                      }))
                    }
                    function up() {
                      window.removeEventListener("pointermove", move)
                      window.removeEventListener("pointerup", up)
                    }
                    window.addEventListener("pointermove", move)
                    window.addEventListener("pointerup", up)
                  }}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[var(--nb-secondary)]">Rendering page…</p>
          )}
          {signature ? (
            <label className="flex max-w-xs flex-col gap-2 text-[13px]">
              Size
              <input
                type="range"
                min={0.12}
                max={0.5}
                step={0.01}
                value={box.w}
                onChange={(event) => {
                  const w = Number(event.target.value)
                  setBox((current) => ({ ...current, w, h: w * (pageSize.height ? 0.28 : 0.1) }))
                }}
              />
            </label>
          ) : (
            <p className="text-sm text-[var(--nb-secondary)]">Add a signature, then drag it onto the page.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="h-10" disabled={busy || !signature} onClick={() => void sign()}>
              {busy ? "Signing…" : "Download signed PDF"}
            </Button>
            <ResetButton
              onClick={() => {
                setOpened(null)
                setSignature(null)
                setPreview(null)
                setError(null)
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

export function PdfOcr() {
  return <PdfTextTool ocr />
}

export function PdfToText() {
  return <PdfTextTool ocr={false} />
}

function PdfTextTool({ ocr }: { ocr: boolean }) {
  const [text, setText] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const opened = useRef<Opened | null>(null)

  async function onFile(file: File) {
    setError(null)
    setText("")
    setBusy(true)
    setStatus("Reading PDF…")
    try {
      const next = await openPdf(file)
      opened.current = { ...next, name: file.name }
      const pages = await extractPdfText(next.document)
      const joined = pages.map((page, index) => (next.document.numPages > 1 ? `--- Page ${index + 1} ---\n${page}` : page)).join("\n\n")
      const scanned = looksScanned(pages)
      if (!ocr) {
        setText(joined)
        setStatus(scanned ? "Almost no selectable text — this looks scanned. Try PDF OCR." : `Extracted text from ${next.document.numPages} page${next.document.numPages === 1 ? "" : "s"}.`)
      } else if (!scanned) {
        setText(joined)
        setStatus("This PDF already has selectable text, so OCR was skipped.")
      } else {
        setStatus("Scanned page — running OCR in this browser. The first pass can take a minute.")
        const { createWorker } = await import("tesseract.js")
        const worker = await createWorker("eng")
        const chunks: string[] = []
        for (let i = 1; i <= next.document.numPages; i += 1) {
          setStatus(`OCR page ${i} of ${next.document.numPages}…`)
          const rendered = await renderPage(next.document, i, 1400)
          const result = await worker.recognize(rendered.canvas)
          chunks.push(next.document.numPages > 1 ? `--- Page ${i} ---\n${result.data.text.trim()}` : result.data.text.trim())
        }
        await worker.terminate()
        setText(chunks.join("\n\n"))
        setStatus("OCR finished. Check the text — photographs and faint scans can still misread.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>
        {ocr
          ? "Extract selectable text when it exists. If the PDF is a scan, OCR runs locally with Tesseract — nothing is uploaded."
          : "Pull the selectable text out of a PDF in this browser. Scanned pages need the OCR tool."}
      </ToolNote>
      <FileDrop accept="application/pdf,.pdf" onFile={onFile} idle="Drop a PDF here, or browse" maxBytes={25 * 1024 * 1024} />
      {busy ? <p className="text-sm text-[var(--nb-secondary)]">{status ?? "Working…"}</p> : null}
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {!busy && status ? <p className="text-sm text-[var(--nb-primary)]">{status}</p> : null}
      {text ? (
        <>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={16}
            className="min-h-64 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton text={text} label="Copy text" />
            <Button type="button" variant="outline" className="h-10" onClick={() => downloadText(text, "extracted.txt")}>
              Download .txt
            </Button>
            <ResetButton
              onClick={() => {
                setText("")
                setStatus(null)
                setError(null)
              }}
            />
          </div>
        </>
      ) : !busy ? (
        <p className="text-sm text-[var(--nb-secondary)]">Upload a PDF to extract its text.</p>
      ) : null}
    </div>
  )
}
