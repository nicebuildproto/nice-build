import assert from "node:assert/strict"
import test from "node:test"
import { positionSize, stakingYield, tradeProfit } from "./calc.ts"

test("APR with no compounding is simple interest", () => {
  const result = stakingYield({ amount: 1000, ratePercent: 5, days: 365, kind: "apr", periods: 1, feePercent: 0 })
  assert.ok(result)
  assert.equal(result.net, 50)
  assert.match(result.basis, /no compounding/)
})

test("APY is not compounded a second time", () => {
  const result = stakingYield({ amount: 1000, ratePercent: 5, days: 365, kind: "apy", periods: 12, feePercent: 0 })
  assert.ok(result)
  assert.ok(Math.abs(result.net - 50) < 1e-9)
  assert.match(result.basis, /not compounded again/)
})

test("a negative APR reduces the balance and is not compounded unless asked", () => {
  const result = stakingYield({ amount: 1000, ratePercent: -5, days: 365, kind: "apr", periods: 1, feePercent: 0 })
  assert.equal(result?.net, -50)
  assert.equal(stakingYield({ amount: 1000, ratePercent: -100, days: 365, kind: "apy", periods: 1, feePercent: 0 }), null)
})

test("a reward fee is taken off the yield", () => {
  const result = stakingYield({ amount: 1000, ratePercent: 5, days: 365, kind: "apr", periods: 1, feePercent: 10 })
  assert.equal(result?.fee, 5)
  assert.equal(result?.net, 45)
})

test("position size is risk divided by the stop distance", () => {
  const result = positionSize(10000, 1, 100, 95)
  assert.ok(result)
  assert.equal(result.riskAmount, 100)
  assert.equal(result.units, 20)
  assert.equal(result.notional, 2000)
  assert.equal(positionSize(10000, 1, 0, 5)?.units, 20)
  assert.equal(positionSize(10000, 1, 100, 100), null)
})

test("profit shows cost, proceeds, and a fee on each side", () => {
  const result = tradeProfit(0.4, 90000, 104000, 0.1)
  assert.ok(result)
  assert.equal(result.cost, 36000)
  assert.equal(result.proceeds, 41600)
  assert.ok(Math.abs(result.fees - 77.6) < 1e-9)
  assert.ok(Math.abs(result.profit - 5522.4) < 1e-6)
  assert.equal(tradeProfit(-1, 1, 2, 0), null)
})
