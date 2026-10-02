"use client"

import { CopyButton, Field, NumberField, TextArea, parseAmount } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMemo, useState } from "react"

export function JsonFormatter() {
  const [source, setSource] = useState('{"name":"Nice Build","tools":2}')
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)

  function run(space: number | undefined) {
    try {
      setOutput(JSON.stringify(JSON.parse(source), null, space))
      setError(null)
    } catch (err) {
      setOutput("")
      setError(err instanceof Error ? err.message : "That is not valid JSON.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TextArea label="JSON" value={source} onChange={setSource} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => run(2)}>
          Format
        </Button>
        <Button type="button" variant="outline" onClick={() => run(undefined)}>
          Minify
        </Button>
        {output ? <CopyButton text={output} /> : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {output ? (
        <pre className="overflow-x-auto rounded-xl border border-border bg-[var(--nb-accent)] p-4 text-[13px] leading-relaxed">
          {output}
        </pre>
      ) : null}
    </div>
  )
}

export function UuidGenerator() {
  const [count, setCount] = useState("4")
  const [ids, setIds] = useState<string[]>(() => makeIds(4))
  const amount = Math.min(20, Math.max(1, Math.round(parseAmount(count) ?? 4)))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <NumberField label="How many" value={count} onChange={setCount} min={1} step="1" />
        <Button type="button" onClick={() => setIds(makeIds(amount))}>
          Generate
        </Button>
        <CopyButton text={ids.join("\n")} label="Copy all" />
      </div>
      <ul className="flex flex-col gap-2 font-mono text-sm">
        {ids.map((id) => (
          <li key={id} className="rounded-lg border border-border px-3 py-2">
            {id}
          </li>
        ))}
      </ul>
    </div>
  )
}

function makeIds(count: number) {
  return Array.from({ length: count }, () => crypto.randomUUID())
}

export function RegexTester() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b")
  const [flags, setFlags] = useState("g")
  const [sample, setSample] = useState("Write to hello@nice.build or team@nice.build.")
  const result = useMemo(() => {
    try {
      const expression = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`)
      return { matches: Array.from(sample.matchAll(expression)), error: null as string | null }
    } catch (err) {
      return { matches: [], error: err instanceof Error ? err.message : "Invalid pattern." }
    }
  }, [pattern, flags, sample])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="Pattern">
          <Input value={pattern} onChange={(event) => setPattern(event.target.value)} className="h-10 font-mono" />
        </Field>
        <Field label="Flags">
          <Input value={flags} onChange={(event) => setFlags(event.target.value)} className="h-10 font-mono" />
        </Field>
      </div>
      <TextArea label="Sample" value={sample} onChange={setSample} rows={5} />
      {result.error ? <p className="text-sm text-destructive">{result.error}</p> : null}
      <div>
        <p className="text-xs font-medium text-[var(--nb-secondary)]">
          {result.matches.length} {result.matches.length === 1 ? "match" : "matches"}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {result.matches.map((match, index) => (
            <li key={`${match.index}-${index}`} className="rounded-lg bg-[var(--nb-accent)] px-3 py-2 font-mono text-sm">
              {match[0]}
              <span className="ml-3 text-[var(--nb-secondary)]">at {match.index}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
