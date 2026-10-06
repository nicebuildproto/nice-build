import assert from "node:assert/strict"
import test from "node:test"
import { collectMatches, sanitizeFlags, toggleFlag } from "./regex.ts"
import {
  formatJson,
  jsonPreview,
  jsonStats,
  parseJsonError,
  parseJsonSource,
  sortJsonKeys,
} from "./json.ts"
import { clampUuidCount, isUuid, makeUuids, uuidVersionNibble, uuidv7 } from "./uuid.ts"
import { decodeBase64, encodeBase64 } from "../tools/pure.ts"

test("JSON pretty, minify, and sort keys", () => {
  const value = { b: 1, a: [2, { z: 3, m: 4 }] }
  assert.equal(formatJson(value, 2), `{
  "b": 1,
  "a": [
    2,
    {
      "z": 3,
      "m": 4
    }
  ]
}`)
  assert.equal(formatJson(value, undefined), '{"b":1,"a":[2,{"z":3,"m":4}]}')
  assert.deepEqual(sortJsonKeys(value), { a: [2, { m: 4, z: 3 }], b: 1 })
  assert.equal(formatJson(value, 2, true).indexOf('"a"'), 4)
})

test("JSON parse reports line and column", () => {
  const source = `{
  "ok": true,
  "bad":
}`
  const parsed = parseJsonSource(source)
  assert.equal(parsed.ok, false)
  if (parsed.ok) return
  assert.ok(parsed.error.message.length > 8)
  const trailing = parseJsonSource('{"a": 1,}')
  assert.equal(trailing.ok, false)
  if (!trailing.ok) {
    assert.equal(trailing.error.line, 1)
    assert.ok((trailing.error.column ?? 0) >= 8)
    assert.match(trailing.error.message, /line 1/)
  }
})

test("JSON empty, unicode, and whitespace", () => {
  assert.equal(parseJsonSource("").ok, false)
  assert.equal(parseJsonSource("   \n").ok, false)
  const unicode = parseJsonSource('{"name":"Ada Lovelace","mark":"✓"}')
  assert.equal(unicode.ok, true)
  if (unicode.ok) {
    const record = unicode.value as { name: string; mark: string }
    assert.equal(record.name, "Ada Lovelace")
    assert.equal(record.mark, "✓")
  }
  const spaced = parseJsonSource('  {"ok": true}  ')
  assert.equal(spaced.ok, true)
})

test("JSON error from position maps to line 1", () => {
  const error = parseJsonError("{ok:true}", new SyntaxError("Unexpected token o in JSON at position 1"))
  assert.equal(error.line, 1)
  assert.equal(error.column, 2)
  assert.match(error.message, /line 1, column 2/)
})

test("JSON stats and preview", () => {
  const source = '{"a":1,"b":{"c":2}}'
  const value = JSON.parse(source)
  const stats = jsonStats(value, source)
  assert.equal(stats.type, "object")
  assert.equal(stats.keys, 3)
  assert.equal(stats.chars, source.length)
  const preview = jsonPreview("x".repeat(10), 4)
  assert.equal(preview.truncated, true)
  assert.equal(preview.hidden, 6)
  assert.ok(preview.text.startsWith("xxxx"))
})

test("malformed JSON trailing comma", () => {
  const parsed = parseJsonSource('{"a": 1,}')
  assert.equal(parsed.ok, false)
})

test("UUID count clamp and uniqueness", () => {
  assert.equal(clampUuidCount(0), 1)
  assert.equal(clampUuidCount(12.6), 13)
  assert.equal(clampUuidCount(9999), 500)
  const ids = makeUuids(40, "v4")
  assert.equal(ids.length, 40)
  assert.equal(new Set(ids).size, 40)
  for (const id of ids) {
    assert.equal(isUuid(id), true)
    assert.equal(uuidVersionNibble(id), "4")
  }
})

test("UUID v7 version nibble and ordering", () => {
  const first = uuidv7(1_700_000_000_000)
  const second = uuidv7(1_700_000_000_001)
  assert.equal(uuidVersionNibble(first), "7")
  assert.equal(uuidVersionNibble(second), "7")
  assert.ok(first < second)
  const many = makeUuids(5, "v7", 1_800_000_000_000)
  assert.equal(many.length, 5)
  assert.deepEqual([...many].sort(), many)
})

test("regex flags, groups, and no forced global", () => {
  assert.equal(sanitizeFlags("gixz"), "gi")
  assert.equal(toggleFlag("g", "i"), "gi")
  assert.equal(toggleFlag("gi", "g"), "i")
  const once = collectMatches(String.raw`(\w+)@(\w+)`, "", "a@b c@d")
  assert.equal(once.ok, true)
  if (once.ok) {
    assert.equal(once.matches.length, 1)
    assert.equal(once.matches[0].text, "a@b")
    assert.deepEqual(once.matches[0].groups, ["a", "b"])
  }
  const all = collectMatches(String.raw`(\w+)@(\w+)`, "g", "a@b c@d")
  assert.equal(all.ok, true)
  if (all.ok) assert.equal(all.matches.length, 2)
})

test("regex invalid, empty, unicode, and named groups", () => {
  const empty = collectMatches("", "g", "text")
  assert.equal(empty.ok, false)
  const bad = collectMatches("(", "g", "text")
  assert.equal(bad.ok, false)
  if (!bad.ok) assert.ok(bad.error.length > 0)
  const unicode = collectMatches("café", "gi", "Café CAFE café")
  assert.equal(unicode.ok, true)
  if (unicode.ok) assert.equal(unicode.matches.length, 2)
  const named = collectMatches("(?<who>\\w+)@(?<host>\\w+)", "g", "ada@tools")
  assert.equal(named.ok, true)
  if (named.ok) {
    assert.equal(named.matches[0].named?.who, "ada")
    assert.equal(named.matches[0].named?.host, "tools")
  }
})

test("regex match cap and case flag", () => {
  const many = collectMatches("a", "g", "a".repeat(600), 500)
  assert.equal(many.ok, true)
  if (many.ok) {
    assert.equal(many.matches.length, 500)
    assert.equal(many.truncated, true)
  }
  const ignore = collectMatches("Nice", "i", "NICE tools")
  assert.equal(ignore.ok, true)
  if (ignore.ok) assert.equal(ignore.matches[0].text, "NICE")
})

test("large JSON formats without throwing", () => {
  const items = Array.from({ length: 2000 }, (_, index) => ({ id: index, name: `tool-${index}`, ok: true }))
  const source = JSON.stringify(items)
  assert.ok(source.length > 50_000)
  const parsed = parseJsonSource(source)
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const pretty = formatJson(parsed.value, 2)
  assert.ok(pretty.includes('"name": "tool-0"'))
  const preview = jsonPreview(pretty, 1_000)
  assert.equal(preview.truncated, true)
})

test("Base64 unicode, whitespace, and invalid input", () => {
  assert.equal(encodeBase64("Nice Build"), "TmljZSBCdWlsZA==")
  assert.equal(decodeBase64("TmljZSBCdWlsZA=="), "Nice Build")
  assert.equal(decodeBase64(" TmljZSBCdWlsZA== \n"), "Nice Build")
  assert.equal(decodeBase64(encodeBase64("✓ café")), "✓ café")
  assert.throws(() => decodeBase64("!!!!"), /Base64/)
})
