"use client"

import { CodeField, CopyButton, DeveloperActions, DeveloperPrivacy, DownloadAction, ErrorPanel, ResetButton } from "@/components/developer/kit"
import { Button } from "@/components/ui/button"
import { parseJsonSource } from "@/lib/developer/json"
import { defaultSchemaOptions, generateJsonSchema, type SchemaOptions } from "@/lib/tools/json-schema"
import { useMemo, useState } from "react"

const sample = `{
  "name": "Ada Lovelace",
  "active": true,
  "score": 36,
  "tags": ["maths", "computing"]
}`

export function JsonSchemaGenerator() {
  const [json, setJson] = useState(sample)
  const [options, setOptions] = useState<SchemaOptions>(defaultSchemaOptions)
  const result = useMemo(() => {
    const parsed = parseJsonSource(json)
    if (!json.trim()) return { schema: "", error: null }
    if (!parsed.ok) return { schema: "", error: parsed.error }
    return { schema: JSON.stringify(generateJsonSchema(parsed.value, options), null, 2), error: null }
  }, [json, options])

  return (
    <div className="flex flex-col gap-6">
      <DeveloperPrivacy>Paste JSON and get a readable JSON Schema inferred from the values. Nothing is uploaded.</DeveloperPrivacy>
      <CodeField label="JSON" value={json} onChange={setJson} rows={10} placeholder='{"name":"Ada"}' invalid={Boolean(result.error)} />
      <div className="flex flex-col gap-2 text-sm">
        {(
          [
            ["required", "Mark object keys as required"],
            ["additionalProperties", "Allow extra object keys"],
            ["detectInteger", "Use integer when a number has no fraction"],
            ["includeExamples", "Include example values"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>
      {result.error ? <ErrorPanel message={result.error.message} line={result.error.line} column={result.error.column} /> : null}
      {result.schema ? (
        <>
          <pre className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-[var(--nb-accent)] p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all">
            {result.schema}
          </pre>
          <DeveloperActions>
            <CopyButton text={result.schema} label="Copy schema" />
            <DownloadAction text={result.schema} filename="schema.json" mime="application/json" label="Download JSON" />
            <ResetButton
              label="Clear"
              onClick={() => setJson("")}
            />
            <Button type="button" variant="outline" className="h-10" onClick={() => setJson(sample)}>
              Load example
            </Button>
          </DeveloperActions>
        </>
      ) : !result.error ? (
        <p className="text-sm text-[var(--nb-secondary)]">Paste JSON to generate a schema.</p>
      ) : null}
    </div>
  )
}
