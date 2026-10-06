"use client"

import {
  CodeField,
  CodeOutput,
  CopyButton,
  DeveloperActions,
  DeveloperPrivacy,
  DownloadAction,
  ErrorPanel,
  ExampleButton,
  KeyboardHint,
  ResetButton,
  ResultSummary,
} from "@/components/developer/kit"
import { formatJson, jsonPreview, jsonStats, lineColumnToOffset, parseJsonSource, sampleJson } from "@/lib/developer/json"
import {
  collectMatches,
  MAX_MATCHES,
  REGEX_FLAGS,
  REGEX_TIMEOUT_MS,
  regexExamples,
  sanitizeFlags,
  toggleFlag,
  type RegexMatch,
  type RegexResult,
} from "@/lib/developer/regex"
import { clampUuidCount, makeUuids, UUID_PRESETS, type UuidVersion } from "@/lib/developer/uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseAmount } from "@/components/tools/ui"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

function formattedSampleJson() {
  const value = JSON.parse(sampleJson)
  const pretty = formatJson(value, 2)
  const compact = formatJson(value, undefined)
  const stats = jsonStats(value, pretty)
  return {
    pretty,
    compact,
    summary: `${stats.type} · ${stats.keys.toLocaleString("en-AU")} ${stats.keys === 1 ? "key" : "keys"} · ${stats.bytes.toLocaleString("en-AU")} bytes`,
  }
}

const initialJson = formattedSampleJson()

export function JsonFormatter() {
  const [source, setSource] = useState(sampleJson)
  const [output, setOutput] = useState(initialJson.pretty)
  const [minified, setMinified] = useState(initialJson.compact)
  const [error, setError] = useState<{ message: string; line: number | null; column: number | null; offset: number | null } | null>(
    null,
  )
  const [indent, setIndent] = useState<"2" | "4">("2")
  const [sortKeys, setSortKeys] = useState(false)
  const [summary, setSummary] = useState<string | null>(initialJson.summary)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const run = useCallback(
    (space: number | undefined) => {
      const parsed = parseJsonSource(source)
      if (!parsed.ok) {
        setOutput("")
        setMinified("")
        setSummary(null)
        setError(parsed.error)
        return
      }
      const pretty = formatJson(parsed.value, space ?? Number(indent), sortKeys)
      const compact = formatJson(parsed.value, undefined, sortKeys)
      const stats = jsonStats(parsed.value, pretty)
      setError(null)
      setOutput(space === undefined ? compact : pretty)
      setMinified(compact)
      setSummary(
        `${stats.type} · ${stats.keys.toLocaleString("en-AU")} ${stats.keys === 1 ? "key" : "keys"} · ${stats.bytes.toLocaleString("en-AU")} bytes`,
      )
    },
    [indent, sortKeys, source],
  )

  function jumpToError() {
    if (!error) return
    const textarea = inputRef.current
    if (!textarea) return
    const offset =
      error.offset ?? (error.line != null && error.column != null ? lineColumnToOffset(source, error.line, error.column) : 0)
    textarea.focus()
    textarea.setSelectionRange(offset, offset)
  }

  const preview = output ? jsonPreview(output) : null

  return (
    <div className="flex flex-col gap-5">
      <DeveloperPrivacy />
      <CodeField
        label="JSON"
        value={source}
        onChange={setSource}
        inputRef={inputRef}
        invalid={Boolean(error)}
        describedBy={error ? "json-error" : undefined}
        placeholder='{"name":"Nice Tools"}'
        onModEnter={() => run(Number(indent))}
      />
      <DeveloperActions>
        <Button type="button" onClick={() => run(Number(indent))}>
          Format
        </Button>
        <Button type="button" variant="outline" onClick={() => run(undefined)}>
          Minify
        </Button>
        <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
          Indent
          <select
            className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={indent}
            onChange={(event) => setIndent(event.target.value as "2" | "4")}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
          <input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} />
          Sort keys
        </label>
        <KeyboardHint />
      </DeveloperActions>
      <DeveloperActions>
        <ExampleButton
          onClick={() => {
            setSource(sampleJson)
            setError(null)
          }}
        />
        <ResetButton
          label="Clear"
          onClick={() => {
            setSource("")
            setOutput("")
            setMinified("")
            setError(null)
            setSummary(null)
          }}
        />
      </DeveloperActions>
      {error ? <ErrorPanel id="json-error" message={error.message} line={error.line} column={error.column} onJump={jumpToError} /> : null}
      {summary && !error ? <ResultSummary>{summary}</ResultSummary> : null}
      {output ? (
        <>
          <CodeOutput label="Result" value={output} preview={preview?.text} />
          <DeveloperActions>
            <CopyButton text={output} label="Copy" />
            <CopyButton text={minified} label="Copy minified" />
            <DownloadAction text={output} filename="formatted.json" mime="application/json" label="Download JSON" />
          </DeveloperActions>
        </>
      ) : null}
    </div>
  )
}

export function UuidGenerator() {
  const [count, setCount] = useState("1")
  const [version, setVersion] = useState<UuidVersion>("v4")
  const amount = clampUuidCount(parseAmount(count) ?? 1)
  const [ids, setIds] = useState<string[]>(() => makeUuids(1, "v4"))

  function generate(nextCount = amount, nextVersion = version) {
    setIds(makeUuids(nextCount, nextVersion))
  }

  return (
    <div className="flex flex-col gap-5">
      <DeveloperPrivacy>UUIDs are created with the Web Crypto API in this browser. They are identifiers, not secrets.</DeveloperPrivacy>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
            Version
            <select
              className="h-11 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10"
              value={version}
              onChange={(event) => setVersion(event.target.value as UuidVersion)}
            >
              <option value="v4">UUID v4 (random)</option>
              <option value="v7">UUID v7 (time-ordered)</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
            How many
            <Input
              inputMode="numeric"
              value={count}
              min={1}
              max={500}
              onChange={(event) => setCount(event.target.value)}
              className="h-11 w-28 tabular-nums sm:h-10"
            />
          </label>
          <Button type="button" className="h-10" onClick={() => generate()}>
            Generate
          </Button>
        </div>
        <DeveloperActions>
          {UUID_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => {
                setCount(String(preset))
                generate(preset, version)
              }}
            >
              {preset}
            </Button>
          ))}
        </DeveloperActions>
      </div>
      <ResultSummary>
        {ids.length} UUID {version} {ids.length === 1 ? "identifier" : "identifiers"}
      </ResultSummary>
      <ul className="flex flex-col gap-2 font-mono text-sm">
        {ids.map((id, index) => (
          <li key={`${id}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
            <span className="break-all">{id}</span>
            <CopyButton text={id} label="Copy" compact />
          </li>
        ))}
      </ul>
      <DeveloperActions>
        <CopyButton text={ids.join("\n")} label="Copy all" />
        <DownloadAction text={ids.join("\n")} filename="uuids.txt" label="Download .txt" />
        <ResetButton
          label="Clear"
          onClick={() => {
            setIds([])
            setCount("1")
          }}
        />
      </DeveloperActions>
    </div>
  )
}

export function RegexTester() {
  const search = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("popstate", onChange)
      return () => window.removeEventListener("popstate", onChange)
    },
    () => window.location.search,
    () => "",
  )
  const urlParams = new URLSearchParams(search)
  const urlPattern = urlParams.get("pattern")
  const urlFlags = urlParams.get("flags")
  const [patternEdit, setPatternEdit] = useState<string | null>(null)
  const [flagsEdit, setFlagsEdit] = useState<string | null>(null)
  const [sample, setSample] = useState<string>(regexExamples[0].sample)
  const pattern = patternEdit ?? urlPattern ?? regexExamples[0].pattern
  const flags = flagsEdit ?? (urlFlags != null ? sanitizeFlags(urlFlags) : regexExamples[0].flags)
  const [result, setResult] = useState<RegexResult | null>(() =>
    collectMatches(regexExamples[0].pattern, regexExamples[0].flags, regexExamples[0].sample),
  )
  const [lastRun, setLastRun] = useState<{ pattern: string; flags: string }>({
    pattern: regexExamples[0].pattern,
    flags: regexExamples[0].flags,
  })
  const [busy, setBusy] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const timerRef = useRef<number | null>(null)

  const run = useCallback(
    (nextPattern = pattern, nextFlags = flags, nextSample = sample) => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      workerRef.current?.terminate()
      workerRef.current = null
      if (!nextPattern) {
        setBusy(false)
        setResult({ ok: false, error: "Enter a JavaScript regular expression to test." })
        return
      }
      setBusy(true)
      const finish = (next: RegexResult) => {
        setBusy(false)
        setResult(next)
        setLastRun({ pattern: nextPattern, flags: sanitizeFlags(nextFlags) })
      }
      const worker = startRegexWorker()
      if (!worker) {
        finish(collectMatches(nextPattern, nextFlags, nextSample))
        return
      }
      workerRef.current = worker
      timerRef.current = window.setTimeout(() => {
        worker.terminate()
        workerRef.current = null
        finish({
          ok: false,
          error: "That pattern took too long. Check for nested repetition, or test a smaller sample.",
        })
      }, REGEX_TIMEOUT_MS)
      worker.onmessage = (event: MessageEvent<RegexResult>) => {
        if (timerRef.current) window.clearTimeout(timerRef.current)
        worker.terminate()
        workerRef.current = null
        finish(event.data)
      }
      worker.onerror = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current)
        worker.terminate()
        workerRef.current = null
        finish(collectMatches(nextPattern, nextFlags, nextSample))
      }
      worker.postMessage({ pattern: nextPattern, flags: sanitizeFlags(nextFlags), sample: nextSample, maxMatches: MAX_MATCHES })
    },
    [flags, pattern, sample],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      workerRef.current?.terminate()
    }
  }, [])

  const matches = result?.ok ? result.matches : []
  const matchText = matches.map((match) => match.text).join("\n")

  return (
    <div className="flex flex-col gap-5">
      <DeveloperPrivacy>
        JavaScript regular expressions, tested in this browser. Other languages can differ. The sample text is never put in the URL.
      </DeveloperPrivacy>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] text-[var(--nb-primary)]">Pattern</span>
          <Input
            value={pattern}
            onChange={(event) => setPatternEdit(event.target.value)}
            spellCheck={false}
            className="h-11 font-mono sm:h-10"
            aria-invalid={result && !result.ok ? true : undefined}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault()
                run()
              }
            }}
          />
        </label>
        <fieldset>
          <legend className="mb-2 text-[13px] text-[var(--nb-primary)]">Flags</legend>
          <div className="flex flex-wrap gap-2">
            {REGEX_FLAGS.map((item) => {
              const on = flags.includes(item.flag)
              return (
                <button
                  key={item.flag}
                  type="button"
                  aria-pressed={on}
                  title={item.hint}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[13px]",
                    on
                      ? "border-[var(--nb-primary)] bg-[var(--nb-accent)] text-[var(--nb-primary)]"
                      : "border-border text-[var(--nb-secondary)]",
                  )}
                  onClick={() => setFlagsEdit(toggleFlag(flags, item.flag))}
                >
                  {item.label}
                  <span className="sr-only"> {item.hint}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>
      <CodeField label="Sample text" value={sample} onChange={setSample} rows={8} onModEnter={() => run()} />
      <DeveloperActions>
        <Button type="button" onClick={() => run()} disabled={busy}>
          {busy ? "Testing…" : "Test"}
        </Button>
        <KeyboardHint />
        {regexExamples.map((example) => (
          <ExampleButton
            key={example.id}
            label={example.label}
            onClick={() => {
              setPatternEdit(example.pattern)
              setFlagsEdit(example.flags)
              setSample(example.sample)
              run(example.pattern, example.flags, example.sample)
            }}
          />
        ))}
        <ResetButton
          label="Clear"
          onClick={() => {
            setPatternEdit("")
            setFlagsEdit("g")
            setSample("")
            setResult(null)
          }}
        />
        <CopyPatternLink pattern={pattern} flags={flags} />
      </DeveloperActions>
      {pattern !== lastRun.pattern || flags !== lastRun.flags ? (
        <ResultSummary>Pattern or flags changed. Test to update the matches.</ResultSummary>
      ) : null}
      {result && !result.ok ? <ErrorPanel message={result.error} /> : null}
      {result?.ok ? (
        <div className="flex flex-col gap-4">
          <ResultSummary>
            {result.matches.length} {result.matches.length === 1 ? "match" : "matches"}
            {result.truncated ? " (showing the first 500)" : ""}
          </ResultSummary>
          <HighlightedSample text={sample} matches={result.matches} />
          {result.matches.length ? (
            <ol className="flex flex-col gap-2">
              {result.matches.map((match, index) => (
                <li key={`${match.index}-${index}`} className="rounded-lg border border-border px-3 py-2 font-mono text-sm">
                  <div className="break-all text-[var(--nb-primary)]">{match.text || "(empty)"}</div>
                  <div className="mt-1 text-[12px] text-[var(--nb-secondary)]">
                    at {match.index}
                    {match.groups.length
                      ? ` · groups: ${match.groups.map((group, groupIndex) => `${groupIndex + 1}=${group}`).join(", ")}`
                      : ""}
                    {match.named
                      ? ` · ${Object.entries(match.named)
                          .map(([name, value]) => `${name}=${value}`)
                          .join(", ")}`
                      : ""}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[var(--nb-secondary)]">No match.</p>
          )}
          {matchText ? (
            <DeveloperActions>
              <CopyButton text={matchText} label="Copy matches" />
              <DownloadAction text={matchText} filename="matches.txt" label="Download matches" />
            </DeveloperActions>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function CopyPatternLink({ pattern, flags }: { pattern: string; flags: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-3"
      aria-live="polite"
      onClick={async () => {
        const url = new URL(window.location.href)
        url.searchParams.set("pattern", pattern)
        url.searchParams.set("flags", sanitizeFlags(flags))
        try {
          await navigator.clipboard.writeText(url.toString())
          setState("copied")
        } catch {
          setState("failed")
        }
        window.setTimeout(() => setState("idle"), 1400)
      }}
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : "Copy pattern link"}
    </Button>
  )
}

function HighlightedSample({ text, matches }: { text: string; matches: RegexMatch[] }) {
  const nodes = useMemo(() => {
    const limit = 50_000
    const source = text.length > limit ? text.slice(0, limit) : text
    const ranges = matches
      .filter((match) => match.index < source.length && match.text.length)
      .slice(0, 200)
      .sort((a, b) => a.index - b.index)
    const parts: { key: string; value: string; match: boolean }[] = []
    let cursor = 0
    for (const match of ranges) {
      if (match.index < cursor) continue
      if (match.index > cursor) parts.push({ key: `t${cursor}`, value: source.slice(cursor, match.index), match: false })
      const end = Math.min(source.length, match.index + match.text.length)
      parts.push({ key: `m${match.index}`, value: source.slice(match.index, end), match: true })
      cursor = end
    }
    if (cursor < source.length) parts.push({ key: `t${cursor}`, value: source.slice(cursor), match: false })
    return { parts, clipped: text.length > limit }
  }, [matches, text])

  if (!text) return null

  return (
    <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-[var(--nb-accent)]/40 p-4 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap">
      {nodes.parts.map((part) =>
        part.match ? (
          <mark key={part.key} className="rounded-sm bg-amber-200/90 text-[var(--nb-primary)] dark:bg-amber-400/25">
            {part.value}
          </mark>
        ) : (
          <span key={part.key}>{part.value}</span>
        ),
      )}
      {nodes.clipped ? <span className="text-[var(--nb-secondary)]">…</span> : null}
    </pre>
  )
}

function startRegexWorker() {
  if (typeof Worker === "undefined") return null
  const source = `
    onmessage = (event) => {
      const { pattern, flags, sample, maxMatches } = event.data
      try {
        const expression = new RegExp(pattern, flags)
        const matches = []
        if (expression.global) {
          expression.lastIndex = 0
          for (const match of sample.matchAll(expression)) {
            matches.push({
              text: match[0],
              index: match.index || 0,
              groups: match.slice(1).filter((item) => item != null),
              named: match.groups && Object.keys(match.groups).length ? Object.assign({}, match.groups) : undefined
            })
            if (matches.length >= maxMatches) {
              postMessage({ ok: true, matches, truncated: true })
              return
            }
          }
          postMessage({ ok: true, matches, truncated: false })
          return
        }
        const match = expression.exec(sample)
        if (match) {
          matches.push({
            text: match[0],
            index: match.index || 0,
            groups: match.slice(1).filter((item) => item != null),
            named: match.groups && Object.keys(match.groups).length ? Object.assign({}, match.groups) : undefined
          })
        }
        postMessage({ ok: true, matches, truncated: false })
      } catch (error) {
        postMessage({ ok: false, error: error && error.message ? error.message : "Invalid pattern." })
      }
    }
  `
  try {
    return new Worker(URL.createObjectURL(new Blob([source], { type: "text/javascript" })))
  } catch {
    return null
  }
}
