"use client"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function ImageCompressor() {
  return <ImageBench mode="compress" />
}

export function ExifStripper() {
  return <ImageBench mode="strip" />
}

function ImageBench({ mode }: { mode: "compress" | "strip" }) {
  const [quality, setQuality] = useState(mode === "compress" ? 0.7 : 0.92)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ url: string; bytes: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(next: File, nextQuality = quality) {
    setBusy(true)
    setError(null)
    try {
      const image = await loadImage(next)
      const max = 2400
      const scale = Math.min(1, max / Math.max(image.width, image.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Could not read that image.")
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", nextQuality))
      if (!blob) throw new Error("Could not save that image.")
      if (result) URL.revokeObjectURL(result.url)
      setResult({
        url: URL.createObjectURL(blob),
        bytes: blob.size,
        name: next.name.replace(/\.\w+$/, "") + ".jpg",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        {mode === "strip"
          ? "The photo is redrawn in the browser and saved as a new JPEG. Camera and location data are not copied across."
          : "The image stays in this browser. Nothing is uploaded."}
      </p>
      <label className="flex w-fit cursor-pointer flex-col gap-2 text-[13px]">
        Image
        <input
          type="file"
          accept="image/*"
          className="text-sm"
          onChange={(event) => {
            const next = event.target.files?.[0]
            if (!next) return
            setFile(next)
            void run(next)
          }}
        />
      </label>
      {mode === "compress" ? (
        <label className="flex max-w-sm flex-col gap-2 text-[13px]">
          Quality {Math.round(quality * 100)}%
          <input
            type="range"
            min={0.4}
            max={0.92}
            step={0.01}
            value={quality}
            onChange={(event) => {
              const nextQuality = Number(event.target.value)
              setQuality(nextQuality)
              if (file) void run(file, nextQuality)
            }}
          />
        </label>
      ) : null}
      {busy ? <p className="text-sm text-[var(--nb-secondary)]">Working…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {file && result ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--nb-secondary)]">
            {formatBytes(file.size)} → {formatBytes(result.bytes)}
          </p>
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
