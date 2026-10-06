"use client"

import {
  ActionBar,
  FileCard,
  FileDropzone,
  FileToolShell,
  IssueList,
  PreviewFrame,
  PrivacyNote,
  RangeControl,
  ResultStats,
  Section,
  StatusLine,
  uid,
} from "@/components/files/kit"
import { Button } from "@/components/ui/button"
import { NumberField, CopyButton, ResetButton } from "@/components/tools/ui"
import { clamp, formatBytes, percentChange, withSuffix } from "@/lib/files/format"
import { canvasToBlob, loadImageFile } from "@/lib/tools/image"
import { downloadBlob } from "@/lib/tools/download"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
const SOCIAL = [
  { id: "reels", label: "Instagram Reels", width: 1080, height: 1920, safe: true },
  { id: "shorts", label: "YouTube Shorts", width: 1080, height: 1920, safe: false },
  { id: "tiktok", label: "TikTok", width: 1080, height: 1920, safe: false },
  { id: "linkedin", label: "LinkedIn banner", width: 1584, height: 396, safe: false },
] as const

type BenchItem = {
  id: string
  file: File
  previewUrl: string
  status: "processing" | "complete" | "failed"
  error?: string
  result?: {
    url: string
    blob: Blob
    name: string
    width: number
    height: number
    originalWidth: number
    originalHeight: number
  }
}

export function ImageCompressor() {
  return <ImageBench mode="compress" />
}

export function ExifStripper() {
  return <ImageBench mode="strip" />
}

function ImageBench({ mode }: { mode: "compress" | "strip" }) {
  const [quality, setQuality] = useState(mode === "compress" ? 0.7 : 0.92)
  const [capEdge, setCapEdge] = useState(mode === "compress")
  const [items, setItems] = useState<BenchItem[]>([])
  const [busy, setBusy] = useState(false)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl)
        if (item.result?.url) URL.revokeObjectURL(item.result.url)
      }
    }
  }, [])

  async function processFile(file: File, nextQuality: number, nextCap: boolean): Promise<BenchItem["result"]> {
    const image = await loadImageFile(file)
    const max = nextCap ? 2400 : 8000
    const scale = Math.min(1, max / Math.max(image.width, image.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("This browser could not draw that image.")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const outW = canvas.width
    const outH = canvas.height
    const blob = await canvasToBlob(canvas, "image/jpeg", nextQuality)
    canvas.width = 0
    canvas.height = 0
    return {
      url: URL.createObjectURL(blob),
      blob,
      name: withSuffix(file.name, mode === "compress" ? "-compressed" : "-clean", "jpg"),
      width: outW,
      height: outH,
      originalWidth: image.width,
      originalHeight: image.height,
    }
  }

  async function addFiles(files: File[]) {
    const room = Math.max(0, 12 - itemsRef.current.length)
    const incoming = files.slice(0, room).map((file) => ({
      id: uid(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "processing" as const,
    }))
    if (!incoming.length) return
    setItems((current) => [...current, ...incoming])
    setBusy(true)
    for (const item of incoming) {
      try {
        const result = await processFile(item.file, quality, capEdge)
        setItems((current) => current.map((row) => (row.id === item.id ? { ...row, status: "complete", result } : row)))
      } catch (err) {
        setItems((current) =>
          current.map((row) =>
            row.id === item.id
              ? { ...row, status: "failed", error: err instanceof Error ? err.message : "Could not process that image." }
              : row,
          ),
        )
      }
    }
    setBusy(false)
  }

  async function reprocess(nextQuality = quality, nextCap = capEdge) {
    const current = itemsRef.current
    if (!current.length) return
    setBusy(true)
    for (const item of current) {
      setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, status: "processing", error: undefined } : row)))
      try {
        const result = await processFile(item.file, nextQuality, nextCap)
        if (item.result?.url) URL.revokeObjectURL(item.result.url)
        setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, status: "complete", result } : row)))
      } catch (err) {
        setItems((rows) =>
          rows.map((row) =>
            row.id === item.id
              ? { ...row, status: "failed", error: err instanceof Error ? err.message : "Could not process that image." }
              : row,
          ),
        )
      }
    }
    setBusy(false)
  }

  function clearAll() {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl)
      if (item.result?.url) URL.revokeObjectURL(item.result.url)
    }
    setItems([])
  }

  const done = items.filter((item) => item.status === "complete" && item.result)
  const failed = items.filter((item) => item.status === "failed")

  return (
    <FileToolShell>
      <PrivacyNote>
        {mode === "strip"
          ? "Your files stay on your device. Pixels are copied onto a fresh canvas and saved as a new JPEG, so camera and location metadata are not carried across."
          : "Your files stay on your device. Each image is redrawn in this browser and offered as a new JPEG — the original is not replaced."}
      </PrivacyNote>
      <Section title="Files" hint={mode === "compress" ? "Add up to 12 photos. They are processed one at a time." : "Add photos to strip metadata. Up to 12 at a time."}>
        <FileDropzone
          accept={IMAGE_ACCEPT}
          acceptLabel="JPEG, PNG, WebP, or GIF"
          maxBytes={25 * 1024 * 1024}
          multiple
          idle="Drop images here, or browse"
          onFiles={(files) => void addFiles(files)}
        />
      </Section>
      {mode === "compress" ? (
        <Section title="Output">
          <RangeControl
            label="Quality"
            value={quality}
            min={0.4}
            max={0.92}
            step={0.01}
            display={`${Math.round(quality * 100)}%`}
            onChange={(value) => {
              setQuality(value)
              void reprocess(value, capEdge)
            }}
          />
          <label className="flex items-center gap-2 text-sm text-[var(--nb-primary)]">
            <input
              type="checkbox"
              checked={capEdge}
              onChange={(event) => {
                const next = event.target.checked
                setCapEdge(next)
                void reprocess(quality, next)
              }}
              className="size-4 accent-[var(--nb-primary)]"
            />
            Cap the long edge at 2,400 pixels
          </label>
        </Section>
      ) : null}
      <StatusLine status={busy ? "processing" : failed.length ? "failed" : done.length ? "complete" : "idle"}>
        {busy
          ? mode === "compress"
            ? "Compressing in this browser…"
            : "Redrawing without metadata…"
          : items.length
            ? `${done.length} ready${failed.length ? `, ${failed.length} failed` : ""}`
            : null}
      </StatusLine>
      {items.length ? (
        <Section title="Results">
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const change = item.result ? percentChange(item.file.size, item.result.blob.size) : null
              return (
                <li key={item.id}>
                  <FileCard
                    name={item.file.name}
                    meta={`${formatBytes(item.file.size)}${item.result ? ` → ${formatBytes(item.result.blob.size)}` : ""}`}
                    previewUrl={item.result?.url ?? item.previewUrl}
                    onRemove={() => {
                      URL.revokeObjectURL(item.previewUrl)
                      if (item.result?.url) URL.revokeObjectURL(item.result.url)
                      setItems((current) => current.filter((row) => row.id !== item.id))
                    }}
                  >
                    {item.status === "processing" ? <p className="mt-1 text-xs text-[var(--nb-secondary)]">Working…</p> : null}
                    {item.error ? <p className="mt-1 text-xs text-destructive">{item.error}</p> : null}
                    {item.result ? (
                      <p className="mt-1 text-xs text-[var(--nb-secondary)]">
                        {item.result.originalWidth}×{item.result.originalHeight} → {item.result.width}×{item.result.height}
                        {change !== null ? ` · ${change > 0 ? `${change}% smaller` : change < 0 ? `${Math.abs(change)}% larger` : "same size"}` : ""}
                        {` · ${item.result.name}`}
                      </p>
                    ) : null}
                    {item.result ? (
                      <Button type="button" variant="outline" className="mt-2 h-8" onClick={() => downloadBlob(item.result!.blob, item.result!.name)}>
                        Download
                      </Button>
                    ) : null}
                  </FileCard>
                </li>
              )
            })}
          </ul>
          <ActionBar>
            {done.length > 1 ? (
              <Button
                type="button"
                className="h-10"
                onClick={() => {
                  done.forEach((item, index) => {
                    window.setTimeout(() => {
                      if (item.result) downloadBlob(item.result.blob, item.result.name)
                    }, index * 250)
                  })
                }}
              >
                Download all
              </Button>
            ) : null}
            <ResetButton onClick={clearAll} />
          </ActionBar>
        </Section>
      ) : null}
    </FileToolShell>
  )
}

type StudioMode = "resize" | "crop" | "png" | "jpg" | "webp" | "svg" | "base64"

const studioCopy: Record<StudioMode, string> = {
  resize: "Set a width and the height follows, unless you unlock it. Social presets cover-crop to a fixed frame. Your files stay on your device.",
  crop: "Set the keep-region as percentages of the original. A dashed box shows what you’ll download — the source file stays put.",
  png: "The JPEG is redrawn as a PNG in this browser.",
  jpg: "The image is redrawn as a JPEG. Transparent pixels become white.",
  webp: "The WebP is redrawn as a JPEG in this browser.",
  svg: "The SVG is drawn onto a canvas and saved as a PNG.",
  base64: "The file is read locally and shown as a data URL you can paste into CSS or HTML.",
}

export function ImageResizer() {
  return <ImageStudio mode="resize" />
}
export function ImageCropper() {
  return <ImageStudio mode="crop" />
}
export function JpgToPng() {
  return <ImageStudio mode="png" />
}
export function PngToJpg() {
  return <ImageStudio mode="jpg" />
}
export function WebpToJpg() {
  return <ImageStudio mode="webp" />
}
export function SvgToPng() {
  return <ImageStudio mode="svg" />
}
export function ImageToBase64() {
  return <ImageStudio mode="base64" />
}

function ImageStudio({ mode }: { mode: StudioMode }) {
  const [width, setWidth] = useState("800")
  const [lock, setLock] = useState(true)
  const [presetId, setPresetId] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 })
  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; blob?: Blob; name: string; text?: string; bytes: number; width?: number; height?: number } | null>(null)
  const [original, setOriginal] = useState<{ width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<File | null>(null)
  const preset = SOCIAL.find((item) => item.id === presetId) ?? null

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
      if (result?.url.startsWith("blob:")) URL.revokeObjectURL(result.url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function draw(next: File, options: { preset: (typeof SOCIAL)[number] | null; width: string; lock: boolean; crop: typeof crop }) {
    setBusy(true)
    setError(null)
    try {
      if (mode === "base64") {
        const text = await readDataUrl(next)
        if (result?.url.startsWith("blob:")) URL.revokeObjectURL(result.url)
        setResult({ url: text, name: next.name, text, bytes: next.size })
        return
      }
      const image = await loadImageFile(next)
      setOriginal({ width: image.width, height: image.height })
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (!context) throw new Error("This browser could not draw that image.")
      if (mode === "crop") {
        const x = clamp(options.crop.x / 100, 0, 0.99)
        const y = clamp(options.crop.y / 100, 0, 0.99)
        const w = clamp(options.crop.w / 100, 0.01, 1 - x)
        const h = clamp(options.crop.h / 100, 0.01, 1 - y)
        canvas.width = Math.max(1, Math.round(image.width * w))
        canvas.height = Math.max(1, Math.round(image.height * h))
        context.drawImage(image, image.width * x, image.height * y, image.width * w, image.height * h, 0, 0, canvas.width, canvas.height)
      } else if (mode === "resize" && options.preset) {
        canvas.width = options.preset.width
        canvas.height = options.preset.height
        const scale = Math.max(canvas.width / image.width, canvas.height / image.height)
        const drawnWidth = image.width * scale
        const drawnHeight = image.height * scale
        context.drawImage(image, (canvas.width - drawnWidth) / 2, (canvas.height - drawnHeight) / 2, drawnWidth, drawnHeight)
      } else if (mode === "resize") {
        const target = Math.max(1, Math.round(Number(options.width) || image.width))
        const ratio = image.height / image.width
        canvas.width = target
        canvas.height = options.lock ? Math.max(1, Math.round(target * ratio)) : image.height
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
      } else {
        canvas.width = image.width
        canvas.height = image.height
        if (mode === "jpg" || mode === "webp") {
          context.fillStyle = "#ffffff"
          context.fillRect(0, 0, canvas.width, canvas.height)
        }
        context.drawImage(image, 0, 0)
      }
      const mime = mode === "png" || mode === "svg" || mode === "crop" ? "image/png" : "image/jpeg"
      const blob = await canvasToBlob(canvas, mime, mime === "image/jpeg" ? 0.92 : undefined)
      const outW = canvas.width
      const outH = canvas.height
      canvas.width = 0
      canvas.height = 0
      if (result?.url.startsWith("blob:")) URL.revokeObjectURL(result.url)
      const suffix =
        mode === "resize" ? `-${outW}w` : mode === "crop" ? "-cropped" : mode === "svg" || mode === "png" ? "" : ""
      const extension = mime === "image/png" ? "png" : "jpg"
      setResult({
        url: URL.createObjectURL(blob),
        blob,
        name: withSuffix(next.name, suffix, extension),
        bytes: blob.size,
        width: outW,
        height: outH,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.")
    } finally {
      setBusy(false)
    }
  }

  function onFile(next: File) {
    fileRef.current = next
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    setSourceUrl(URL.createObjectURL(next))
    setFile(next)
    void draw(next, { preset, width, lock, crop })
  }

  const accept =
    mode === "svg"
      ? "image/svg+xml,.svg"
      : mode === "webp"
        ? "image/webp,.webp"
        : mode === "png"
          ? "image/jpeg,.jpg,.jpeg"
          : mode === "jpg"
            ? "image/png,.png"
            : IMAGE_ACCEPT

  const acceptLabel =
    mode === "svg" ? "SVG" : mode === "webp" ? "WebP" : mode === "png" ? "JPEG" : mode === "jpg" ? "PNG" : "JPEG, PNG, WebP, or GIF"

  return (
    <FileToolShell>
      <PrivacyNote>{studioCopy[mode]}</PrivacyNote>
      {mode === "resize" ? (
        <Section title="Size">
          <div className="flex flex-wrap gap-2">
            {SOCIAL.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPresetId(item.id)
                  setWidth(String(item.width))
                  const current = fileRef.current
                  if (current) void draw(current, { preset: item, width: String(item.width), lock, crop })
                }}
                className={cn(
                  "h-10 rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  presetId === item.id ? "border-[var(--nb-primary)] bg-[var(--nb-accent)] text-[var(--nb-primary)]" : "border-border text-[var(--nb-secondary)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <NumberField
                label="Width"
                value={width}
                onChange={(value) => {
                  setWidth(value)
                  setPresetId(null)
                  const current = fileRef.current
                  if (current) void draw(current, { preset: null, width: value, lock, crop })
                }}
                suffix="px"
                min={1}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={lock}
                onChange={(event) => {
                  const next = event.target.checked
                  setLock(next)
                  setPresetId(null)
                  const current = fileRef.current
                  if (current) void draw(current, { preset: null, width, lock: next, crop })
                }}
                className="size-4 accent-[var(--nb-primary)]"
              />
              Keep proportion
            </label>
          </div>
          {preset ? (
            <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
              {preset.label} is {preset.width}×{preset.height}. The photo is cover-cropped into that frame.
              {preset.safe ? " The dashed box is a visual safe zone for a Reel. It is not drawn into the download." : ""}
            </p>
          ) : null}
        </Section>
      ) : null}
      {mode === "crop" ? (
        <Section title="Crop" hint="Left and top are the start of the keep-region. Width and height are how much to keep.">
          <div className="grid gap-4 sm:grid-cols-4">
            {(
              [
                ["x", "Left"],
                ["y", "Top"],
                ["w", "Width"],
                ["h", "Height"],
              ] as const
            ).map(([key, label]) => (
              <NumberField
                key={key}
                label={label}
                value={String(crop[key])}
                onChange={(value) => {
                  const next = { ...crop, [key]: clamp(Number(value) || 0, 0, 100) }
                  setCrop(next)
                  const current = fileRef.current
                  if (current) void draw(current, { preset, width, lock, crop: next })
                }}
                suffix="%"
                min={0}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="File">
        <FileDropzone
          accept={accept}
          acceptLabel={acceptLabel}
          maxBytes={25 * 1024 * 1024}
          idle="Drop an image here, or browse"
          onFiles={(files) => onFile(files[0])}
        />
      </Section>
      <IssueList issues={error ? [error] : []} />
      <StatusLine status={busy ? "processing" : result ? "complete" : "idle"}>
        {busy ? "Processing in this browser…" : null}
      </StatusLine>
      {file && sourceUrl && mode === "crop" ? (
        <PreviewFrame label="Crop overlay" className="relative w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sourceUrl} alt="Original" className="max-h-80 w-auto" />
          <div
            className="pointer-events-none absolute border-2 border-dashed border-white/90"
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.w}%`,
              height: `${crop.h}%`,
            }}
          />
        </PreviewFrame>
      ) : null}
      {result?.text ? (
        <Section title="Data URL">
          <textarea readOnly value={result.text} rows={6} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs" />
          <p className="text-xs text-[var(--nb-secondary)]">
            About {formatBytes(result.text.length)} as text — typically larger than the original file.
          </p>
          <CopyButton text={result.text} label="Copy data URL" />
        </Section>
      ) : null}
      {result && !result.text ? (
        <Section title="Result">
          <ResultStats
            items={[
              { label: "Original", value: file ? `${file.name} · ${formatBytes(file.size)}` : "—" },
              { label: "Download", value: `${result.name} · ${formatBytes(result.bytes)}` },
              ...(original && result.width && result.height
                ? [{ label: "Pixels", value: `${original.width}×${original.height} → ${result.width}×${result.height}` }]
                : []),
              ...(file
                ? [
                    {
                      label: "Size change",
                      value:
                        percentChange(file.size, result.bytes) > 0
                          ? `${percentChange(file.size, result.bytes)}% smaller`
                          : percentChange(file.size, result.bytes) < 0
                            ? `${Math.abs(percentChange(file.size, result.bytes))}% larger`
                            : "Same size",
                    },
                  ]
                : []),
            ]}
          />
          <PreviewFrame className="relative w-fit max-w-full" label="Result preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url} alt={result.name} className="max-h-80 w-auto" />
            {preset?.safe ? (
              <div className="pointer-events-none absolute rounded-md border border-dashed border-white" style={{ top: "14%", right: "6%", bottom: "20%", left: "6%" }} />
            ) : null}
          </PreviewFrame>
          <ActionBar>
            <Button
              type="button"
              className="h-10"
              onClick={() => {
                if (result.blob) downloadBlob(result.blob, result.name)
              }}
            >
              Download
            </Button>
            <ResetButton
              onClick={() => {
                if (sourceUrl) URL.revokeObjectURL(sourceUrl)
                if (result.url.startsWith("blob:")) URL.revokeObjectURL(result.url)
                fileRef.current = null
                setFile(null)
                setSourceUrl(null)
                setResult(null)
                setOriginal(null)
                setError(null)
              }}
            />
          </ActionBar>
        </Section>
      ) : null}
    </FileToolShell>
  )
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read that file."))
    reader.readAsDataURL(file)
  })
}
