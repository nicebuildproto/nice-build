"use client"

import {
  CopyReset,
  DownloadTxt,
  ExamplePicker,
  ModeTabs,
  OutputBox,
  PrivacyNote,
  SplitPane,
  StatsPanel,
  SwapButton,
  TextEditor,
  TextToolShell,
} from "@/components/text/kit"
import { NumberField } from "@/components/tools/ui"
import { convertCase, type CaseMode } from "@/lib/text/case"
import { diffLines, diffSummary, diffWords, unifiedDiff } from "@/lib/text/diff"
import { countText, formatReading, readingClock, utf8Bytes } from "@/lib/text/stats"
import { markdownTable, tidyText, uniqueLines } from "@/lib/text/transform"
import { flesch, lorem, numberToWords, slugify } from "@/lib/tools/pure"
import { useDeferredValue, useMemo, useState } from "react"

const sample = "Nice Build is a quiet place for useful tools."

export function WordCounter() {
  const [text, setText] = useState(sample)
  const [selected, setSelected] = useState<string | null>(null)
  const stats = useMemo(() => countText(text), [text])
  const focus = selected ? countText(selected) : stats
  const items = [
    { label: "Words", value: String(focus.words) },
    { label: "Characters", value: String(focus.characters) },
    { label: "Without spaces", value: String(focus.withoutSpaces) },
    { label: "Lines", value: String(focus.lines) },
    { label: "Paragraphs", value: String(focus.paragraphs) },
    { label: "Sentences", value: String(focus.sentences) },
    { label: "Reading time", value: formatReading(focus.words) },
  ]
  const copy = items.map((item) => `${item.label}: ${item.value}`).join("\n")
  const json = JSON.stringify(
    {
      words: focus.words,
      characters: focus.characters,
      withoutSpaces: focus.withoutSpaces,
      lines: focus.lines,
      paragraphs: focus.paragraphs,
      sentences: focus.sentences,
      readingTime: formatReading(focus.words),
      scope: selected ? "selection" : "all",
    },
    null,
    2,
  )

  return (
    <TextToolShell>
      <PrivacyNote />
      <ExamplePicker
        examples={[
          { label: "Sentence", apply: () => setText(sample) },
          {
            label: "Note",
            apply: () => setText("Hi Sam,\n\nCan we move Tuesday's review to 3pm?\n\nThanks,\nAda"),
          },
        ]}
      />
      <TextEditor label="Text" value={text} onChange={setText} onSelection={setSelected} rows={12} />
      {selected ? <p className="text-[13px] text-[var(--nb-secondary)]">Showing counts for the selection.</p> : null}
      <StatsPanel items={items} />
      <CopyReset
        text={copy}
        copyLabel="Copy counts"
        filename="word-count.txt"
        onReset={() => {
          setText("")
          setSelected(null)
        }}
        extra={<DownloadTxt text={json} filename="word-count.json" label="Download .json" />}
      />
    </TextToolShell>
  )
}

export function CharacterCounter() {
  const [text, setText] = useState("Nice Build")
  const [selected, setSelected] = useState<string | null>(null)
  const source = selected ?? text
  const stats = countText(source)
  const items = [
    { label: "Characters", value: String(stats.characters) },
    { label: "Without spaces", value: String(stats.withoutSpaces) },
    { label: "Lines", value: String(stats.lines) },
    { label: "UTF-8 bytes", value: String(utf8Bytes(source)) },
  ]
  const copy = items.map((item) => `${item.label}: ${item.value}`).join("\n")
  const json = JSON.stringify(
    {
      characters: stats.characters,
      withoutSpaces: stats.withoutSpaces,
      lines: stats.lines,
      utf8Bytes: utf8Bytes(source),
      scope: selected ? "selection" : "all",
    },
    null,
    2,
  )

  return (
    <TextToolShell>
      <PrivacyNote />
      <TextEditor label="Text" value={text} onChange={setText} onSelection={setSelected} rows={10} />
      {selected ? <p className="text-[13px] text-[var(--nb-secondary)]">Showing counts for the selection.</p> : null}
      <StatsPanel items={items} />
      <CopyReset
        text={copy}
        copyLabel="Copy counts"
        filename="character-count.txt"
        extra={<DownloadTxt text={json} filename="character-count.json" label="Download .json" />}
        onReset={() => {
          setText("")
          setSelected(null)
        }}
      />
    </TextToolShell>
  )
}

export function ReadingTime() {
  const [text, setText] = useState(sample)
  const [pace, setPace] = useState("220")
  const words = countText(text).words
  const wpm = Math.max(1, Number(pace) || 220)
  const clock = readingClock(words, wpm)

  return (
    <TextToolShell>
      <PrivacyNote />
      <TextEditor label="Text" value={text} onChange={setText} rows={10} />
      <div className="max-w-xs">
        <NumberField label="Words a minute" value={pace} onChange={setPace} suffix="wpm" min={1} />
      </div>
      <StatsPanel
        items={[
          { label: "Words", value: String(words) },
          { label: "Time", value: formatReading(words, wpm) },
        ]}
      />
      <CopyReset
        text={`${words} words\n${clock.minutes}m ${clock.seconds}s at ${wpm} wpm`}
        copyLabel="Copy time"
        onReset={() => setText("")}
      />
    </TextToolShell>
  )
}

export function ReadabilityChecker() {
  const [text, setText] = useState("Nice Build is a quiet place for useful tools. Short sentences are easier to read.")
  const result = useMemo(() => flesch(text), [text])

  return (
    <TextToolShell>
      <PrivacyNote>Your text stays on your device. The score is Flesch reading ease for English — a guide, not a grade.</PrivacyNote>
      <TextEditor label="Text" value={text} onChange={setText} rows={10} />
      {result ? (
        <StatsPanel
          items={[
            { label: "Reading ease", value: String(Math.round(result.score)) },
            { label: "Level", value: result.label },
            { label: "Words", value: String(result.words) },
            { label: "Sentences", value: String(result.sentences) },
          ]}
        />
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Paste a sentence to score it.</p>
      )}
      <CopyReset
        text={result ? `Reading ease: ${Math.round(result.score)}\nLevel: ${result.label}` : ""}
        copyLabel="Copy score"
        onReset={() => setText("")}
      />
    </TextToolShell>
  )
}

const caseModes: { id: CaseMode; label: string }[] = [
  { id: "sentence", label: "Sentence" },
  { id: "title", label: "Title" },
  { id: "upper", label: "UPPER" },
  { id: "lower", label: "lower" },
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
]

export function CaseConverter() {
  const [text, setText] = useState("the quiet toolkit for everyday work")
  const [mode, setMode] = useState<CaseMode>("sentence")
  const deferred = useDeferredValue(text)
  const output = convertCase(deferred, mode)

  return (
    <TextToolShell>
      <PrivacyNote />
      <ModeTabs label="Case" value={mode} options={caseModes} onChange={(id) => setMode(id as CaseMode)} />
      <ExamplePicker
        examples={[
          { label: "Headline", apply: () => setText("the quiet toolkit for everyday work") },
          { label: "Identifier", apply: () => setText("Roof Pitch Calculator") },
        ]}
      />
      <SplitPane>
        <TextEditor label="Input" value={text} onChange={setText} rows={10} />
        <OutputBox label="Output" value={output} />
      </SplitPane>
      <CopyReset text={output} onReset={() => setText("")} filename="converted.txt" />
    </TextToolShell>
  )
}

export function DiffChecker() {
  const [before, setBefore] = useState("The quiet toolkit.\nBuilt nicely.")
  const [after, setAfter] = useState("The quiet toolkit.\nBuilt carefully.")
  const [mode, setMode] = useState<"line" | "word">("line")
  const deferredBefore = useDeferredValue(before)
  const deferredAfter = useDeferredValue(after)
  const rows = useMemo(
    () => (mode === "word" ? diffWords(deferredBefore, deferredAfter) : diffLines(deferredBefore, deferredAfter)),
    [deferredBefore, deferredAfter, mode],
  )
  const summary = diffSummary(rows)
  const shown = rows.slice(0, 2000)
  const copy = unifiedDiff(shown)

  return (
    <TextToolShell>
      <PrivacyNote />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ModeTabs
          label="Compare"
          value={mode}
          options={[
            { id: "line", label: "Lines" },
            { id: "word", label: "Words" },
          ]}
          onChange={(id) => setMode(id as "line" | "word")}
        />
        <SwapButton
          label="Swap sides"
          onClick={() => {
            setBefore(after)
            setAfter(before)
          }}
        />
      </div>
      <SplitPane>
        <TextEditor label="Original" value={before} onChange={setBefore} rows={12} mono />
        <TextEditor label="Changed" value={after} onChange={setAfter} rows={12} mono />
      </SplitPane>
      <StatsPanel
        items={[
          { label: "Unchanged", value: String(summary.unchanged) },
          { label: "Removed", value: String(summary.removed) },
          { label: "Added", value: String(summary.added) },
        ]}
      />
      <p className="text-[13px] text-[var(--nb-secondary)]">Green is added. Red is removed.</p>
      <div className="max-h-[min(28rem,60vh)] overflow-auto rounded-xl border border-border font-mono text-[13px] leading-relaxed">
        <ul aria-label="Differences" className="list-none">
          {shown.map((row, index) => {
            const mark = row.type === "add" ? "+ " : row.type === "del" ? "− " : "  "
            const body = `${mark}${row.text || " "}`
            if (row.type === "add") {
              return (
                <li key={`${row.type}-${index}`}>
                  <ins className="block bg-emerald-500/10 px-3 py-1 text-[var(--nb-primary)] no-underline">
                    <span className="sr-only">Added: </span>
                    {body}
                  </ins>
                </li>
              )
            }
            if (row.type === "del") {
              return (
                <li key={`${row.type}-${index}`}>
                  <del className="block bg-red-500/10 px-3 py-1 text-[var(--nb-primary)] no-underline">
                    <span className="sr-only">Removed: </span>
                    {body}
                  </del>
                </li>
              )
            }
            return (
              <li key={`${row.type}-${index}`} className="px-3 py-1 text-[var(--nb-secondary)]">
                <span className="sr-only">Unchanged: </span>
                {body}
              </li>
            )
          })}
        </ul>
      </div>
      {rows.length > shown.length ? (
        <p className="text-[13px] text-[var(--nb-secondary)]">
          Showing the first {shown.length} of {rows.length} rows.
        </p>
      ) : null}
      <CopyReset
        text={copy}
        copyLabel="Copy diff"
        filename="changes.diff"
        onReset={() => {
          setBefore("")
          setAfter("")
        }}
      />
    </TextToolShell>
  )
}

export function TextCleaner() {
  const [text, setText] = useState("  Hello   there  \n\n\nNext line  ")
  const [trim, setTrim] = useState(true)
  const [spaces, setSpaces] = useState(true)
  const [blanks, setBlanks] = useState(true)
  const [quotes, setQuotes] = useState(true)
  const [empty, setEmpty] = useState(false)
  const [sort, setSort] = useState(false)
  const [dedupe, setDedupe] = useState(false)
  const deferred = useDeferredValue(text)
  const output = tidyText(deferred, { trim, spaces, blanks, quotes, empty, sort, dedupe })

  return (
    <TextToolShell>
      <PrivacyNote />
      <ExamplePicker
        examples={[
          { label: "Messy paste", apply: () => setText("  Hello   there  \n\n\nNext line  ") },
          { label: "List", apply: () => setText("oak\nash\noak\n\npine\nash") },
        ]}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Toggle label="Trim lines" checked={trim} onChange={setTrim} />
        <Toggle label="Collapse spaces" checked={spaces} onChange={setSpaces} />
        <Toggle label="Collapse blank lines" checked={blanks} onChange={setBlanks} />
        <Toggle label="Straighten quotes" checked={quotes} onChange={setQuotes} />
        <Toggle label="Remove empty lines" checked={empty} onChange={setEmpty} />
        <Toggle label="Deduplicate lines" checked={dedupe} onChange={setDedupe} />
        <Toggle label="Sort lines" checked={sort} onChange={setSort} />
      </div>
      <SplitPane>
        <TextEditor label="Input" value={text} onChange={setText} rows={12} mono />
        <OutputBox label="Output" value={output} mono />
      </SplitPane>
      <CopyReset text={output} onReset={() => setText("")} filename="cleaned.txt" />
    </TextToolShell>
  )
}

export function RemoveDuplicateLines() {
  const [text, setText] = useState("oak\nash\noak\npine")
  const deferred = useDeferredValue(text)
  const result = uniqueLines(deferred)

  return (
    <TextToolShell>
      <PrivacyNote />
      <SplitPane>
        <TextEditor label="Input" value={text} onChange={setText} rows={12} mono />
        <OutputBox label="Output" value={result.text} mono />
      </SplitPane>
      <StatsPanel
        items={[
          { label: "Kept", value: String(result.kept) },
          { label: "Removed", value: String(result.dropped) },
        ]}
      />
      <CopyReset text={result.text} onReset={() => setText("")} filename="unique-lines.txt" />
    </TextToolShell>
  )
}

export function SlugGenerator() {
  const [title, setTitle] = useState("Roof Pitch & Rafter Calculator")
  const slug = slugify(title)

  return (
    <TextToolShell>
      <PrivacyNote />
      <TextEditor label="Title" value={title} onChange={setTitle} rows={3} />
      <OutputBox label="Slug" value={slug} mono />
      <CopyReset text={slug} copyLabel="Copy slug" onReset={() => setTitle("")} />
    </TextToolShell>
  )
}

export function LoremIpsum() {
  const [count, setCount] = useState("3")
  const paragraphs = Math.min(12, Math.max(1, Math.round(Number(count) || 3)))
  const text = lorem(paragraphs)

  return (
    <TextToolShell>
      <PrivacyNote>Generated in this browser. Nothing is sent.</PrivacyNote>
      <div className="max-w-xs">
        <NumberField label="Paragraphs" value={count} onChange={setCount} min={1} />
      </div>
      <OutputBox label="Placeholder" value={text} />
      <CopyReset text={text} onReset={() => setCount("3")} filename="lorem.txt" />
    </TextToolShell>
  )
}

export function NumberToWordsTool() {
  const [value, setValue] = useState("142")
  const parsed = Number(value.replace(/,/g, "").trim())
  const words = Number.isFinite(parsed) ? numberToWords(parsed) : null

  return (
    <TextToolShell>
      <PrivacyNote />
      <div className="max-w-sm">
        <NumberField label="Number" value={value} onChange={setValue} />
      </div>
      <OutputBox label="Words" value={words ?? (value.trim() ? "Use a number up to 999 billion." : "")} />
      <CopyReset text={words ?? ""} copyLabel="Copy words" onReset={() => setValue("")} />
    </TextToolShell>
  )
}

export function MarkdownTable() {
  const [headers, setHeaders] = useState("Name, Role, Note")
  const [rows, setRows] = useState("Ada, Design, Colour\nLin, Build, Structure")
  const table = markdownTable(headers, rows)

  return (
    <TextToolShell>
      <PrivacyNote />
      <TextEditor label="Headers" value={headers} onChange={setHeaders} rows={2} mono />
      <TextEditor label="Rows" value={rows} onChange={setRows} rows={8} mono placeholder="One comma-separated row per line" />
      <OutputBox label="Markdown" value={table} mono />
      <CopyReset text={table} copyLabel="Copy table" filename="table.md" onReset={() => setRows("")} />
    </TextToolShell>
  )
}

export function MarkdownPreview() {
  const [text, setText] = useState("# Notes\n\nA **quiet** list:\n\n- One\n- Two\n\nSee [Nice Tools](https://nicetools.co).")
  const deferred = useDeferredValue(text)
  const blocks = useMemo(() => renderMarkdown(deferred), [deferred])

  return (
    <TextToolShell>
      <PrivacyNote>Your text stays on your device. The preview is a reader — headings, lists, emphasis, code, and http(s) links only.</PrivacyNote>
      <SplitPane>
        <TextEditor label="Markdown" value={text} onChange={setText} rows={16} mono />
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-[var(--nb-primary)]">Preview</p>
          <div className="min-h-40 overflow-auto rounded-lg border border-border px-4 py-3 text-base leading-relaxed sm:min-h-48 sm:text-sm">
            {blocks}
          </div>
        </div>
      </SplitPane>
      <CopyReset text={text} copyLabel="Copy Markdown" filename="notes.md" onReset={() => setText("")} />
    </TextToolShell>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-[var(--nb-primary)]">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--nb-primary)]"
      />
      {label}
    </label>
  )
}

function renderMarkdown(source: string) {
  const chunks = source.split(/\n{2,}/).slice(0, 400)
  return chunks.map((block, index) => {
    const lines = block.split("\n")
    if (lines.every((line) => line.startsWith("- "))) {
      return (
        <ul key={index} className="list-disc pl-5">
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{inline(line.slice(2))}</li>
          ))}
        </ul>
      )
    }
    const heading = /^(#{1,3}) /.exec(lines[0])
    if (heading && lines.length === 1) {
      const Tag = heading[1].length === 1 ? "h2" : "h3"
      return (
        <Tag key={index} className="text-xl font-semibold">
          {inline(lines[0].slice(heading[1].length + 1))}
        </Tag>
      )
    }
    return <p key={index}>{inline(lines.join(" "))}</p>
  })
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link && /^https?:\/\//.test(link[2])) {
      return (
        <a key={index} href={link[2]} className="underline" rel="noreferrer">
          {link[1]}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}
