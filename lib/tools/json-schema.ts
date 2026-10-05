export type SchemaOptions = {
  additionalProperties: boolean
  required: boolean
  detectInteger: boolean
  includeExamples: boolean
}

export const defaultSchemaOptions: SchemaOptions = {
  additionalProperties: false,
  required: true,
  detectInteger: true,
  includeExamples: false,
}

export function generateJsonSchema(value: unknown, options: SchemaOptions = defaultSchemaOptions): Record<string, unknown> {
  const schema = inferSchema(value, options)
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...schema,
  }
}

function inferSchema(value: unknown, options: SchemaOptions): Record<string, unknown> {
  if (value === null) return { type: "null" }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array", items: {} }
    const merged = mergeSchemas(value.map((item) => inferSchema(item, options)))
    return { type: "array", items: merged }
  }
  switch (typeof value) {
    case "string":
      return withExample({ type: "string" }, value, options)
    case "boolean":
      return withExample({ type: "boolean" }, value, options)
    case "number":
      return withExample(
        { type: options.detectInteger && Number.isInteger(value) ? "integer" : "number" },
        value,
        options,
      )
    case "object": {
      const properties: Record<string, Record<string, unknown>> = {}
      const keys = Object.keys(value as Record<string, unknown>)
      for (const key of keys) {
        properties[key] = inferSchema((value as Record<string, unknown>)[key], options)
      }
      const schema: Record<string, unknown> = {
        type: "object",
        properties,
        additionalProperties: options.additionalProperties,
      }
      if (options.required && keys.length) schema.required = keys
      return schema
    }
    default:
      return {}
  }
}

function withExample(schema: Record<string, unknown>, value: unknown, options: SchemaOptions) {
  if (options.includeExamples) schema.examples = [value]
  return schema
}

function mergeSchemas(schemas: Record<string, unknown>[]): Record<string, unknown> {
  const types = new Set(schemas.map((schema) => schema.type).filter(Boolean))
  if (types.size === 1 && types.has("object")) {
    const keys = new Set<string>()
    for (const schema of schemas) {
      const properties = schema.properties as Record<string, Record<string, unknown>> | undefined
      if (properties) for (const key of Object.keys(properties)) keys.add(key)
    }
    const properties: Record<string, Record<string, unknown>> = {}
    for (const key of keys) {
      const parts = schemas
        .map((schema) => (schema.properties as Record<string, Record<string, unknown>> | undefined)?.[key])
        .filter((part): part is Record<string, unknown> => Boolean(part))
      properties[key] = parts.length ? mergeSchemas(parts) : {}
    }
    return { type: "object", properties, additionalProperties: schemas[0]?.additionalProperties ?? false }
  }
  if (types.size === 1) return { ...schemas[0] }
  if (types.has("integer") && types.has("number") && types.size === 2) return { type: "number" }
  return { anyOf: uniqueSchemas(schemas) }
}

function uniqueSchemas(schemas: Record<string, unknown>[]) {
  const seen = new Set<string>()
  const unique: Record<string, unknown>[] = []
  for (const schema of schemas) {
    const key = JSON.stringify(schema)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(schema)
  }
  return unique
}
