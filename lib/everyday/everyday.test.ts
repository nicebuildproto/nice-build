import { diceCountMax, formatRoll, rollDie } from "../dice/roll"
import { ageDetails, formatAge, nextBirthday, parseLocalDate } from "./age"
import { carbonEstimate, screenTime } from "./audit"
import { batteryRead } from "./battery"
import { duplicateNote, parseList, removeAt } from "./picker"
import { randomInt } from "./random"
import { scaledRecipe } from "./recipe"
import {
  countdownParts,
  durationFromFields,
  formatCountdownClock,
  formatStopwatch,
  remainingMs,
} from "./time"
import { wheelIndex, wheelWinner } from "./wheel"
import assert from "node:assert/strict"
import test from "node:test"

test("randomInt stays inside inclusive bounds and accepts swapped ends", () => {
  for (let i = 0; i < 200; i += 1) {
    const value = randomInt(3, 8)
    assert.ok(value >= 3 && value <= 8)
    assert.equal(randomInt(4, 4), 4)
    const swapped = randomInt(10, 1)
    assert.ok(swapped >= 1 && swapped <= 10)
  }
})

test("parseList trims blanks and reports duplicates", () => {
  const list = parseList("Ada\n\nAda\nLin \n")
  assert.deepEqual(list.items, ["Ada", "Ada", "Lin"])
  assert.equal(list.unique, 2)
  assert.deepEqual(list.duplicates, [{ value: "Ada", count: 2 }])
  assert.match(duplicateNote(list) ?? "", /Ada/)
  assert.deepEqual(removeAt(list.items, 0), ["Ada", "Lin"])
})

test("countdown parts tick and mark completion", () => {
  const parts = countdownParts(1_000, 0)
  assert.ok(parts)
  assert.equal(parts.complete, false)
  assert.equal(parts.days, 0)
  assert.equal(parts.seconds, 1)
  const done = countdownParts(0, 500)
  assert.equal(done?.complete, true)
  assert.equal(done?.past, true)
  assert.equal(done?.seconds, 0)
})

test("stopwatch and kitchen clocks format without relying on animation", () => {
  assert.equal(formatStopwatch(65_200), "01:05.2")
  assert.equal(formatStopwatch(3_600_000), "1:00:00.0")
  assert.equal(formatCountdownClock(90_000), "01:30")
  assert.equal(formatCountdownClock(3_661_000), "1:01:01")
  assert.equal(durationFromFields("1.5", "0"), 90_000)
  assert.equal(durationFromFields("0", "45"), 45_000)
  assert.equal(remainingMs(1_000, 400, null), 600)
  assert.equal(remainingMs(1_000, 400, 250), 250)
  assert.equal(remainingMs(null, 400, null), null)
})

test("age uses calendar arithmetic, leap days, and next birthday", () => {
  const leap = ageDetails("2020-02-29", "2024-02-29")
  assert.ok(leap)
  assert.equal(leap.years, 4)
  assert.equal(leap.months, 0)
  assert.equal(leap.days, 0)
  assert.equal(leap.totalDays, 1461)
  assert.equal(formatAge(leap), "4 years, 0 months, 0 days")

  const exact = ageDetails("1994-06-12", "2026-06-12")
  assert.equal(exact?.years, 32)
  assert.equal(exact?.daysUntilBirthday, 0)

  const before = ageDetails("1994-06-12", "1994-06-11")
  assert.equal(before, null)

  const born = parseLocalDate("2000-02-29")
  const asOf = parseLocalDate("2025-03-01")
  assert.ok(born && asOf)
  const next = nextBirthday(born, asOf)
  assert.equal(next.getFullYear(), 2026)
  assert.equal(next.getMonth(), 1)
  assert.equal(next.getDate(), 28)

  const invalid = parseLocalDate("2024-02-30")
  assert.equal(invalid, null)
})

test("wheel winner comes from the landing angle", () => {
  const names = ["Ada", "Lin", "Noor", "Sam"]
  assert.equal(wheelIndex(4, 0), 0)
  assert.equal(wheelWinner(names, 90)?.name, "Sam")
  assert.equal(wheelWinner(names, 180)?.name, "Noor")
  assert.equal(wheelWinner([], 10), null)
})

test("recipe scaler keeps the existing quantity rules", () => {
  const scaled = scaledRecipe("2 cups flour\n1/2 tsp salt\n1 1/2 tbsp oil\nsalt to taste", 4, 6)
  assert.equal(scaled, "3 cups flour\n0.75 tsp salt\n2.25 tbsp oil\nsalt to taste")
  assert.equal(scaledRecipe("2 cups", 0, 6), null)
})

test("screen time and carbon estimates stay deterministic", () => {
  const screen = screenTime({ social: 1.5, video: 1, games: 0.5, work: 6, other: 0.5 })
  assert.ok(screen)
  assert.equal(screen.day, 9.5)
  assert.equal(screen.week, 66.5)
  assert.equal(screen.year, 9.5 * 365)
  const carbon = carbonEstimate(7, 20)
  assert.ok(carbon)
  assert.equal(carbon.streamYearG, 7 * 52 * 36)
  assert.equal(carbon.aiYearG, 20 * 365 * 0.03)
  assert.equal(carbonEstimate(-1, 0), null)
})

test("social battery copy follows rest counts", () => {
  assert.match(batteryRead(3).title, /downtime/)
  assert.match(batteryRead(1).title, /quieter/)
  assert.match(batteryRead(0).title, /charge/)
})

test("dice rolls stay on the face and format a total", () => {
  for (let i = 0; i < 80; i += 1) {
    const face = rollDie(20)
    assert.ok(face >= 1 && face <= 20)
  }
  assert.equal(formatRoll([5, 3], 6), "2d6: 5, 3 (total 8)")
  assert.equal(diceCountMax, 12)
})
