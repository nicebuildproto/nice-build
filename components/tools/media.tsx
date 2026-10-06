"use client"

import { ActionRow, ColourInput, CreativeShell, PreviewCanvas, RangeField } from "@/components/design/kit"
import { Button } from "@/components/ui/button"
import { ResetButton } from "@/components/tools/ui"
import { downloadBlob } from "@/lib/tools/download"
import { useEffect, useRef, useState } from "react"

export {
  ImageCropper,
  ImageResizer,
  ImageToBase64,
  JpgToPng,
  PngToJpg,
  SvgToPng,
  WebpToJpg,
} from "@/components/files/images"

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
