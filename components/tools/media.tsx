"use client"

import { ActionRow, ColourInput, CreativeShell, PreviewCanvas, RangeField } from "@/components/design/kit"
import { buttonVariants, Button } from "@/components/ui/button"
import { CopyButton, FileDrop, NumberField, ResetButton } from "@/components/tools/ui"
import { downloadBlob } from "@/lib/tools/download"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

type ImageMode = "resize" | "crop" | "png" | "jpg" | "webp" | "svg" | "base64"

const socialPresets = [
  { id: "reels", label: "Instagram Reels", width: 1080, height: 1920, safe: true },
  { id: "shorts", label: "YouTube Shorts", width: 1080, height: 1920, safe: false },
  { id: "tiktok", label: "TikTok", width: 1080, height: 1920, safe: false },
  { id: "linkedin", label: "LinkedIn banner", width: 1584, height: 396, safe: false },
] as const

const copy: Record<ImageMode, string> = {
  resize: "Set a width and the height follows, unless you unlock it. Social presets cover-crop to a fixed frame. The image stays in this browser.",
  crop: "The crop is a percentage of the original. Nothing is uploaded.",
  png: "The JPEG is redrawn as a PNG in this browser.",
  jpg: "The image is redrawn as a JPEG. A transparent background becomes white.",
  webp: "The WebP is redrawn as a JPEG in this browser.",
  svg: "The SVG is drawn onto a canvas and saved as a PNG.",
  base64: "The file is read locally and shown as a data URL.",
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

function ImageStudio({ mode }: { mode: ImageMode }) {
  const [width, setWidth] = useState("800")
  const [lock, setLock] = useState(true)
  const [presetId, setPresetId] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: "10", y: "10", w: "80", h: "80" })
  const [result, setResult] = useState<{ url: string; name: string; text?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<File | null>(null)
  const preset = socialPresets.find((item) => item.id === presetId) ?? null

  async function draw(file: File, options: { preset: (typeof socialPresets)[number] | null; width: string; lock: boolean }) {
    setError(null)
    try {
      if (mode === "base64") {
        const text = await readDataUrl(file)
        if (result?.url.startsWith("blob:")) URL.revokeObjectURL(result.url)
        setResult({ url: text, name: file.name, text })
        return
      }
      const image = await loadImage(file)
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Could not draw that image.")
      if (mode === "crop") {
        const x = clamp((Number(crop.x) || 0) / 100, 0, 1)
        const y = clamp((Number(crop.y) || 0) / 100, 0, 1)
        const w = clamp((Number(crop.w) || 100) / 100, 0.01, 1 - x)
        const h = clamp((Number(crop.h) || 100) / 100, 0.01, 1 - y)
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
      const mime = mode === "png" || mode === "svg" ? "image/png" : "image/jpeg"
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92))
      if (!blob) throw new Error("Could not save that image.")
      if (result?.url.startsWith("blob:")) URL.revokeObjectURL(result.url)
      const extension = mime === "image/png" ? "png" : "jpg"
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace(/\.\w+$/, "") + "." + extension })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.")
    }
  }

  function onFile(file: File) {
    fileRef.current = file
    void draw(file, { preset, width, lock })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{copy[mode]}</p>
      {mode === "resize" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {socialPresets.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPresetId(item.id)
                  setWidth(String(item.width))
                  const file = fileRef.current
                  if (file) void draw(file, { preset: item, width: String(item.width), lock })
                }}
                className={cn(
                  "h-10 rounded-lg border px-3 text-sm",
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
                  const file = fileRef.current
                  if (file) void draw(file, { preset: null, width: value, lock })
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
                  const file = fileRef.current
                  if (file) void draw(file, { preset: null, width, lock: next })
                }}
                className="size-4 accent-[var(--nb-primary)]"
              />
              Keep proportion
            </label>
          </div>
          {preset ? (
            <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
              {preset.label} is {preset.width}×{preset.height}. The photo is cover-cropped into that frame.
              {preset.safe ? " The dashed box is a visual safe zone for a Reel. It is not drawn into the download, and it is not an official Instagram template." : ""}
            </p>
          ) : null}
        </div>
      ) : null}
      {mode === "crop" ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {(["x", "y", "w", "h"] as const).map((key) => (
            <NumberField key={key} label={key.toUpperCase()} value={crop[key]} onChange={(value) => setCrop((current) => ({ ...current, [key]: value }))} suffix="%" min={0} />
          ))}
        </div>
      ) : null}
      <FileDrop
        accept={mode === "svg" ? "image/svg+xml,.svg" : mode === "webp" ? "image/webp" : "image/*"}
        onFile={(file) => void onFile(file)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result?.text ? (
        <div className="flex flex-col gap-4">
          <textarea readOnly value={result.text} rows={6} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
          <CopyButton text={result.text} label="Copy result" />
        </div>
      ) : null}
      {result && !result.text ? (
        <div className="flex flex-col gap-4">
          <div className="relative w-fit max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url} alt={result.name} className="max-h-80 w-auto rounded-xl border border-border" />
            {preset?.safe ? (
              <div
                className="pointer-events-none absolute rounded-md border border-dashed border-white"
                style={{ top: "14%", right: "6%", bottom: "20%", left: "6%" }}
              />
            ) : null}
          </div>
          <a href={result.url} download={result.name} className={cn(buttonVariants(), "w-fit")}>
            Download
          </a>
        </div>
      ) : null}
    </div>
  )
}

export function FaviconGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const midRef = useRef<HTMLCanvasElement>(null)
  const smallRef = useRef<HTMLCanvasElement>(null)
  const [letter, setLetter] = useState("N")
  const [background, setBackground] = useState("#111111")
  const [ink, setInk] = useState("#ffffff")
  const [radius, setRadius] = useState(12)

  useEffect(() => {
    for (const canvas of [canvasRef.current, midRef.current, smallRef.current]) {
      if (!canvas) continue
      canvas.width = 64
      canvas.height = 64
      const context = canvas.getContext("2d")
      if (!context) continue
      context.clearRect(0, 0, 64, 64)
      context.fillStyle = background
      context.beginPath()
      context.roundRect(0, 0, 64, 64, Math.min(32, Math.max(0, radius)))
      context.fill()
      context.fillStyle = ink
      context.font = "600 36px ui-sans-serif, system-ui, sans-serif"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(letter.trim().slice(0, 2) || "N", 32, 34)
    }
  }, [background, ink, letter, radius])

  return (
    <CreativeShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
          Letter
          <input
            value={letter}
            maxLength={2}
            onChange={(event) => setLetter(event.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
          />
        </label>
        <RangeField label="Corner" value={radius} min={0} max={32} suffix="px" onChange={setRadius} />
        <ColourInput label="Background" value={background} onChange={setBackground} />
        <ColourInput label="Letter colour" value={ink} onChange={setInk} />
      </div>
      <PreviewCanvas className="flex flex-wrap items-end gap-8 bg-[var(--nb-accent)]/35 px-6 py-8" label="Favicon preview">
        <canvas ref={canvasRef} width={64} height={64} className="size-16" aria-label="64 pixel favicon" />
        <canvas ref={midRef} width={64} height={64} className="size-8" aria-hidden="true" />
        <canvas ref={smallRef} width={64} height={64} className="size-4" aria-hidden="true" />
      </PreviewCanvas>
      <p className="text-[12px] text-[var(--nb-secondary)]">Shown at 64, 32, and 16 pixels. The download is a 64 × 64 PNG.</p>
      <ActionRow>
        <Button
          type="button"
          className="h-10"
          onClick={async () => {
            const canvas = canvasRef.current
            if (!canvas) return
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
            if (blob) downloadBlob(blob, "favicon.png")
          }}
        >
          Download PNG
        </Button>
        <ResetButton
          onClick={() => {
            setLetter("N")
            setBackground("#111111")
            setInk("#ffffff")
            setRadius(12)
          }}
        />
      </ActionRow>
    </CreativeShell>
  )
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("This browser could not open that image."))
    }
    image.src = url
  })
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read that file."))
    reader.readAsDataURL(file)
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
