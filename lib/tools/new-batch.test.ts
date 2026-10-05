import assert from "node:assert/strict"
import test from "node:test"
import { contextUsage, promptCost } from "../ai/pricing.ts"
import { generateJsonSchema } from "./json-schema.ts"
import { analysePassword } from "./password-strength.ts"
import { parseEmailHeaders } from "./email-headers.ts"
import { debtPayoff, netWorth } from "./finance.ts"
import { horizontalFromVertical, verticalFromHorizontal } from "./fov.ts"
import { convertSensitivity, edpi, cmPer360 } from "./sensitivity.ts"
import { overlapHours, plannerGrid } from "./timezone-planner.ts"
import { gridCss } from "./css-grid.ts"
import { layoutWaterfall } from "../viz/waterfall.ts"

test("json schema infers objects, arrays, and integers", () => {
  const schema = generateJsonSchema({ name: "Ada", age: 36, tags: ["maths", "code"] }, { additionalProperties: false, required: true, detectInteger: true, includeExamples: false })
  const properties = schema.properties as Record<string, { type: string }>
  assert.equal(properties.name.type, "string")
  assert.equal(properties.age.type, "integer")
  assert.deepEqual(schema.required, ["name", "age", "tags"])
  const items = (properties.tags as unknown as { items: { type: string } }).items
  assert.equal(items.type, "string")
})

test("json schema rejects nothing useful on malformed caller input", () => {
  const schema = generateJsonSchema(null)
  assert.equal(schema.type, "null")
})

test("password strength flags common and short secrets", () => {
  const empty = analysePassword("")
  assert.equal(empty.band, "empty")
  const common = analysePassword("password")
  assert.equal(common.band, "very-weak")
  const stronger = analysePassword("correct-horse-battery-staple-92")
  assert.ok(stronger.score > common.score)
  assert.ok(stronger.band === "strong" || stronger.band === "very-strong")
})

test("email headers parse routing and auth tokens", () => {
  const parsed = parseEmailHeaders(`From: Ada <ada@example.com>\r\nTo: Bob <bob@example.com>\r\nSubject: Hello\r\nDate: Mon, 5 Oct 2026 10:00:00 +1100\r\nReceived: from mx.example.net by inbound.example.com with ESMTPS; Mon, 5 Oct 2026 10:00:01 +1100\r\nAuthentication-Results: mx.example.net; spf=pass smtp.mailfrom=example.com; dkim=pass header.d=example.com; dmarc=pass`)
  assert.ok(!("error" in parsed))
  if ("error" in parsed) return
  assert.equal(parsed.from, "Ada <ada@example.com>")
  assert.equal(parsed.received.length, 1)
  assert.equal(parsed.auth.spf, "pass")
  assert.equal(parsed.auth.dkim, "pass")
  assert.equal(parsed.auth.dmarc, "pass")
})

test("email headers reject empty and non-header text", () => {
  assert.equal((parseEmailHeaders("") as { error: string }).error.includes("Paste"), true)
  assert.equal((parseEmailHeaders("just a sentence") as { error: string }).error.includes("don’t look"), true)
})

test("net worth subtracts liabilities", () => {
  const result = netWorth(
    [{ id: "a", label: "Cash", amount: 12000 }, { id: "b", label: "Home", amount: 480000 }],
    [{ id: "c", label: "Mortgage", amount: 310000 }],
  )
  assert.equal(result.totalAssets, 492000)
  assert.equal(result.totalLiabilities, 310000)
  assert.equal(result.net, 182000)
})

test("debt payoff with extra payment finishes sooner", () => {
  const base = debtPayoff({ balance: 8000, annualRate: 18, minimum: 240, extra: 0 }, new Date("2026-10-01"))
  const extra = debtPayoff({ balance: 8000, annualRate: 18, minimum: 240, extra: 120 }, new Date("2026-10-01"))
  assert.ok(!("error" in base) && !("error" in extra))
  if ("error" in base || "error" in extra) return
  assert.ok(extra.months < base.months)
  assert.ok(extra.totalInterest < base.totalInterest)
})

test("debt payoff reports never-ending interest-only payments", () => {
  const result = debtPayoff({ balance: 10000, annualRate: 24, minimum: 10, extra: 0 })
  assert.ok("error" in result)
})

test("fov conversion round-trips", () => {
  const v = verticalFromHorizontal(103, 16 / 9)
  const h = horizontalFromVertical(v, 16 / 9)
  assert.ok(Math.abs(h - 103) < 1e-9)
})

test("eDPI and cm/360 conversion", () => {
  assert.equal(edpi(800, 0.4), 320)
  const cm = cmPer360(800, 1.2, 0.022)
  assert.ok(Math.abs(cm - 43.295) < 0.01)
  const valorant = convertSensitivity(1.2, 0.022, 0.07)
  assert.ok(Math.abs(valorant - 0.377) < 0.01)
})

test("timezone planner marks overlap work hours", () => {
  const rows = plannerGrid("2026-10-05", ["lon", "nyc"])
  assert.equal(rows.length, 2)
  const hours = overlapHours(rows)
  assert.ok(hours.length > 0)
  for (const hour of hours) {
    assert.equal(rows[0].cells[hour].work, true)
    assert.equal(rows[1].cells[hour].work, true)
  }
})

test("prompt cost and remaining context", () => {
  const cost = promptCost(800, 300, 2, 10, 1000)
  assert.ok(Math.abs(cost.perRequest - 0.0046) < 1e-9)
  assert.ok(Math.abs(cost.total - 4.6) < 1e-9)
  const used = contextUsage(12000, 2000, 128000)
  assert.equal(used.used, 14000)
  assert.equal(used.remaining, 114000)
})

test("css grid emits template columns", () => {
  const css = gridCss({
    columns: 3,
    rows: 2,
    columnGap: 16,
    rowGap: 12,
    justifyItems: "stretch",
    alignItems: "stretch",
    justifyContent: "start",
    alignContent: "start",
    templateColumns: "",
    templateRows: "",
    areas: "",
    useAreas: false,
  })
  assert.ok(css.includes("display: grid"))
  assert.ok(css.includes("repeat(3, minmax(0, 1fr))"))
})

test("waterfall layout connects relative bars to running total", () => {
  const bars = layoutWaterfall([
    { label: "Open", value: 100, kind: "total" },
    { label: "Up", value: 20, kind: "relative" },
    { label: "Down", value: -10, kind: "relative" },
    { label: "Close", value: 110, kind: "total" },
  ])
  assert.equal(bars[1].start, 100)
  assert.equal(bars[1].end, 120)
  assert.equal(bars[2].start, 120)
  assert.equal(bars[2].end, 110)
  assert.equal(bars[3].end, 110)
})
