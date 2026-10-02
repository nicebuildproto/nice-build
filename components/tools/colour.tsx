"use client"

import { CopyButton, Field } from "@/components/tools/ui"
import { Input } from "@/components/ui/input"
import { contrastRatio, parseHex, shiftHex } from "@/lib/tools/format"
import { useMemo, useState } from "react"

function ColourInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parsed = parseHex(value) ?? "#111111"
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={parsed}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 shrink-0 rounded-lg border border-border bg-transparent"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 font-mono" />
      </div>
    </Field>
  )
}

export function ColourPalette() {
  const [seed, setSeed] = useState("#1f6f5b")
  const base = parseHex(seed)
  const swatches = base
    ? [
        ["Base", base],
        ["Light", shiftHex(base, 0, 0.22)],
        ["Lighter", shiftHex(base, 0, 0.38)],
        ["Dark", shiftHex(base, 0, -0.18)],
        ["Complement", shiftHex(base, 180, 0)],
        ["Analogous", shiftHex(base, 28, 0.04)],
      ]
    : []

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-sm">
        <ColourInput label="Starting colour" value={seed} onChange={setSeed} />
      </div>
      {base ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {swatches.map(([name, hex]) => (
            <li key={name} className="overflow-hidden rounded-xl border border-border">
              <div className="h-20" style={{ background: hex }} />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <p className="text-[13px] font-medium">{name}</p>
                  <p className="font-mono text-[12px] text-[var(--nb-secondary)]">{hex}</p>
                </div>
                <CopyButton text={hex} label="Copy" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Enter a hex colour, like #1F6F5B.</p>
      )}
    </div>
  )
}

export function ContrastChecker() {
  const [text, setText] = useState("#111111")
  const [background, setBackground] = useState("#fffdf8")
  const ratio = useMemo(() => {
    const fg = parseHex(text)
    const bg = parseHex(background)
    if (!fg || !bg) return null
    return contrastRatio(fg, bg)
  }, [text, background])
  const fg = parseHex(text)
  const bg = parseHex(background)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <ColourInput label="Text" value={text} onChange={setText} />
        <ColourInput label="Background" value={background} onChange={setBackground} />
      </div>
      <div
        className="rounded-2xl border border-border px-6 py-10"
        style={{ color: fg ?? undefined, background: bg ?? undefined }}
      >
        <p className="text-3xl font-semibold tracking-[-0.03em]">The quick brown fox</p>
        <p className="mt-2 text-sm">jumps over the lazy dog.</p>
      </div>
      <div className="flex flex-wrap gap-8">
        <div>
          <p className="text-xs font-medium text-[var(--nb-secondary)]">Contrast</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{ratio ? `${ratio.toFixed(2)}:1` : "—"}</p>
        </div>
        <Grade label="AA normal" pass={ratio !== null && ratio >= 4.5} />
        <Grade label="AA large" pass={ratio !== null && ratio >= 3} />
        <Grade label="AAA normal" pass={ratio !== null && ratio >= 7} />
      </div>
    </div>
  )
}

function Grade({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--nb-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-medium">{pass ? "Pass" : "Fail"}</p>
    </div>
  )
}

export function GradientGenerator() {
  const [from, setFrom] = useState("#111111")
  const [to, setTo] = useState("#ff0101")
  const [angle, setAngle] = useState("120")
  const left = parseHex(from)
  const right = parseHex(to)
  const css = left && right ? `linear-gradient(${angle || 0}deg, ${left}, ${right})` : ""

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <ColourInput label="From" value={from} onChange={setFrom} />
        <ColourInput label="To" value={to} onChange={setTo} />
        <Field label="Angle">
          <Input value={angle} inputMode="numeric" onChange={(event) => setAngle(event.target.value)} className="h-10" />
        </Field>
      </div>
      <div className="h-40 rounded-2xl border border-border" style={{ background: css || undefined }} />
      {css ? (
        <div className="flex flex-wrap items-center gap-3">
          <code className="text-sm text-[var(--nb-secondary)]">background: {css};</code>
          <CopyButton text={`background: ${css};`} />
        </div>
      ) : null}
    </div>
  )
}
