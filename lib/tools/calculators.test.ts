import assert from "node:assert/strict"
import test from "node:test"
import {
  applyDecrease,
  applyIncrease,
  percentChange,
  percentOf,
  tipSplit,
  whatPercent,
} from "../calculators/math.ts"
import { percent } from "./format.ts"
import {
  australianTakeHome,
  bmi,
  convertUnit,
  evaluateExpression,
  futureValue,
  loanPayment,
  salesTax,
} from "./pure.ts"

test("percentage of and what-percent", () => {
  assert.equal(percentOf(15, 200), 30)
  assert.equal(whatPercent(25, 200), 12.5)
  assert.equal(whatPercent(10, 0), null)
  assert.equal(percentOf(0, 80), 0)
  assert.equal(percentOf(-10, 80), -8)
})

test("increase, decrease, and percent change", () => {
  assert.deepEqual(applyIncrease(20, 50), { next: 60, delta: 10 })
  assert.deepEqual(applyDecrease(15, 80), { next: 68, delta: 12 })
  assert.equal(percentChange(50, 60), 20)
  assert.equal(percentChange(80, 68), -15)
  assert.equal(percentChange(0, 10), null)
  assert.equal(applyDecrease(100, 40).next, 0)
  assert.ok(applyDecrease(150, 40).next < 0)
})

test("tip split", () => {
  const result = tipSplit(86, 10, 2)
  assert.ok(result)
  assert.equal(result.tipAmount, 8.6)
  assert.equal(result.total, 94.6)
  assert.equal(result.each, 47.3)
  assert.equal(tipSplit(86, 10, 0), null)
})

test("percent formatter keeps useful decimals", () => {
  assert.equal(percent(12.5), "12.5%")
  assert.equal(percent(13), "13%")
})

test("loan payment matches amortising formula", () => {
  const result = loanPayment(20000, 6.5, 5)
  assert.ok(Math.abs(result.payment - 391.32) < 0.01)
  assert.ok(result.total > 20000)
  assert.ok(Math.abs(result.interest - (result.total - 20000)) < 0.0001)
  const zero = loanPayment(12000, 0, 1)
  assert.equal(zero.payment, 1000)
})

test("future value with and without rate", () => {
  const grown = futureValue(1000, 4, 5, 12, 400)
  const flat = futureValue(1000, 0, 5, 12, 400)
  assert.equal(flat, 1000 + 400 * 60)
  assert.ok(grown > flat)
})

test("sales tax add and extract round-trip", () => {
  const added = salesTax(80, 10, "add")
  assert.equal(added.tax, 8)
  assert.equal(added.total, 88)
  const extracted = salesTax(88, 10, "extract")
  assert.ok(Math.abs(extracted.net - 80) < 1e-10)
  assert.ok(Math.abs(extracted.tax - 8) < 1e-10)
})

test("australian take-home on stage 3 brackets", () => {
  const result = australianTakeHome(18200)
  assert.equal(result.tax, 0)
  assert.ok(Math.abs(result.medicare - 364) < 0.001)
  const higher = australianTakeHome(95000)
  assert.ok(higher.takeHome < 95000)
  assert.ok(higher.takeHome > 70000)
})

test("bmi bands and unit conversion", () => {
  const result = bmi(72, 178)
  assert.ok(Math.abs(result.value - 22.7) < 0.05)
  assert.equal(result.label, "Healthy weight")
  assert.ok(Math.abs(convertUnit(1, "m", "ft") - 3.28084) < 0.0001)
  assert.equal(convertUnit(0, "°C", "°F"), 32)
  assert.throws(() => convertUnit(1, "m", "kg"))
})

test("expression evaluator and division by zero", () => {
  assert.equal(evaluateExpression("12*(4+1)"), 60)
  assert.equal(evaluateExpression("10%3"), 1)
  assert.throws(() => evaluateExpression("1/0"))
  assert.equal(evaluateExpression(""), null)
})
