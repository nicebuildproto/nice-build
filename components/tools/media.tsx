"use client"

import { buttonVariants } from "@/components/ui/button"
import { NumberField } from "@/components/tools/ui"
import { cn } from "@/lib/utils"
import { useState } from "react"

type ImageMode = "resize" | "crop" | "png" | "jpg" | "webp" | "svg" | "base64"

const copy: Record<ImageMode, string> = {
  resize: "Set a width and the height follows, unless you unlock it. The image stays in this browser.",
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
  const [crop, setCrop] = useState({ x: "10", y: "10", w: "80", h: "80" })
  const [result, setResult] = useState<{ url: string; name: string; text?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File) {
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
      } else if (mode === "resize") {
        const target = Math.max(1, Math.round(Number(width) || image.width))
        const ratio = image.height / image.width
        canvas.width = target
        canvas.height = lock ? Math.max(1, Math.round(target * ratio)) : image.height
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

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{copy[mode]}</p>
      {mode === "resize" ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <NumberField label="Width" value={width} onChange={setWidth} suffix="px" min={1} />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={lock} onChange={(event) => setLock(event.target.checked)} className="size-4 accent-[var(--nb-primary)]" />
            Keep proportion
          </label>
        </div>
      ) : null}
      {mode === "crop" ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {(["x", "y", "w", "h"] as const).map((key) => (
            <NumberField key={key} label={key.toUpperCase()} value={crop[key]} onChange={(value) => setCrop((current) => ({ ...current, [key]: value }))} suffix="%" min={0} />
          ))}
        </div>
      ) : null}
      <label className="flex w-fit cursor-pointer flex-col gap-2 text-[13px]">
        File
        <input
          type="file"
          accept={mode === "svg" ? "image/svg+xml,.svg" : mode === "webp" ? "image/webp" : "image/*"}
          className="text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onFile(file)
          }}
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result?.text ? (
        <textarea readOnly value={result.text} rows={6} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
      ) : null}
      {result && !result.text ? (
        <div className="flex flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="" className="max-h-80 w-auto rounded-xl border border-border" />
          <a href={result.url} download={result.name} className={cn(buttonVariants(), "w-fit")}>
            Download
          </a>
        </div>
      ) : null}
    </div>
  )
}

export function FaviconGenerator() {
  const [letter, setLetter] = useState("N")
  const [colour, setColour] = useState("#111111")
  const [url, setUrl] = useState<string | null>(null)

  function draw() {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext("2d")
    if (!context) return
    context.fillStyle = colour
    context.beginPath()
    context.roundRect(0, 0, 64, 64, 12)
    context.fill()
    context.fillStyle = "#ffffff"
    context.font = "600 36px sans-serif"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(letter.trim().slice(0, 2) || "N", 32, 34)
    setUrl(canvas.toDataURL("image/png"))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          Letter
          <input value={letter} maxLength={2} onChange={(event) => setLetter(event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm" />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Colour
          <input type="color" value={colour} onChange={(event) => setColour(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-transparent p-1" />
        </label>
      </div>
      <button type="button" onClick={draw} className={cn(buttonVariants(), "w-fit")}>
        Draw
      </button>
      {url ? (
        <div className="flex flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-16 rounded-xl border border-border" />
          <a href={url} download="favicon.png" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
            Download PNG
          </a>
        </div>
      ) : null}
    </div>
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
