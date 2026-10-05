"use client"

import { ErrorNote, FileDrop, NumberField, ResetButton, ToolNote } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { downloadBlob } from "@/lib/tools/download"
import { canvasToBlob, loadImageFile } from "@/lib/tools/image"
import { useEffect, useRef, useState } from "react"

type Tool = "crop" | "arrow" | "rect" | "text" | "blur"
type Shape =
  | { id: string; kind: "arrow"; x1: number; y1: number; x2: number; y2: number }
  | { id: string; kind: "rect"; x: number; y: number; w: number; h: number }
  | { id: string; kind: "text"; x: number; y: number; text: string }
  | { id: string; kind: "blur"; x: number; y: number; w: number; h: number }
  | { id: string; kind: "crop"; x: number; y: number; w: number; h: number }

export function ScreenshotAnnotator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [tool, setTool] = useState<Tool>("arrow")
  const [shapes, setShapes] = useState<Shape[]>([])
  const [draft, setDraft] = useState<Shape | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image, or paste a screenshot.")
      return
    }
    try {
      const image = await loadImageFile(file)
      imageRef.current = image
      setShapes([])
      setDraft(null)
      setReady(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that image.")
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return
    const max = 900
    const scale = Math.min(1, max / image.width)
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const context = canvas.getContext("2d")
    if (!context) return
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const shape of [...shapes, ...(draft ? [draft] : [])]) drawShape(context, shape)
  }, [shapes, draft, ready])

  function pos(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function down(event: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = pos(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    if (tool === "text") {
      const text = window.prompt("Annotation text")
      if (text?.trim()) setShapes((current) => [...current, { id: uid(), kind: "text", x, y, text: text.trim() }])
      return
    }
    if (tool === "arrow") setDraft({ id: "draft", kind: "arrow", x1: x, y1: y, x2: x, y2: y })
    else setDraft({ id: "draft", kind: tool, x, y, w: 0, h: 0 })
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!draft) return
    const { x, y } = pos(event)
    if (draft.kind === "arrow") setDraft({ ...draft, x2: x, y2: y })
    else if (draft.kind !== "text") setDraft({ ...draft, w: x - draft.x, h: y - draft.y })
  }

  function up() {
    if (!draft) return
    if (draft.kind === "crop") {
      applyCrop(draft)
      setDraft(null)
      return
    }
    setShapes((current) => [...current, { ...draft, id: uid() }])
    setDraft(null)
  }

  function applyCrop(shape: Extract<Shape, { kind: "crop" }>) {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return
    const x = Math.min(shape.x, shape.x + shape.w)
    const y = Math.min(shape.y, shape.y + shape.h)
    const w = Math.max(8, Math.abs(shape.w))
    const h = Math.max(8, Math.abs(shape.h))
    const next = document.createElement("canvas")
    next.width = w
    next.height = h
    const context = next.getContext("2d")
    if (!context) return
    context.drawImage(canvas, x, y, w, h, 0, 0, w, h)
    const cropped = new Image()
    cropped.onload = () => {
      imageRef.current = cropped
      setShapes([])
      setReady((value) => !value)
      setReady(true)
    }
    cropped.src = next.toDataURL("image/png")
  }

  async function save() {
    const canvas = canvasRef.current
    if (!canvas) return
    downloadBlob(await canvasToBlob(canvas), "annotated.png")
  }

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>Paste or upload a screenshot, then crop, arrow, box, blur, or label it. Keep it simple — download when it reads clearly.</ToolNote>
      <FileDrop accept="image/*" paste onFile={onFile} idle="Drop a screenshot here, or paste" maxBytes={12 * 1024 * 1024} />
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {ready ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(["crop", "arrow", "rect", "text", "blur"] as const).map((item) => (
              <Button key={item} type="button" variant={tool === item ? "default" : "outline"} className="h-10 capitalize" onClick={() => setTool(item)}>
                {item === "rect" ? "Box" : item}
              </Button>
            ))}
          </div>
          <canvas
            ref={canvasRef}
            className="max-w-full cursor-crosshair touch-none rounded-xl border border-border"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="h-10" onClick={() => void save()}>
              Download PNG
            </Button>
            <ResetButton
              onClick={() => {
                imageRef.current = null
                setShapes([])
                setDraft(null)
                setReady(false)
              }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Upload or paste a screenshot to start.</p>
      )}
    </div>
  )
}

function drawShape(context: CanvasRenderingContext2D, shape: Shape) {
  context.save()
  if (shape.kind === "arrow") {
    context.strokeStyle = "#e11d48"
    context.fillStyle = "#e11d48"
    context.lineWidth = 4
    context.beginPath()
    context.moveTo(shape.x1, shape.y1)
    context.lineTo(shape.x2, shape.y2)
    context.stroke()
    const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1)
    context.beginPath()
    context.moveTo(shape.x2, shape.y2)
    context.lineTo(shape.x2 - 16 * Math.cos(angle - 0.4), shape.y2 - 16 * Math.sin(angle - 0.4))
    context.lineTo(shape.x2 - 16 * Math.cos(angle + 0.4), shape.y2 - 16 * Math.sin(angle + 0.4))
    context.closePath()
    context.fill()
  } else if (shape.kind === "rect" || shape.kind === "crop") {
    context.strokeStyle = shape.kind === "crop" ? "#2563eb" : "#e11d48"
    context.lineWidth = 3
    context.strokeRect(shape.x, shape.y, shape.w, shape.h)
  } else if (shape.kind === "text") {
    context.fillStyle = "#e11d48"
    context.font = "600 22px ui-sans-serif, system-ui, sans-serif"
    context.fillText(shape.text, shape.x, shape.y)
  } else if (shape.kind === "blur") {
    const x = Math.min(shape.x, shape.x + shape.w)
    const y = Math.min(shape.y, shape.y + shape.h)
    const w = Math.max(1, Math.abs(shape.w))
    const h = Math.max(1, Math.abs(shape.h))
    const slice = context.getImageData(x, y, w, h)
    const copy = context.createImageData(w, h)
    const radius = 6
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0
        for (let dy = -radius; dy <= radius; dy += 2) {
          for (let dx = -radius; dx <= radius; dx += 2) {
            const sx = Math.min(w - 1, Math.max(0, px + dx))
            const sy = Math.min(h - 1, Math.max(0, py + dy))
            const i = (sy * w + sx) * 4
            r += slice.data[i]
            g += slice.data[i + 1]
            b += slice.data[i + 2]
            a += slice.data[i + 3]
            count += 1
          }
        }
        const i = (py * w + px) * 4
        copy.data[i] = r / count
        copy.data[i + 1] = g / count
        copy.data[i + 2] = b / count
        copy.data[i + 3] = a / count
      }
    }
    context.putImageData(copy, x, y)
  }
  context.restore()
}

export function ScreenshotBeautifier() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [padding, setPadding] = useState("64")
  const [radius, setRadius] = useState("18")
  const [shadow, setShadow] = useState("32")
  const [background, setBackground] = useState("#ece7de")
  const [chrome, setChrome] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image, or paste a screenshot.")
      return
    }
    try {
      setImage(await loadImageFile(file))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that image.")
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const pad = Math.max(24, Number(padding) || 64)
    const rad = Math.max(0, Number(radius) || 0)
    const shade = Math.max(0, Number(shadow) || 0)
    const chromeH = chrome ? 36 : 0
    canvas.width = image.width + pad * 2
    canvas.height = image.height + pad * 2 + chromeH
    const context = canvas.getContext("2d")
    if (!context) return
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)
    const x = pad
    const y = pad + chromeH
    context.save()
    roundRect(context, x, y - chromeH, image.width, image.height + chromeH, rad + (chrome ? 8 : 0))
    context.shadowColor = "rgba(17,17,17,0.28)"
    context.shadowBlur = shade
    context.shadowOffsetY = Math.round(shade / 4)
    context.fillStyle = "#ffffff"
    context.fill()
    context.restore()
    context.save()
    roundRect(context, x, y - chromeH, image.width, image.height + chromeH, rad + (chrome ? 8 : 0))
    context.clip()
    if (chrome) {
      context.fillStyle = "#f4f1ea"
      context.fillRect(x, y - chromeH, image.width, chromeH)
      ;["#ff5f57", "#febc2e", "#28c840"].forEach((colour, index) => {
        context.beginPath()
        context.fillStyle = colour
        context.arc(x + 18 + index * 16, y - chromeH + 18, 5, 0, Math.PI * 2)
        context.fill()
      })
    }
    context.drawImage(image, x, y)
    context.restore()
  }, [image, padding, radius, shadow, background, chrome])

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>Place a screenshot in a quiet frame — padding, radius, shadow, and optional window chrome — then export a presentation-ready PNG.</ToolNote>
      <FileDrop accept="image/*" paste onFile={onFile} idle="Drop a screenshot here, or paste" maxBytes={12 * 1024 * 1024} />
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {image ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField label="Padding" value={padding} onChange={setPadding} suffix="px" min={24} />
            <NumberField label="Corner radius" value={radius} onChange={setRadius} suffix="px" min={0} />
            <NumberField label="Shadow" value={shadow} onChange={setShadow} suffix="px" min={0} />
            <label className="flex flex-col gap-2 text-[13px]">
              Background
              <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-transparent p-1" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={chrome} onChange={(event) => setChrome(event.target.checked)} />
            Window chrome
          </label>
          <div className="flex flex-wrap gap-2">
            {["#ece7de", "#111111", "#dbeafe", "#fce7f3", "#ecfccb"].map((colour) => (
              <button
                key={colour}
                type="button"
                aria-label={colour}
                onClick={() => setBackground(colour)}
                className="size-8 rounded-full border border-border"
                style={{ background: colour }}
              />
            ))}
          </div>
          <canvas ref={canvasRef} className="max-w-full rounded-xl border border-border" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-10"
              onClick={async () => {
                const canvas = canvasRef.current
                if (canvas) downloadBlob(await canvasToBlob(canvas), "screenshot.png")
              }}
            >
              Download PNG
            </Button>
            <ResetButton
              onClick={() => {
                setImage(null)
                setError(null)
              }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Upload or paste a screenshot to frame it.</p>
      )}
    </div>
  )
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + w, y, x + w, y + h, radius)
  context.arcTo(x + w, y + h, x, y + h, radius)
  context.arcTo(x, y + h, x, y, radius)
  context.arcTo(x, y, x + w, y, radius)
  context.closePath()
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}
