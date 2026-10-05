import assert from "node:assert/strict"
import test from "node:test"
import { inferTable, parseNumber, parseTable, tableToSeries } from "./parse.ts"
import { parseFlexibleDate } from "./dates.ts"

test("parseNumber strips currency and commas", () => {
  assert.equal(parseNumber("$1,240"), 1240)
  assert.equal(parseNumber("12%"), 12)
  assert.equal(parseNumber("nope"), null)
})

test("parseTable reads TSV from Sheets", () => {
  const table = parseTable("Product\tQ1\tQ2\nApron\t12\t18\nBarge\t9\t11")
  assert.deepEqual(table[0], ["Product", "Q1", "Q2"])
  assert.equal(table.length, 3)
})

test("inferTable maps label and series", () => {
  const inferred = inferTable("Region,Revenue,Cost\nNorth,40,12\nSouth,22,9")
  assert.ok(inferred)
  const converted = tableToSeries(inferred)
  assert.deepEqual(converted.series, ["Revenue", "Cost"])
  assert.equal(converted.rows[0].label, "North")
  assert.deepEqual(converted.rows[0].values, [40, 12])
})

test("flexible dates", () => {
  assert.equal(parseFlexibleDate("2026")?.precision, "year")
  assert.equal(parseFlexibleDate("Q1 2026")?.precision, "quarter")
  assert.equal(parseFlexibleDate("March 2026")?.precision, "month")
  assert.equal(parseFlexibleDate("10 March 2026")?.precision, "day")
})
