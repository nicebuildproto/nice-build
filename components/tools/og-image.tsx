"use client"

import { ErrorNote, FileDrop, ResetButton, ToolNote } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadBlob } from "@/lib/tools/download"
import { canvasToBlob, loadImageFile } from "@/lib/tools/image"
import { useEffect, useRef, useState } from "react"

const WIDTH = 1200
const HEIGHT = 630

export function OpenGraphImageGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [title, setTitle] = useState("A quieter way to share a tool")
  const [subtitle, setSubtitle] = useState("Nice Tools")
  const [background, setBackground] = useState("#111111")
  const [ink, setInk] = useState("#fffdf8")
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const context = canvas.getContext("2d")
    if (!context) return
    context.fillStyle = background
    context.fillRect(0, 0, WIDTH, HEIGHT)
    context.fillStyle = ink
    context.globalAlpha = 0.12
    context.beginPath()
    context.arc(1020, -40, 280, 0, Math.PI * 2)
    context.fill()
    context.globalAlpha = 1
    if (logo) {
      const size = 72
      context.drawImage(logo, 72, 72, size, size)
    }
    context.fillStyle = ink
    context.font = "600 64px ui-sans-serif, system-ui, sans-serif"
    wrap(context, title.trim() || "Untitled", 72, logo ? 210 : 160, 1056, 74)
    context.globalAlpha = 0.7
    context.font = "400 28px ui-sans-serif, system-ui, sans-serif"
    context.fillText(subtitle.trim() || "Nice Tools", 72, 540)
    context.globalAlpha = 1
  }, [title, subtitle, background, ink, logo])

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>A 1200 × 630 image for social cards. Keep the title short; the preview is the file you download.</ToolNote>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          Title
          <Input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10" />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Subtitle
          <Input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="h-10" />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Background
          <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-10 w-full rounded-lg border border-border p-1" />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Text
          <input type="color" value={ink} onChange={(event) => setInk(event.target.value)} className="h-10 w-full rounded-lg border border-border p-1" />
        </label>
      </div>
      <FileDrop
        accept="image/*"
        onFile={async (file) => {
          try {
            setLogo(await loadImageFile(file))
            setError(null)
          } catch {
            setError("Could not read that logo.")
          }
        }}
        idle="Optional logo"
      />
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <canvas ref={canvasRef} className="w-full max-w-3xl rounded-xl border border-border" style={{ aspectRatio: "1200 / 630" }} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-10"
          onClick={async () => {
            const canvas = canvasRef.current
            if (canvas) downloadBlob(await canvasToBlob(canvas), "og-image.png")
          }}
        >
          Download 1200 × 630
        </Button>
        <ResetButton
          onClick={() => {
            setTitle("")
            setSubtitle("")
            setLogo(null)
          }}
        />
      </div>
    </div>
  )
}

function wrap(context: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ""
  let row = 0
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (context.measureText(next).width > max && line) {
      context.fillText(line, x, y + row * lineHeight)
      line = word
      row += 1
      if (row > 3) break
    } else line = next
  }
  if (row <= 3) context.fillText(line, x, y + row * lineHeight)
}
