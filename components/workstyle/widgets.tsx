"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { displayOptions, initialRankOrder } from "@/lib/workstyle/order"
import type { Answer, FollowUp, Question } from "@/lib/workstyle/types"

// The five answer formats. Each widget is a controlled, keyboard-operable group. A widget reports a
// complete, valid answer through onAnswer — or `null` when what's on screen isn't a valid answer yet.
// `advance` is true only for a deliberate pointer selection of a single choice.

export type OnAnswer = (answer: Answer | null, advance?: boolean) => void

type Option = { id: string; label: string }

/** Number keys pick options, unless the person is typing somewhere. */
function useNumberKeys(count: number, onKey: (index: number) => void) {
  const handler = useRef(onKey)
  useEffect(() => {
    handler.current = onKey
  })
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" && (target as HTMLInputElement).type === "text")) return
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < count) handler.current(index)
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [count])
}

// ───────────────────────── Choice ─────────────────────────

export function ChoiceWidget({ name, label, options, selected, onPick }: { name: string; label: string; options: Option[]; selected: string | null; onPick: (id: string, pointer: boolean) => void }) {
  useNumberKeys(options.length, (index) => onPick(options[index].id, false))
  return (
    <fieldset className="ws-options">
      <legend className="ws-sr">{label}</legend>
      {options.map((option, index) => (
        <label key={option.id} className="ws-option">
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={selected === option.id}
            onChange={() => onPick(option.id, false)}
            // A pointer click has detail > 0; keyboard activation doesn't. Only pointer picks auto-advance.
            onClick={(event) => {
              if (event.detail > 0) onPick(option.id, true)
            }}
          />
          <span className="ws-key" aria-hidden="true">
            {index + 1}
          </span>
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  )
}

// ───────────────────────── Multi ─────────────────────────

const LIMIT_WORDS: Record<number, string> = { 1: "one", 2: "two", 3: "three", 4: "four" }

export function MultiWidget({ name, label, options, selected, max, onChange }: { name: string; label: string; options: Option[]; selected: string[]; max: number; onChange: (ids: string[]) => void }) {
  const full = selected.length >= max
  // At the limit, further picks are ignored until one is unticked.
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((candidate) => candidate !== id))
    else if (!full) onChange([...selected, id])
  }
  useNumberKeys(options.length, (index) => toggle(options[index].id))
  const word = LIMIT_WORDS[max] ?? String(max)
  return (
    <div className="ws-stack-sm">
      <fieldset className="ws-options">
        <legend className="ws-sr">{label}</legend>
        {options.map((option, index) => {
          const checked = selected.includes(option.id)
          return (
            <label key={option.id} className="ws-option" data-multi="" aria-disabled={full && !checked ? true : undefined} style={full && !checked ? { opacity: 0.55 } : undefined}>
              <input type="checkbox" name={name} value={option.id} checked={checked} disabled={full && !checked} onChange={() => toggle(option.id)} />
              <span className="ws-key" aria-hidden="true">
                {checked ? "✓" : index + 1}
              </span>
              <span>{option.label}</span>
            </label>
          )
        })}
      </fieldset>
      <p className="ws-count" aria-live="polite">
        {selected.length === 0
          ? `Pick up to ${word}.`
          : full
            ? `${selected.length} of ${max} picked. That’s the limit, so untick one to swap.`
            : `${selected.length} of ${max} picked.`}
      </p>
    </div>
  )
}

// ───────────────────────── Rank ─────────────────────────

function Arrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={direction === "up" ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RankWidget({ options, order, touched, onChange, onConfirm, reducedMotion }: { options: Option[]; order: string[]; touched: boolean; onChange: (order: string[]) => void; onConfirm: () => void; reducedMotion: boolean }) {
  const [announcement, setAnnouncement] = useState("")
  const refs = useRef(new Map<string, HTMLLIElement>())
  const previous = useRef(new Map<string, number>())
  const byId = new Map(options.map((option) => [option.id, option]))

  // FLIP: when the order changes, slide each row from where it was to where it is.
  useLayoutEffect(() => {
    const next = new Map<string, number>()
    refs.current.forEach((element, id) => next.set(id, element.getBoundingClientRect().top))
    if (!reducedMotion) {
      refs.current.forEach((element, id) => {
        const before = previous.current.get(id)
        const after = next.get(id)
        if (before === undefined || after === undefined || before === after) return
        element.animate([{ transform: `translateY(${before - after}px)` }, { transform: "translateY(0)" }], { duration: 260, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" })
      })
    }
    previous.current = next
  }, [order, reducedMotion])

  const move = useCallback(
    (index: number, delta: -1 | 1) => {
      const target = index + delta
      if (target < 0 || target >= order.length) return
      const next = [...order]
      ;[next[index], next[target]] = [next[target], next[index]]
      onChange(next)
      setAnnouncement(`${byId.get(order[index])?.label} moved to position ${target + 1} of ${order.length}.`)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order, onChange],
  )

  return (
    <div className="ws-stack-sm">
      <ol className="ws-rank" aria-label="Your order, most important first">
        {order.map((id, index) => (
          <li key={id} ref={(element) => { if (element) refs.current.set(id, element); else refs.current.delete(id) }} data-touched={touched ? "" : undefined}>
            <span className="ws-rank-n" aria-hidden="true">
              {index + 1}
            </span>
            <span>{byId.get(id)?.label}</span>
            <span className="ws-rank-buttons">
              <button type="button" className="ws-icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move “${byId.get(id)?.label}” up`}>
                <Arrow direction="up" />
              </button>
              <button type="button" className="ws-icon-btn" onClick={() => move(index, 1)} disabled={index === order.length - 1} aria-label={`Move “${byId.get(id)?.label}” down`}>
                <Arrow direction="down" />
              </button>
            </span>
          </li>
        ))}
      </ol>
      <p className="ws-sr" role="status" aria-live="polite">
        {announcement}
      </p>
      {!touched ? (
        <p className="ws-count">
          Move things up or down until the order feels right.{" "}
          <button type="button" className="ws-btn ws-btn--quiet ws-btn--small" onClick={onConfirm}>
            This order is right
          </button>
        </p>
      ) : null}
    </div>
  )
}

// ───────────────────────── Split ─────────────────────────

export function SplitWidget({ options, total, unit, shares, onChange }: { options: Option[]; total: number; unit: string; shares: Record<string, number>; onChange: (shares: Record<string, number>) => void }) {
  const used = options.reduce((sum, option) => sum + (shares[option.id] ?? 0), 0)
  const remaining = total - used
  const set = (id: string, value: number) => onChange({ ...shares, [id]: Math.max(0, value) })
  return (
    <div className="ws-split">
      {options.map((option) => {
        const value = shares[option.id] ?? 0
        return (
          <div key={option.id} className="ws-split-row" role="group" aria-label={option.label} data-has={value > 0 ? "" : undefined}>
            <span className="ws-split-label">{option.label}</span>
            <span className="ws-pips" aria-hidden="true">
              {Array.from({ length: total }, (_, index) => (
                <span key={index} className="ws-pip" data-on={index < value ? "" : undefined} />
              ))}
            </span>
            <span className="ws-stepper">
              <button type="button" className="ws-icon-btn" onClick={() => set(option.id, value - 1)} disabled={value === 0} aria-label={`Take one ${unit.replace(/s$/, "")} away from “${option.label}”`}>
                –
              </button>
              <output aria-label={`${value} ${unit}`}>{value}</output>
              <button type="button" className="ws-icon-btn" onClick={() => set(option.id, value + 1)} disabled={remaining === 0} aria-label={`Add one ${unit.replace(/s$/, "")} to “${option.label}”`}>
                +
              </button>
            </span>
          </div>
        )
      })}
      <p className="ws-remaining" role="status" aria-live="polite">
        {remaining === 0 ? <strong>All {total} placed.</strong> : <><strong>{remaining}</strong> {remaining === 1 ? unit.replace(/s$/, "") : unit} left to place.</>}
      </p>
    </div>
  )
}

// ───────────────────────── Scale ─────────────────────────

export function ScaleWidget({ name, label, left, right, flip, value, onChange }: { name: string; label: string; left: string; right: string; flip: boolean; value: number | null; onChange: (value: number) => void }) {
  // Stops run 0..4 left to right on screen. The stored value is canonical (-2 = the question’s own left
  // statement), so a flipped item, whose statements are swapped on screen, reverses the mapping.
  const toValue = (stop: number) => (flip ? 2 - stop : stop - 2)
  const selectedStop = value === null ? null : flip ? 2 - value : value + 2
  useNumberKeys(5, (index) => onChange(toValue(index)))
  const names = ["Strongly: " + left, "Leaning towards: " + left, "In the middle: it depends", "Leaning towards: " + right, "Strongly: " + right]
  return (
    <fieldset className="ws-scale">
      <legend className="ws-sr">{label}</legend>
      <div className="ws-scale-ends" aria-hidden="true">
        <div className="ws-scale-end" data-lean={selectedStop !== null && selectedStop < 2 ? "" : undefined}>{left}</div>
        <div className="ws-scale-end" data-lean={selectedStop !== null && selectedStop > 2 ? "" : undefined}>{right}</div>
      </div>
      <div className="ws-track">
        {names.map((text, stop) => (
          <label key={stop} className="ws-stop" data-edge={stop === 0 || stop === 4 ? "" : undefined}>
            <input type="radio" name={name} checked={selectedStop === stop} onChange={() => onChange(toValue(stop))} aria-label={text} />
            <span />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// ───────────────────────── Question switcher ─────────────────────────

/** Returns the draft state for a question's widget, and what it means as an answer. */
export function QuestionWidget({ question, answer, onAnswer, reducedMotion, seed }: { question: Question; answer: Answer | undefined; onAnswer: OnAnswer; reducedMotion: boolean; seed: number }) {
  const real = answer && answer.format !== "skip" ? answer : null
  switch (question.format) {
    case "choice":
      return (
        <ChoiceWidget
          name={question.id}
          label={question.ariaLabel}
          options={displayOptions(question.id, question.options, seed)}
          selected={real?.format === "choice" ? real.optionId : null}
          onPick={(id, pointer) => onAnswer({ format: "choice", optionId: id }, pointer)}
        />
      )
    case "multi":
      return <MultiWidget name={question.id} label={question.ariaLabel} options={displayOptions(question.id, question.options, seed)} max={question.max} selected={real?.format === "multi" ? real.optionIds : []} onChange={(ids) => onAnswer(ids.length ? { format: "multi", optionIds: ids } : null)} />
    case "rank":
      return <RankDraft question={question} seed={seed} answer={real?.format === "rank" ? real.order : null} onAnswer={onAnswer} reducedMotion={reducedMotion} />
    case "split":
      return <SplitDraft question={question} seed={seed} answer={real?.format === "split" ? real.shares : null} onAnswer={onAnswer} />
    case "scale":
      return <ScaleWidget name={question.id} label={question.ariaLabel} left={question.flip ? question.right : question.left} right={question.flip ? question.left : question.right} flip={question.flip} value={real?.format === "scale" ? real.value : null} onChange={(value) => onAnswer({ format: "scale", value })} />
  }
}

function RankDraft({ question, seed, answer, onAnswer, reducedMotion }: { question: Extract<Question, { format: "rank" }>; seed: number; answer: string[] | null; onAnswer: OnAnswer; reducedMotion: boolean }) {
  const [draft, setDraft] = useState<string[]>(() => answer ?? initialRankOrder(question, seed))
  const [touched, setTouched] = useState(answer !== null)
  return (
    <RankWidget
      options={question.options}
      order={draft}
      touched={touched}
      reducedMotion={reducedMotion}
      onChange={(order) => {
        setDraft(order)
        setTouched(true)
        onAnswer({ format: "rank", order })
      }}
      onConfirm={() => {
        setTouched(true)
        onAnswer({ format: "rank", order: draft }, true)
      }}
    />
  )
}

function SplitDraft({ question, seed, answer, onAnswer }: { question: Extract<Question, { format: "split" }>; seed: number; answer: Record<string, number> | null; onAnswer: OnAnswer }) {
  const [draft, setDraft] = useState<Record<string, number>>(() => answer ?? {})
  return (
    <SplitWidget
      options={displayOptions(question.id, question.options, seed)}
      total={question.total}
      unit={question.unit}
      shares={draft}
      onChange={(shares) => {
        setDraft(shares)
        const sum = question.options.reduce((total, option) => total + (shares[option.id] ?? 0), 0)
        onAnswer(sum === question.total ? { format: "split", shares: Object.fromEntries(question.options.map((option) => [option.id, shares[option.id] ?? 0])) } : null)
      }}
    />
  )
}

export function FollowUpWidget({ followUp, answer, onAnswer }: { followUp: FollowUp; answer: Answer | undefined; onAnswer: OnAnswer }) {
  const selected = answer?.format === "choice" ? answer.optionId : null
  return (
    <ChoiceWidget name={followUp.id} label={followUp.ariaLabel} options={followUp.options} selected={selected} onPick={(id, pointer) => onAnswer({ format: "choice", optionId: id }, pointer)} />
  )
}
