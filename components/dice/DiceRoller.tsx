"use client"

import { Button } from "@/components/ui/button"
import { diceCountMax, rollD6 } from "@/lib/dice/roll"
import { cn } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Die = { id: number; face: number }

const pipSets: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

export function DiceRoller() {
  const [dice, setDice] = useState<Die[]>([
    { id: 1, face: 5 },
    { id: 2, face: 3 },
  ])
  const [rollingIds, setRollingIds] = useState<number[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const reducedMotion = useReducedMotion()
  const diceRef = useRef(dice)
  const rollingRef = useRef(rollingIds)
  const rollRef = useRef<(ids: number[]) => void>(() => {})
  const timer = useRef(0)

  diceRef.current = dice
  rollingRef.current = rollingIds
  const busy = rollingIds.length > 0

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "r" || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      event.preventDefault()
      rollRef.current(diceRef.current.map((die) => die.id))
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearTimeout(timer.current)
    }
  }, [])

  function settle(faces: Map<number, number>) {
    const next = diceRef.current.map((die) =>
      faces.has(die.id) ? { ...die, face: faces.get(die.id)! } : die
    )
    setDice(next)
    setRollingIds([])
    setTotal(next.reduce((sum, die) => sum + die.face, 0))
  }

  function roll(ids: number[]) {
    if (ids.length === 0 || rollingRef.current.length > 0) return
    const faces = new Map(ids.map((id) => [id, rollD6()]))
    if (reducedMotion) {
      settle(faces)
      return
    }
    setRollingIds(ids)
    setTotal(null)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => settle(faces), 160)
  }

  rollRef.current = roll

  function setCount(next: number) {
    if (busy || next === dice.length || next < 1 || next > diceCountMax) return
    const updated =
      next < dice.length
        ? dice.slice(0, next)
        : [
            ...dice,
            ...Array.from({ length: next - dice.length }, (_, index) => ({
              id: Math.max(...dice.map((die) => die.id)) + index + 1,
              face: 1,
            })),
          ]
    setDice(updated)
    setTotal(null)
  }

  return (
    <div className="flex flex-col">
      <header className="mb-14 flex flex-col gap-3">
        <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-[var(--nb-primary)] sm:text-4xl">
          Dice Roller
        </h1>
        <p className="max-w-xl text-sm text-[var(--nb-secondary)]">
          Roll a handful of dice. Tap one to throw it again.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-4 py-6">
        {dice.map((die) => (
          <DieFace
            key={die.id}
            face={die.face}
            rolling={rollingIds.includes(die.id)}
            onRoll={() => roll([die.id])}
          />
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-end justify-between gap-8">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[var(--nb-secondary)]">Dice</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Remove a die"
            disabled={busy || dice.length <= 1}
            onClick={() => setCount(dice.length - 1)}
          >
            <Minus />
          </Button>
          <span className="w-4 text-center text-[15px] font-medium tabular-nums">{dice.length}</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Add a die"
            disabled={busy || dice.length >= diceCountMax}
            onClick={() => setCount(dice.length + 1)}
          >
            <Plus />
          </Button>
        </div>

        <div className="flex items-end gap-6">
          <div>
            <span className="text-xs font-medium text-[var(--nb-secondary)]">Total</span>
            <p
              aria-live="polite"
              className={cn(
                "mt-1 text-5xl leading-none font-semibold tracking-[-0.04em] tabular-nums",
                total === null ? "text-foreground/20" : "text-[var(--nb-primary)]"
              )}
            >
              {total ?? "—"}
            </p>
          </div>
          <Button type="button" size="lg" className="h-11 px-5" disabled={busy} onClick={() => roll(dice.map((die) => die.id))}>
            Roll
          </Button>
        </div>
      </div>
    </div>
  )
}

function DieFace({
  face,
  rolling,
  onRoll,
}: {
  face: number
  rolling: boolean
  onRoll: () => void
}) {
  const on = new Set(pipSets[face] ?? [])
  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={rolling}
      aria-label={rolling ? "Die rolling" : `Die showing ${face}. Roll this die again.`}
      className={cn(
        "grid size-24 place-items-center rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[opacity,transform] duration-150 ease-out disabled:cursor-default",
        rolling ? "scale-[0.98] opacity-0" : "hover:border-black/20"
      )}
    >
      <span className="grid size-14 grid-cols-3 grid-rows-3 text-[var(--nb-primary)]" aria-hidden>
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} className="flex items-center justify-center">
            {on.has(index) ? <span className="size-2 rounded-full bg-current" /> : null}
          </span>
        ))}
      </span>
    </button>
  )
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return reduced
}
