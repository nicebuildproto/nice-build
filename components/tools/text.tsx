"use client"

import { CopyButton, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { diffLines } from "@/lib/tools/format"
import { useMemo, useState } from "react"

export function WordCounter() {
  const [text, setText] = useState("Nice Build is a quiet place for useful tools.")
  const stats = useMemo(() => countText(text), [text])

  return (
    <div className="flex flex-col gap-8">
      <TextArea label="Text" value={text} onChange={setText} rows={10} />
      <div className="flex flex-col gap-4" aria-live="polite">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-medium text-[var(--nb-secondary)]">{item.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
        <CopyButton label="Copy result" text={stats.map((item) => `${item.label}: ${item.value}`).join("\n")} />
      </div>
    </div>
  )
}

function countText(text: string) {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const sentences = trimmed ? trimmed.split(/[.!?]+/).filter((part) => part.trim()).length : 0
  const minutes = Math.max(1, Math.round(words / 200))
  return [
    { label: "Words", value: String(words) },
    { label: "Characters", value: String(text.length) },
    { label: "Without spaces", value: String(text.replace(/\s/g, "").length) },
    { label: "Sentences", value: String(sentences) },
    { label: "Reading time", value: words ? `${minutes} min` : "0 min" },
  ]
}

export function CaseConverter() {
  const [text, setText] = useState("the quick brown fox jumps over the lazy dog")
  const [mode, setMode] = useState<"sentence" | "title" | "upper" | "lower">("sentence")
  const output = convertCase(text, mode)

  return (
    <div className="flex flex-col gap-4">
      <TextArea label="Text" value={text} onChange={setText} />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["sentence", "Sentence"],
            ["title", "Title"],
            ["upper", "Upper"],
            ["lower", "Lower"],
          ] as const
        ).map(([key, label]) => (
          <Button key={key} type="button" variant={mode === key ? "default" : "outline"} onClick={() => setMode(key)}>
            {label}
          </Button>
        ))}
        <CopyButton text={output} />
      </div>
      <p className="rounded-xl border border-border p-4 text-sm leading-relaxed">{output}</p>
    </div>
  )
}

function convertCase(text: string, mode: "sentence" | "title" | "upper" | "lower") {
  if (mode === "upper") return text.toLocaleUpperCase()
  if (mode === "lower") return text.toLocaleLowerCase()
  if (mode === "sentence") {
    const lower = text.toLocaleLowerCase()
    return lower.replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toLocaleUpperCase())
  }
  const small = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "for"])
  return text
    .toLocaleLowerCase()
    .split(/(\s+)/)
    .map((part, index, parts) => {
      const word = part.trim()
      if (!word) return part
      const first = index === 0 || index === parts.length - 1
      if (!first && small.has(word)) return part
      return part.replace(word, word.charAt(0).toLocaleUpperCase() + word.slice(1))
    })
    .join("")
}

export function DiffChecker() {
  const [before, setBefore] = useState("The quiet toolkit.\nBuilt nicely.")
  const [after, setAfter] = useState("The quiet toolkit.\nBuilt carefully.")
  const rows = useMemo(() => diffLines(before, after), [before, after])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea label="Original" value={before} onChange={setBefore} />
        <TextArea label="Changed" value={after} onChange={setAfter} />
      </div>
      <div className="overflow-hidden rounded-xl border border-border font-mono text-[13px] leading-relaxed">
        {rows.map((row, index) => (
          <div
            key={`${row.type}-${index}`}
            className={
              row.type === "add"
                ? "bg-emerald-500/10 px-3 py-1"
                : row.type === "del"
                  ? "bg-red-500/10 px-3 py-1 line-through"
                  : "px-3 py-1 text-[var(--nb-secondary)]"
            }
          >
            {row.type === "add" ? "+ " : row.type === "del" ? "− " : "  "}
            {row.text || " "}
          </div>
        ))}
      </div>
    </div>
  )
}
