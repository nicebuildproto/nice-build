"use client"

import {
  ActionBar,
  CopyButton,
  GamingToolShell,
  HardwareStatus,
  LimitNote,
  MetricCard,
  Note,
  ResetButton,
  ResultDisplay,
  TestArea,
  useCoarsePointer,
} from "@/components/gaming/kit"
import { NumberField } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import {
  applyAxialDeadzone,
  applyRadialDeadzone,
  axisLabel,
  buttonLabel,
  buttonShortLabel,
  mouseButtonName,
  padsEqual,
  snapshotPad,
  type PadSnapshot,
} from "@/lib/gaming/input"
import { describeKey, keyboardRows } from "@/lib/gaming/keyboard"
import { average, cpsFromClicks, randomWaitMs, remainingWindow } from "@/lib/gaming/timing"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

function usePad() {
  const [pad, setPad] = useState<PadSnapshot | null>(null)
  useEffect(() => {
    let id = 0
    const loop = () => {
      const live = navigator.getGamepads?.().find((item) => item) ?? null
      const next = live ? snapshotPad(live) : null
      setPad((current) => (padsEqual(current, next) ? current : next))
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])
  return pad
}

export function GamepadTester() {
  const pad = usePad()
  const coarse = useCoarsePointer()
  const pressed = pad?.buttons.filter((button) => button.pressed).length ?? 0

  async function rumble() {
    const live = navigator.getGamepads?.().find((item) => item)
    const actuator = live?.vibrationActuator
    if (!actuator) return
    try {
      await actuator.playEffect("dual-rumble", { duration: 200, strongMagnitude: 0.6, weakMagnitude: 0.4 })
    } catch {
      /* not supported */
    }
  }

  return (
    <GamingToolShell>
      <HardwareStatus
        state={pad ? "live" : "waiting"}
        detail={pad ? `${pad.id}` : "Press a button on a connected controller so the browser can see it."}
      />
      {coarse ? (
        <LimitNote>
          Phones can work with a Bluetooth pad, but Safari and some Android browsers expose buttons poorly. This is a
          desktop tester first.
        </LimitNote>
      ) : null}
      <Note>No extra permission is asked. The Gamepad API only reports a pad after it has been used on this page.</Note>
      {pad ? (
        <>
          <Note>
            Mapping: {pad.mapping || "none"}. {pad.mapping === "standard" ? "Labels follow the W3C standard gamepad slots." : "This pad is not standard-mapped, so only indices are trustworthy."}
          </Note>
          <div className="flex flex-wrap gap-2">
            {pad.buttons.map((button, index) => (
              <span
                key={index}
                title={buttonLabel(index, String(pad.mapping))}
                className={cn(
                  "grid min-h-11 min-w-11 place-items-center rounded-lg border border-border px-1.5 text-center text-[11px] leading-tight",
                  button.pressed && "bg-[var(--nb-primary)] text-background",
                )}
              >
                <span className="sr-only">
                  {buttonLabel(index, String(pad.mapping))} {button.pressed ? "pressed" : "released"}
                  {button.value > 0 && button.value < 1 ? `, analog ${button.value.toFixed(2)}` : ""}
                </span>
                <span aria-hidden>
                  {buttonShortLabel(index, String(pad.mapping))}
                  {button.pressed ? " ●" : ""}
                </span>
                {button.value > 0 && button.value < 1 ? (
                  <span aria-hidden className="block text-[10px] tabular-nums">
                    {button.value.toFixed(2)}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
          <p className="text-sm text-[var(--nb-secondary)]">{pressed} button{pressed === 1 ? "" : "s"} down</p>
          <div className="grid gap-2 text-sm tabular-nums sm:grid-cols-2">
            {pad.axes.map((axis, index) => (
              <div key={index}>
                {axisLabel(index, String(pad.mapping))}: {axis.toFixed(2)}
              </div>
            ))}
          </div>
          <StickPreview axes={pad.axes} />
          <ActionBar>
            <Button type="button" variant="outline" className="h-10" onClick={() => void rumble()}>
              Test rumble
            </Button>
            <CopyButton text={`${pad.id}\n${pad.buttons.map((button, index) => `${buttonLabel(index, String(pad.mapping))}: ${button.pressed ? button.value : 0}`).join("\n")}`} />
          </ActionBar>
        </>
      ) : null}
    </GamingToolShell>
  )
}

function StickPreview({ axes, labels }: { axes: number[]; labels?: [string, string] }) {
  const sticks = [
    { label: labels?.[0] ?? "Left stick", x: axes[0] ?? 0, y: axes[1] ?? 0 },
    { label: labels?.[1] ?? "Right stick", x: axes[2] ?? 0, y: axes[3] ?? 0 },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sticks.map((stick) => (
        <div key={stick.label}>
          <p className="mb-2 text-[13px] text-[var(--nb-secondary)]">{stick.label}</p>
          <div className="relative size-28 rounded-full border border-border bg-[var(--nb-accent)]">
            <span
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--nb-primary)]"
              style={{ left: `${50 + stick.x * 40}%`, top: `${50 + stick.y * 40}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DeadZoneTester() {
  const pad = usePad()
  const [zone, setZone] = useState("0.15")
  const [mode, setMode] = useState<"axial" | "radial" | "radial-scaled">("axial")
  const limit = Number(zone) || 0
  const axes = pad?.axes ?? []
  const left = { x: axes[0] ?? 0, y: axes[1] ?? 0 }
  const applied =
    mode === "axial"
      ? { x: applyAxialDeadzone(left.x, limit), y: applyAxialDeadzone(left.y, limit), mag: Math.hypot(left.x, left.y) }
      : applyRadialDeadzone(left.x, left.y, limit, mode === "radial-scaled")

  return (
    <GamingToolShell>
      <HardwareStatus
        state={pad ? "live" : "waiting"}
        detail={pad ? "Move a stick. Applied values are what a game would read after that dead zone." : "Connect a controller and press a button first."}
      />
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <NumberField label="Dead zone" value={zone} onChange={setZone} min={0} step="0.01" />
        <label className="flex flex-col gap-2 text-[13px]">
          Shape
          <select
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={mode}
            onChange={(event) => setMode(event.target.value as "axial" | "radial" | "radial-scaled")}
          >
            <option value="axial">Axial (each axis)</option>
            <option value="radial">Radial cutoff</option>
            <option value="radial-scaled">Radial scaled</option>
          </select>
        </label>
      </div>
      {pad ? (
        <div className="flex flex-col gap-3 text-sm tabular-nums">
          <p>
            Left stick raw {left.x.toFixed(2)}, {left.y.toFixed(2)}
          </p>
          <p>
            Applied {applied.x.toFixed(2)}, {applied.y.toFixed(2)}
            {Math.hypot(applied.x, applied.y) === 0 ? " · ignored as drift" : ""}
          </p>
          <StickPreview axes={[left.x, left.y, applied.x, applied.y]} labels={["Raw left stick", "After dead zone"]} />
          {axes.map((axis, index) => (
            <div key={index}>
              {axisLabel(index, String(pad.mapping))} raw {axis.toFixed(2)} · axial {applyAxialDeadzone(axis, limit).toFixed(2)}
            </div>
          ))}
        </div>
      ) : null}
      <Note>
        This does not change the controller. Radial cutoff zeros the stick inside the circle; scaled remaps the rest of
        the throw to 0–1.
      </Note>
    </GamingToolShell>
  )
}

export function KeyboardTester() {
  const [down, setDown] = useState<string[]>([])
  const [last, setLast] = useState<ReturnType<typeof describeKey> | null>(null)
  const [capture, setCapture] = useState(false)
  const coarse = useCoarsePointer()

  useEffect(() => {
    const add = (event: KeyboardEvent) => {
      if (capture) event.preventDefault()
      setDown((current) => (current.includes(event.code) ? current : [...current, event.code]))
      setLast(describeKey(event))
    }
    const remove = (event: KeyboardEvent) => setDown((current) => current.filter((code) => code !== event.code))
    const clear = () => setDown([])
    window.addEventListener("keydown", add)
    window.addEventListener("keyup", remove)
    window.addEventListener("blur", clear)
    return () => {
      window.removeEventListener("keydown", add)
      window.removeEventListener("keyup", remove)
      window.removeEventListener("blur", clear)
    }
  }, [capture])

  return (
    <GamingToolShell>
      {coarse ? (
        <LimitNote>
          A phone keyboard is not a full hardware keyboard. This tester is meant for a physical keyboard on a computer.
        </LimitNote>
      ) : null}
      <Note>Keys light when they are down. The readout uses event.code (physical) and event.key (character). Colour is not the only signal — a ● marks a held key.</Note>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={capture} onChange={(event) => setCapture(event.target.checked)} className="size-4" />
        Capture keys on this page (blocks browser shortcuts while this tab is focused)
      </label>
      <div className="flex flex-col gap-1.5 overflow-x-auto">
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1">
            {row.map((key) => {
              const held = down.includes(key.code)
              return (
                <span
                  key={key.code}
                  className={cn(
                    "grid h-9 place-items-center rounded-md border border-border px-1.5 text-[11px] uppercase",
                    key.wide === "sm" && "min-w-12",
                    key.wide === "md" && "min-w-16",
                    key.wide === "lg" && "min-w-24",
                    !key.wide && "min-w-8",
                    held && "bg-[var(--nb-primary)] text-background",
                  )}
                >
                  {key.label}
                  {held ? " ●" : ""}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <p className="text-sm text-[var(--nb-secondary)]">
        {last
          ? `Last: key “${last.key}” · code ${last.code} · ${last.location}${last.repeat ? " · repeat" : ""}${last.mods.length ? ` · ${last.mods.join("+")}` : ""}`
          : "Press a key."}
      </p>
      {last ? <CopyButton text={`${last.key} / ${last.code}`} /> : null}
    </GamingToolShell>
  )
}

export function MouseTester() {
  const coarse = useCoarsePointer()
  const [point, setPoint] = useState({ x: 0, y: 0, movementX: 0, movementY: 0 })
  const [held, setHeld] = useState<number[]>([])
  const [clicks, setClicks] = useState(0)
  const [last, setLast] = useState("—")
  const [wheel, setWheel] = useState(0)

  return (
    <GamingToolShell>
      {coarse ? (
        <LimitNote>Touch is not a mouse. Clicks and wheel here need a pointer device. This pad will not invent a polling rate or DPI.</LimitNote>
      ) : null}
      <TestArea label="Mouse test pad" className="relative h-56 overflow-hidden">
        <div
          className="grid h-full place-items-center text-center"
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            setPoint({
              x: Math.round(event.clientX - rect.left),
              y: Math.round(event.clientY - rect.top),
              movementX: event.movementX,
              movementY: event.movementY,
            })
          }}
          onPointerDown={(event) => {
            setHeld((current) => (current.includes(event.button) ? current : [...current, event.button]))
            setClicks((count) => count + 1)
            setLast(mouseButtonName(event.button))
          }}
          onPointerUp={(event) => setHeld((current) => current.filter((button) => button !== event.button))}
          onPointerLeave={() => setHeld([])}
          onContextMenu={(event) => event.preventDefault()}
          onWheel={(event) => {
            event.preventDefault()
            setWheel((current) => current + event.deltaY)
          }}
        >
          <div>
            <p className="text-3xl font-semibold tabular-nums">
              {point.x}, {point.y}
            </p>
            <p className="mt-2 text-sm text-[var(--nb-secondary)]">
              {last} · {clicks} clicks · held {held.length ? held.map(mouseButtonName).join(", ") : "none"}
            </p>
            <p className="mt-1 text-sm text-[var(--nb-secondary)]">
              movement {point.movementX}, {point.movementY} · wheel {Math.round(wheel)}
            </p>
          </div>
        </div>
      </TestArea>
      <Note>
        Coordinates are pixels inside the pad, not screen DPI. movementX/Y is what the browser reports, not a measured
        sensor rate.
      </Note>
      <ResetButton
        onClick={() => {
          setClicks(0)
          setWheel(0)
          setLast("—")
          setHeld([])
        }}
      />
    </GamingToolShell>
  )
}

export function ReactionTimeTest() {
  const [phase, setPhase] = useState<"idle" | "wait" | "now" | "early" | "done">("idle")
  const [ms, setMs] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])
  const start = useRef(0)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function begin() {
    setPhase("wait")
    setMs(null)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      start.current = performance.now()
      setPhase("now")
    }, randomWaitMs())
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
    const next = Math.round(performance.now() - start.current)
    setMs(next)
    setHistory((current) => [...current, next].slice(-8))
    setPhase("done")
  }

  const mean = average(history)

  return (
    <GamingToolShell>
      <Note>
        This is the time from the colour change to your click, measured with performance.now(). It is not monitor input
        lag, and one try is noisy.
      </Note>
      <button
        type="button"
        onClick={click}
        aria-live="polite"
        className={cn(
          "grid h-56 w-full place-items-center rounded-xl border border-border text-2xl font-semibold",
          phase === "now" && "bg-[var(--nb-primary)] text-background",
        )}
      >
        {phase === "idle"
          ? "Click to start"
          : phase === "wait"
            ? "Wait…"
            : phase === "now"
              ? "Click"
              : phase === "early"
                ? "Too soon"
                : `${ms} ms`}
      </button>
      {mean !== null ? (
        <MetricCard label="Average of these tries" value={`${Math.round(mean)} ms`} note={history.map((item) => `${item} ms`).join(" · ")} />
      ) : null}
    </GamingToolShell>
  )
}

export function CpsTest() {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [clicks, setClicks] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const running = endsAt !== null && now < endsAt
  const done = endsAt !== null && now >= endsAt

  useEffect(() => {
    if (!running) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 50)
    const onVis = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [running])

  const left = endsAt === null ? null : remainingWindow(endsAt, now)
  const cps = done ? cpsFromClicks(clicks, 5000) : running ? cpsFromClicks(clicks, 5000 - (left ?? 0)) : null

  return (
    <GamingToolShell>
      <Note>Five seconds from the first click. The clock is wall time, not a stepped animation. This counts pointer clicks on the pad, not a keyboard auto-repeat.</Note>
      <button
        type="button"
        className="grid h-40 place-items-center rounded-xl border border-border text-4xl font-semibold tabular-nums"
        onClick={() => {
          if (!running && !done) {
            setClicks(1)
            setEndsAt(Date.now() + 5000)
            setNow(Date.now())
            return
          }
          if (running) setClicks((current) => current + 1)
        }}
      >
        {running || done ? clicks : "Click"}
      </button>
      <ResultDisplay label="Result">
        {done ? `${cps?.toFixed(1)} CPS` : running ? `${((left ?? 0) / 1000).toFixed(1)}s` : "—"}
      </ResultDisplay>
      <ActionBar>
        <ResetButton
          onClick={() => {
            setEndsAt(null)
            setClicks(0)
          }}
        />
      </ActionBar>
    </GamingToolShell>
  )
}

export function RefreshRateTester() {
  const [fps, setFps] = useState<number | null>(null)
  const [ms, setMs] = useState<number | null>(null)
  const [offset, setOffset] = useState(0)
  const coarse = useCoarsePointer()

  useEffect(() => {
    let frames = 0
    let mark = performance.now()
    let id = 0
    let lastDraw = 0
    const loop = (now: number) => {
      frames += 1
      if (now - mark >= 500) {
        const span = now - mark
        setFps(Math.round((frames * 1000) / span))
        setMs(Math.round((span / frames) * 10) / 10)
        frames = 0
        mark = now
      }
      if (now - lastDraw >= 32) {
        setOffset(((now / 8) % 100))
        lastDraw = now
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <GamingToolShell>
      {coarse ? <LimitNote>On a phone the browser often caps this well below the panel’s rated refresh.</LimitNote> : null}
      <Note>
        This is how many animation frames this tab is painting, not a guarantee of the monitor’s Hz rating. A busy tab
        or battery saver will sit lower.
      </Note>
      <ResultDisplay label="Frames per second">{fps ?? "—"} <span className="text-lg font-medium text-[var(--nb-secondary)]">fps</span></ResultDisplay>
      <MetricCard label="Frame interval" value={ms !== null ? `${ms} ms` : "—"} />
      <div className="h-2 overflow-hidden rounded-full bg-[var(--nb-accent)]" aria-hidden>
        <div className="h-full w-1/5 rounded-full bg-[var(--nb-primary)]" style={{ marginLeft: `${offset}%` }} />
      </div>
    </GamingToolShell>
  )
}
