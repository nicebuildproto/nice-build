"use client"

import {
  ActionBar,
  FileCard,
  FileDropzone,
  FileToolShell,
  IssueList,
  ModeTabs,
  PreviewFrame,
  PrivacyNote,
  RangeControl,
  ResultStats,
  Section,
  StatusLine,
  uid,
} from "@/components/files/kit"
import { Button } from "@/components/ui/button"
import { CopyButton, ResetButton, selectClass } from "@/components/tools/ui"
import { downloadBytes, downloadText } from "@/lib/tools/download"
import { formatBytes, withSuffix } from "@/lib/files/format"
import { mergePdfBytes, pageCount } from "@/lib/files/pdf"
import { extractPdfText, looksScanned, openPdf, renderPage } from "@/lib/pdf/client"
import { PDFDocument } from "pdf-lib"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"

type Opened = { document: PDFDocumentProxy; bytes: Uint8Array; name: string }

type MergeItem = {
  id: string
  file: File
  pages: number | null
  error?: string
}

export function PdfMerger() {
  const [items, setItems] = useState<MergeItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultName, setResultName] = useState<string | null>(null)

  async function addFiles(files: File[]) {
    setError(null)
    const incoming: MergeItem[] = files.map((file) => ({ id: uid(), file, pages: null }))
    setItems((current) => {
      const room = Math.max(0, 20 - current.length)
      return [...current, ...incoming.slice(0, room)]
    })
    for (const item of incoming) {
      try {
        const pages = await pageCount(await item.file.arrayBuffer())
        setItems((current) => current.map((row) => (row.id === item.id ? { ...row, pages } : row)))
      } catch {
        setItems((current) =>
          current.map((row) => (row.id === item.id ? { ...row, error: "This file could not be read as a PDF." } : row)),
        )
      }
    }
  }

  async function merge() {
    const ready = items.filter((item) => !item.error)
    if (ready.length < 2) {
      setError("Add at least two PDFs to merge.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const buffers = await Promise.all(ready.map((item) => item.file.arrayBuffer()))
      const bytes = await mergePdfBytes(buffers)
      const name = withSuffix(ready[0].file.name, "-merged", "pdf")
      downloadBytes(bytes, name, "application/pdf")
      setResultName(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not merge those PDFs.")
    } finally {
      setBusy(false)
    }
  }

  const totalPages = items.reduce((sum, item) => sum + (item.pages ?? 0), 0)

  return (
    <FileToolShell>
      <PrivacyNote>Your files stay on your device. PDFs are combined in this browser — nothing is uploaded.</PrivacyNote>
      <Section title="PDFs" hint="Order is top to bottom in the merged file. Add up to 20 files.">
        <FileDropzone
          accept="application/pdf,.pdf"
          acceptLabel="PDF"
          maxBytes={25 * 1024 * 1024}
          multiple
          idle="Drop PDFs here, or browse"
          onFiles={(files) => void addFiles(files)}
        />
      </Section>
      {items.length ? (
        <Section title="Order">
          <ul className="flex flex-col gap-2">
            {items.map((item, index) => (
              <li key={item.id}>
                <FileCard
                  name={`${index + 1}. ${item.file.name}`}
                  meta={
                    item.error
                      ? item.error
                      : `${formatBytes(item.file.size)}${item.pages != null ? ` · ${item.pages} page${item.pages === 1 ? "" : "s"}` : " · reading…"}`
                  }
                  onRemove={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                >
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => setItems((current) => move(current, index, -1))}
                    >
                      <ArrowUp className="size-3.5" />
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8"
                      aria-label="Move down"
                      disabled={index === items.length - 1}
                      onClick={() => setItems((current) => move(current, index, 1))}
                    >
                      <ArrowDown className="size-3.5" />
                      Down
                    </Button>
                  </div>
                </FileCard>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <IssueList issues={error ? [error] : []} />
      <StatusLine status={busy ? "processing" : resultName ? "complete" : "idle"}>
        {busy ? "Merging in this browser…" : resultName ? `Saved as ${resultName}` : items.length ? `${items.length} files · ${totalPages} pages` : null}
      </StatusLine>
      <ActionBar>
        <Button type="button" className="h-10" disabled={busy || items.filter((item) => !item.error).length < 2} onClick={() => void merge()}>
          {busy ? "Merging…" : "Merge and download"}
        </Button>
        <ResetButton
          onClick={() => {
            setItems([])
            setError(null)
            setResultName(null)
          }}
        />
      </ActionBar>
    </FileToolShell>
  )
}

export function PdfSigner() {
  const [opened, setOpened] = useState<Opened | null>(null)
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<string | null>(null)
  const [mode, setMode] = useState<"draw" | "type" | "image">("draw")
  const [typed, setTyped] = useState("")
  const [signature, setSignature] = useState<string | null>(null)
  const [box, setBox] = useState({ x: 0.58, y: 0.78, w: 0.32, h: 0.1 })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const drawRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    if (!opened) return
    let cancel = false
    renderPage(opened.document, page)
      .then((result) => {
        if (cancel) return
        setPreview(result.canvas.toDataURL("image/png"))
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not draw that page."))
    return () => {
      cancel = true
    }
  }, [opened, page])

  async function onFile(file: File) {
    setError(null)
    setDone(null)
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

  async function sign() {
    if (!opened || !signature) {
      setError("Add a signature first, then place it on the page.")
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
      const name = withSuffix(opened.name, "-signed", "pdf")
      downloadBytes(bytes, name, "application/pdf")
      setDone(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign that PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <FileToolShell>
      <PrivacyNote>Your files stay on your device. Drawing, typing, or placing a signature happens in this browser. This places an image on the page — it is not a qualified electronic signature.</PrivacyNote>
      <Section title="PDF">
        <FileDropzone accept="application/pdf,.pdf" acceptLabel="PDF" maxBytes={25 * 1024 * 1024} idle="Drop a PDF here, or browse" onFiles={(files) => void onFile(files[0])} />
      </Section>
      <IssueList issues={error ? [error] : []} />
      {opened ? (
        <>
          <Section title="Page">
            <label className="flex max-w-xs flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
              Page {page} of {opened.document.numPages}
              <select className={selectClass} value={page} onChange={(event) => setPage(Number(event.target.value))}>
                {Array.from({ length: opened.document.numPages }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Page {index + 1}
                  </option>
                ))}
              </select>
            </label>
          </Section>
          <Section title="Signature" hint="Draw, type a name, or use an image, then drag it onto the page.">
            <ModeTabs
              label="How to sign"
              value={mode}
              options={[
                { id: "draw", label: "Draw" },
                { id: "type", label: "Type" },
                { id: "image", label: "Image" },
              ]}
              onChange={(id) => setMode(id as typeof mode)}
            />
            {mode === "draw" ? (
              <canvas
                ref={drawRef}
                width={640}
                height={180}
                aria-label="Draw a signature"
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
                  <input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    className="h-10 rounded-lg border border-input bg-transparent px-3 text-lg italic"
                  />
                </label>
                <Button type="button" className="h-10" onClick={typeSignature}>
                  Use this name
                </Button>
              </div>
            ) : null}
            {mode === "image" ? (
              <FileDropzone accept="image/png,image/jpeg,.png,.jpg,.jpeg" acceptLabel="PNG or JPEG" idle="Drop a signature image" onFiles={(files) => setSignature(URL.createObjectURL(files[0]))} />
            ) : null}
          </Section>
          <Section title="Place">
            {preview ? (
              <PreviewFrame className="relative w-full max-w-3xl" label={`Page ${page}`}>
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
                      function moveBox(next: PointerEvent) {
                        setBox((current) => ({
                          ...current,
                          x: Math.min(1 - current.w, Math.max(0, origin.x + (next.clientX - startX) / rect.width)),
                          y: Math.min(1 - current.h, Math.max(0, origin.y + (next.clientY - startY) / rect.height)),
                        }))
                      }
                      function up() {
                        window.removeEventListener("pointermove", moveBox)
                        window.removeEventListener("pointerup", up)
                      }
                      window.addEventListener("pointermove", moveBox)
                      window.addEventListener("pointerup", up)
                    }}
                  />
                ) : null}
              </PreviewFrame>
            ) : (
              <StatusLine status="processing">Rendering page…</StatusLine>
            )}
            {signature ? (
              <RangeControl
                label="Size"
                value={box.w}
                min={0.12}
                max={0.5}
                step={0.01}
                display={`${Math.round(box.w * 100)}% of page width`}
                onChange={(w) => setBox((current) => ({ ...current, w, h: w * 0.28 }))}
              />
            ) : (
              <p className="text-sm text-[var(--nb-secondary)]">Add a signature, then drag it onto the page.</p>
            )}
          </Section>
          <ActionBar>
            <Button type="button" className="h-10" disabled={busy || !signature} onClick={() => void sign()}>
              {busy ? "Signing…" : "Download signed PDF"}
            </Button>
            <ResetButton
              onClick={() => {
                setOpened(null)
                setSignature(null)
                setPreview(null)
                setError(null)
                setDone(null)
              }}
            />
          </ActionBar>
          {done ? <p className="text-sm text-[var(--nb-primary)]">Saved as {done}</p> : null}
        </>
      ) : null}
    </FileToolShell>
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
  const [fileName, setFileName] = useState<string | null>(null)
  const [pages, setPages] = useState(0)
  const opened = useRef<Opened | null>(null)

  async function onFile(file: File) {
    setError(null)
    setText("")
    setBusy(true)
    setFileName(file.name)
    setStatus("Reading PDF…")
    try {
      const next = await openPdf(file)
      opened.current = { ...next, name: file.name }
      setPages(next.document.numPages)
      const extracted = await extractPdfText(next.document)
      const joined = extracted.map((page, index) => (next.document.numPages > 1 ? `--- Page ${index + 1} ---\n${page}` : page)).join("\n\n")
      const scanned = looksScanned(extracted)
      if (!ocr) {
        setText(joined)
        setStatus(
          scanned
            ? "Almost no selectable text — this looks scanned. Use PDF OCR for photographs of pages."
            : `Extracted text from ${next.document.numPages} page${next.document.numPages === 1 ? "" : "s"}.`,
        )
      } else if (!scanned) {
        setText(joined)
        setStatus("This PDF already has selectable text, so OCR was skipped. You can copy or download it as-is.")
      } else {
        setStatus("Scanned page — running OCR in this browser. Language data may be fetched once from a CDN.")
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
        setStatus("OCR finished. Check the text — faint or handwritten pages can still misread.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that PDF.")
    } finally {
      setBusy(false)
    }
  }

  const downloadName = withSuffix(fileName ?? "document.pdf", ocr ? "-ocr" : "-text", "txt")

  return (
    <FileToolShell>
      <PrivacyNote>
        {ocr
          ? "Your PDF stays on this device. Selectable text is used when it exists. Scanned pages run OCR locally with Tesseract — language data may be fetched from a CDN the first time."
          : "Your files stay on your device. This reads the PDF’s text layer. It is not OCR — photographs of pages need PDF OCR."}
      </PrivacyNote>
      <Section title="PDF">
        <FileDropzone accept="application/pdf,.pdf" acceptLabel="PDF" maxBytes={25 * 1024 * 1024} idle="Drop a PDF here, or browse" onFiles={(files) => void onFile(files[0])} />
      </Section>
      <StatusLine status={busy ? "processing" : error ? "failed" : text ? "complete" : "idle"}>
        {busy ? status : !busy && status ? status : null}
      </StatusLine>
      <IssueList issues={error ? [error] : []} />
      {text ? (
        <Section title="Text">
          <ResultStats
            items={[
              { label: "File", value: fileName ?? "—" },
              { label: "Pages", value: String(pages) },
              { label: "Characters", value: String(text.length) },
              { label: "Download", value: downloadName },
            ]}
          />
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={16}
            className="min-h-64 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm leading-relaxed"
          />
          <ActionBar>
            <CopyButton text={text} label="Copy text" />
            <Button type="button" variant="outline" className="h-10" onClick={() => downloadText(text, downloadName)}>
              Download .txt
            </Button>
            <ResetButton
              onClick={() => {
                setText("")
                setStatus(null)
                setError(null)
                setFileName(null)
              }}
            />
          </ActionBar>
        </Section>
      ) : !busy ? (
        <p className="text-sm text-[var(--nb-secondary)]">{ocr ? "Upload a scanned PDF to run OCR, or a digital PDF to extract its text." : "Upload a PDF to extract its selectable text."}</p>
      ) : null}
    </FileToolShell>
  )
}

function move<T>(list: T[], index: number, delta: number) {
  const next = index + delta
  if (next < 0 || next >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}
