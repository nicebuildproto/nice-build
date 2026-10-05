"use client"

import { CopyButton, ErrorNote, ResetButton, TextArea, ToolNote } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { defaultSchemaOptions, generateJsonSchema, type SchemaOptions } from "@/lib/tools/json-schema"
import { downloadText } from "@/lib/tools/download"
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
    try {
      const value = JSON.parse(json)
      return { schema: JSON.stringify(generateJsonSchema(value, options), null, 2), error: null }
    } catch (err) {
      return { schema: "", error: err instanceof Error ? err.message : "That JSON could not be parsed." }
    }
  }, [json, options])

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>Paste JSON and get a readable JSON Schema inferred from the values. Nothing is uploaded.</ToolNote>
      <TextArea label="JSON" value={json} onChange={setJson} rows={10} placeholder='{"name":"Ada"}' />
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
      {result.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      {result.schema ? (
        <>
          <pre className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-[var(--nb-accent)]/40 p-4 font-mono text-[13px] leading-relaxed">
            {result.schema}
          </pre>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={result.schema} label="Copy schema" />
            <Button type="button" variant="outline" className="h-10" onClick={() => downloadText(result.schema, "schema.json", "application/json")}>
              Download JSON
            </Button>
            <ResetButton onClick={() => setJson("")} />
          </div>
        </>
      ) : !result.error ? (
        <p className="text-sm text-[var(--nb-secondary)]">Paste JSON to generate a schema.</p>
      ) : null}
    </div>
  )
}
