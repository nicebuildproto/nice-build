"use client"

import {
  ActionBar,
  CopyButton,
  EverydayToolShell,
  History,
  Note,
  PresetPicker,
  PrimaryAction,
  ResetButton,
  ResultDisplay,
  TimerDisplay,
  useNow,
} from "@/components/everyday/kit"
import { NumberField } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  countdownParts,
  defaultCountdownTarget,
  durationFromFields,
  formatCountdownClock,
  formatStopwatch,
  parseLocalDatetime,
  remainingMs,
} from "@/lib/everyday/time"
import { useEffect, useRef, useState } from "react"

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-4xl font-semibold tabular-nums sm:text-5xl">{value}</div>
      <div className="mt-1 text-xs text-[var(--nb-secondary)]">{label}</div>
    </div>
  )
}

export function Countdown() {
  const [when, setWhen] = useState(defaultCountdownTarget)
  const target = parseLocalDatetime(when)
  const now = useNow(true, 250)
  const parts = target === null ? null : countdownParts(target, now)

  return (
    <EverydayToolShell>
      <label className="flex max-w-xs flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
        Date and time
        <Input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className="h-10" />
      </label>
      {parts ? (
        <>
          <ResultDisplay label="Status">
            <span className="text-2xl sm:text-3xl">
              {parts.complete ? "That moment has passed." : "Time remaining"}
            </span>
          </ResultDisplay>
          <div className="flex flex-wrap gap-8" aria-live="polite">
            <Count label="Days" value={parts.days} />
            <Count label="Hours" value={parts.hours} />
            <Count label="Minutes" value={parts.minutes} />
            <Count label="Seconds" value={parts.seconds} />
          </div>
          <Note>Times are local to this device. The numbers come from the clock, not from the animation.</Note>
        </>
      ) : (
        <Note>Choose a valid date.</Note>
      )}
      <ActionBar>
        <ResetButton onClick={() => setWhen(defaultCountdownTarget())} />
      </ActionBar>
    </EverydayToolShell>
  )
}

export function StopwatchTool() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState<number[]>([])
  const [now, setNow] = useState(0)
  const start = useRef(0)
  const base = useRef(0)

  useEffect(() => {
    if (!running) return
    const tick = () => setNow(performance.now())
    tick()
    const id = window.setInterval(tick, 50)
    const onVis = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("focus", tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("focus", tick)
    }
  }, [running])

  const shown = running ? base.current + now - start.current : elapsed

  function toggle() {
    if (running) {
      const next = base.current + performance.now() - start.current
      base.current = next
      setElapsed(next)
      setRunning(false)
    } else {
      start.current = performance.now()
      setNow(start.current)
      setRunning(true)
    }
  }

  function reset() {
    setRunning(false)
    setElapsed(0)
    setLaps([])
    base.current = 0
    start.current = 0
  }

  const lapLines = laps.map((lap, index) => {
    const previous = laps[index + 1] ?? 0
    return `Lap ${laps.length - index} · ${formatStopwatch(lap)} · split ${formatStopwatch(lap - previous)}`
  })

  return (
    <EverydayToolShell>
      <TimerDisplay label="Elapsed">{formatStopwatch(shown)}</TimerDisplay>
      <ActionBar>
        <PrimaryAction onClick={toggle}>{running ? "Pause" : elapsed ? "Resume" : "Start"}</PrimaryAction>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-3"
          disabled={!running}
          onClick={() => setLaps((current) => [shown, ...current])}
        >
          Lap
        </Button>
        <ResetButton onClick={reset} />
        <CopyButton text={formatStopwatch(shown)} />
      </ActionBar>
      <History items={lapLines} label="Laps" />
    </EverydayToolShell>
  )
}

const cookPresets = [
  { label: "1 min", value: "1" },
  { label: "3 min", value: "3" },
  { label: "5 min", value: "5" },
  { label: "10 min", value: "10" },
  { label: "15 min", value: "15" },
  { label: "20 min", value: "20" },
  { label: "30 min", value: "30" },
]

export function CookingTimer() {
  const [minutes, setMinutes] = useState("10")
  const [seconds, setSeconds] = useState("0")
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [pausedLeft, setPausedLeft] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [sound, setSound] = useState(true)
  const sounded = useRef(false)
  const running = endsAt !== null && pausedLeft === null && !done
  const now = useNow(running || pausedLeft !== null, 200)
  const total = durationFromFields(minutes, seconds)
  const left = remainingMs(endsAt, now, pausedLeft)
  const display = done ? 0 : (left ?? total)

  useEffect(() => {
    if (endsAt === null || pausedLeft !== null || done) return
    if (now < endsAt) {
      sounded.current = false
      return
    }
    setDone(true)
    setEndsAt(null)
    if (sounded.current) return
    sounded.current = true
    if (sound) beep()
    try {
      navigator.vibrate?.(200)
    } catch {
      /* ignore */
    }
  }, [now, endsAt, pausedLeft, done, sound])

  function start() {
    const duration = pausedLeft ?? total
    if (duration <= 0) return
    sounded.current = false
    setDone(false)
    setPausedLeft(null)
    setEndsAt(Date.now() + duration)
  }

  function pause() {
    if (endsAt === null) return
    setPausedLeft(Math.max(0, endsAt - Date.now()))
    setEndsAt(null)
  }

  function reset() {
    setEndsAt(null)
    setPausedLeft(null)
    setDone(false)
    sounded.current = false
  }

  const clock = formatCountdownClock(display)
  const status = done ? "Time’s up" : pausedLeft !== null ? "Paused" : running ? "Remaining" : "Ready"

  return (
    <EverydayToolShell>
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <NumberField label="Minutes" value={minutes} onChange={setMinutes} min={0} />
        <NumberField label="Seconds" value={seconds} onChange={setSeconds} min={0} />
      </div>
      <PresetPicker
        label="Presets"
        options={cookPresets}
        value={minutes}
        onChange={(value) => {
          setMinutes(value)
          setSeconds("0")
          reset()
        }}
      />
      <TimerDisplay label={status}>{clock}</TimerDisplay>
      <ResultDisplay label="Status">
        <span className="text-xl sm:text-2xl">{status}</span>
      </ResultDisplay>
      <ActionBar>
        {running ? (
          <PrimaryAction onClick={pause}>Pause</PrimaryAction>
        ) : (
          <PrimaryAction onClick={start} disabled={total <= 0 && pausedLeft === null}>
            {pausedLeft !== null ? "Resume" : done ? "Start again" : "Start"}
          </PrimaryAction>
        )}
        <ResetButton onClick={reset} />
        <CopyButton text={`${status} ${clock}`} />
      </ActionBar>
      <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
        <input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} className="size-4" />
        Beep when it hits zero
      </label>
      <Note>
        The remaining time is counted from the clock, so a background tab still finishes on time. Sound needs a tap on
        this page first in some browsers. The words “Time’s up” are the main signal.
      </Note>
    </EverydayToolShell>
  )
}

function beep() {
  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 880
    gain.gain.value = 0.08
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.18)
    window.setTimeout(() => void context.close(), 400)
  } catch {
    /* ignore */
  }
}
