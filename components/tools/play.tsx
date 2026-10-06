"use client"

import { NumberField, TextArea } from "@/components/tools/ui"
import { buttonVariants } from "@/components/ui/button"
import { ppi } from "@/lib/tools/pure"
import { cn } from "@/lib/utils"
import QRCode from "qrcode"
import { useEffect, useRef, useState } from "react"

const keys = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"]

export function QrCodeGenerator() {
  const [text, setText] = useState("https://nice-build-ten.vercel.app")
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    QRCode.toDataURL(text || " ", { margin: 1, width: 280, color: { dark: "#111111", light: "#ffffff" } })
      .then((next) => {
        if (!cancel) {
          setUrl(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancel) setError("That text is too long for a QR code.")
      })
    return () => {
      cancel = true
    }
  }, [text])

  return (
    <div className="flex flex-col gap-6">
      <TextArea label="Text or URL" value={text} onChange={setText} rows={3} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {url ? (
        <div className="flex flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-56 rounded-xl border border-border" />
          <a href={url} download="qr-code.png" className={cn(buttonVariants(), "w-fit")}>
            Download
          </a>
        </div>
      ) : null}
    </div>
  )
}

export { MarkdownPreview } from "@/components/text/views"
export { CookingTimer, StopwatchTool, WheelSpinner, WorldClock } from "@/components/everyday/views"

export function BitcoinHalvingCountdown() {
  const target = Date.UTC(2028, 3, 20)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  const left = now === null ? null : Math.max(0, target - now)
  const days = left === null ? "—" : String(Math.floor(left / 86400000))
  return (
    <div className="flex flex-col gap-4">
      <p className="text-5xl font-semibold tabular-nums">{days}<span className="ml-2 text-lg font-medium text-[var(--nb-secondary)]">days</span></p>
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Estimated for 20 April 2028, from the April 2024 halving and a 10 minute block. The network moves the real date.
      </p>
    </div>
  )
}

export function ScreenPpiCalculator() {
  const [width, setWidth] = useState("1512")
  const [height, setHeight] = useState("982")
  const [diagonal, setDiagonal] = useState("14")
  const [ratio, setRatio] = useState(1)
  useEffect(() => setRatio(window.devicePixelRatio || 1), [])
  const cssWidth = Number(width)
  const cssHeight = Number(height)
  const size = Number(diagonal)
  const value = cssWidth && cssHeight && size ? ppi(cssWidth * ratio, cssHeight * ratio, size) : null
  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        CSS pixels are multiplied by this screen’s device pixel ratio ({ratio}).
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="CSS width" value={width} onChange={setWidth} suffix="px" />
        <NumberField label="CSS height" value={height} onChange={setHeight} suffix="px" />
        <NumberField label="Diagonal" value={diagonal} onChange={setDiagonal} suffix="in" />
      </div>
      <p className="text-3xl font-semibold tabular-nums">{value ? value.toFixed(1) : "—"} <span className="text-lg text-[var(--nb-secondary)]">PPI</span></p>
    </div>
  )
}

export function KeyboardTester() {
  const [down, setDown] = useState<string[]>([])
  useEffect(() => {
    const add = (event: KeyboardEvent) => {
      setDown((current) => (current.includes(event.key.toLowerCase()) ? current : [...current, event.key.toLowerCase()]))
    }
    const remove = (event: KeyboardEvent) => setDown((current) => current.filter((key) => key !== event.key.toLowerCase()))
    window.addEventListener("keydown", add)
    window.addEventListener("keyup", remove)
    return () => {
      window.removeEventListener("keydown", add)
      window.removeEventListener("keyup", remove)
    }
  }, [])
  return (
    <div className="flex flex-col gap-3">
      {keys.map((row) => (
        <div key={row} className="flex flex-wrap gap-1.5">
          {row.split("").map((key) => (
            <span key={key} className={cn("grid h-10 min-w-10 place-items-center rounded-lg border border-border text-sm uppercase", down.includes(key) && "bg-[var(--nb-primary)] text-background")}>
              {key}
            </span>
          ))}
        </div>
      ))}
      <p className="text-sm text-[var(--nb-secondary)]">{down.at(-1) ? `Last key: ${down.at(-1)}` : "Press a key."}</p>
    </div>
  )
}

export function MouseTester() {
  const [point, setPoint] = useState({ x: 0, y: 0, clicks: 0, button: "—" })
  return (
    <div
      className="grid h-56 place-items-center rounded-xl border border-border text-center"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setPoint((current) => ({ ...current, x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) }))
      }}
      onMouseDown={(event) => setPoint((current) => ({ ...current, clicks: current.clicks + 1, button: ["Left", "Middle", "Right"][event.button] ?? "Other" }))}
    >
      <div>
        <p className="text-3xl font-semibold tabular-nums">{point.x}, {point.y}</p>
        <p className="mt-2 text-sm text-[var(--nb-secondary)]">{point.button} · {point.clicks} clicks</p>
      </div>
    </div>
  )
}

export function GamepadTester() {
  const pad = usePad()
  if (!pad) return <p className="text-sm text-[var(--nb-secondary)]">Press a button on a connected controller.</p>
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{pad.id}</p>
      <div className="flex flex-wrap gap-2">
        {pad.buttons.map((button, index) => (
          <span key={index} className={cn("grid size-9 place-items-center rounded-full border border-border text-xs tabular-nums", button.pressed && "bg-[var(--nb-primary)] text-background")}>
            {index}
          </span>
        ))}
      </div>
      <div className="grid gap-2 text-sm tabular-nums sm:grid-cols-2">
        {pad.axes.map((axis, index) => (
          <div key={index}>Axis {index}: {axis.toFixed(2)}</div>
        ))}
      </div>
    </div>
  )
}

export function DeadZoneTester() {
  const pad = usePad()
  const [zone, setZone] = useState("0.15")
  const limit = Number(zone) || 0
  const axes = pad?.axes ?? []
  return (
    <div className="flex flex-col gap-6">
      <div className="w-40">
        <NumberField label="Dead zone" value={zone} onChange={setZone} min={0} step="0.01" />
      </div>
      {axes.length ? (
        <div className="grid gap-3">
          {axes.map((axis, index) => {
            const applied = Math.abs(axis) < limit ? 0 : axis
            return (
              <div key={index} className="text-sm tabular-nums">
                Axis {index} raw {axis.toFixed(2)} · applied {applied.toFixed(2)}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Move a stick on a connected controller.</p>
      )}
    </div>
  )
}

export function ReactionTimeTest() {
  const [phase, setPhase] = useState<"idle" | "wait" | "now" | "early" | "done">("idle")
  const [ms, setMs] = useState<number | null>(null)
  const start = useRef(0)
  const timer = useRef(0)

  function begin() {
    setPhase("wait")
    setMs(null)
    timer.current = window.setTimeout(() => {
      start.current = performance.now()
      setPhase("now")
    }, 800 + Math.random() * 2200)
  }

  function click() {
    if (phase === "idle" || phase === "done" || phase === "early") {
      begin()
      return
    }
    if (phase === "wait") {
      window.clearTimeout(timer.current)
      setPhase("early")
      return
    }
    setMs(Math.round(performance.now() - start.current))
    setPhase("done")
  }

  return (
    <button type="button" onClick={click} className={cn("grid h-56 w-full place-items-center rounded-xl border border-border text-2xl font-semibold", phase === "now" && "bg-[var(--nb-primary)] text-background")}>
      {phase === "idle" ? "Click to start" : phase === "wait" ? "Wait…" : phase === "now" ? "Click" : phase === "early" ? "Too soon" : `${ms} ms`}
    </button>
  )
}

export function CpsTest() {
  const [left, setLeft] = useState<number | null>(null)
  const [clicks, setClicks] = useState(0)
  useEffect(() => {
    if (left === null || left <= 0) return
    const id = window.setTimeout(() => setLeft((current) => (current === null ? null : current - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [left])
  const running = left !== null && left > 0
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="grid h-40 place-items-center rounded-xl border border-border text-4xl font-semibold"
        onClick={() => {
          if (!running) {
            setClicks(1)
            setLeft(5)
          } else setClicks((current) => current + 1)
        }}
      >
        {running ? clicks : left === 0 ? clicks : "Click"}
      </button>
      <p className="text-sm text-[var(--nb-secondary)]">{left === 0 ? `${(clicks / 5).toFixed(1)} clicks a second` : running ? `${left}s` : "Five seconds, as many clicks as you can."}</p>
    </div>
  )
}

export function RefreshRateTester() {
  const [fps, setFps] = useState<number | null>(null)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let mark = last
    let id = 0
    const loop = (now: number) => {
      frames += 1
      if (now - mark >= 500) {
        setFps(Math.round((frames * 1000) / (now - mark)))
        frames = 0
        mark = now
      }
      setOffset(((now - last) / 8) % 100)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className="flex flex-col gap-6">
      <p className="text-5xl font-semibold tabular-nums">{fps ?? "—"} <span className="text-lg text-[var(--nb-secondary)]">fps</span></p>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--nb-accent)]">
        <div className="h-full w-1/5 rounded-full bg-[var(--nb-primary)]" style={{ marginLeft: `${offset}%` }} />
      </div>
    </div>
  )
}

function usePad() {
  const [pad, setPad] = useState<Gamepad | null>(null)
  useEffect(() => {
    let id = 0
    const loop = () => {
      const next = navigator.getGamepads?.().find((item) => item) ?? null
      setPad(next)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
  return pad
}
