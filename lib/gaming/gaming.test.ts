import assert from "node:assert/strict"
import test from "node:test"
import { advanceBracket, championOf, parseNames, seedBracket } from "./bracket.ts"
import { batteryRuntime, panelMetrics } from "./display.ts"
import { diagonalFov, fovTriple, horPlusFrom43 } from "./fov.ts"
import { applyAxialDeadzone, applyRadialDeadzone, padsEqual, snapshotPad } from "./input.ts"
import { lootOdds } from "./play.ts"
import { describeKey } from "./keyboard.ts"
import { average, cpsFromClicks } from "./timing.ts"
import { convertSensitivity, cmPer360, edpi } from "../tools/sensitivity.ts"

test("axial deadzone zeros drift and radial uses magnitude", () => {
  assert.equal(applyAxialDeadzone(0.08, 0.15), 0)
  assert.equal(applyAxialDeadzone(0.4, 0.15), 0.4)
  const inside = applyRadialDeadzone(0.08, 0.08, 0.15)
  assert.equal(inside.x, 0)
  assert.equal(inside.y, 0)
  const outside = applyRadialDeadzone(0.4, 0, 0.15)
  assert.equal(outside.x, 0.4)
  const scaled = applyRadialDeadzone(1, 0, 0.2, true)
  assert.ok(Math.abs(scaled.x - 1) < 1e-9)
  const half = applyRadialDeadzone(0.6, 0, 0.2, true)
  assert.ok(Math.abs(half.x - 0.5) < 1e-9)
})

test("pad snapshots compare without storing live Gamepad objects", () => {
  const a = snapshotPad({
    id: "pad",
    index: 0,
    mapping: "standard",
    connected: true,
    timestamp: 1,
    buttons: [{ pressed: true, value: 1, touched: true }] as GamepadButton[],
    axes: [0.1234, -0.5],
  } as Gamepad)
  const b = snapshotPad({
    id: "pad",
    index: 0,
    mapping: "standard",
    connected: true,
    timestamp: 2,
    buttons: [{ pressed: true, value: 1, touched: false }] as GamepadButton[],
    axes: [0.1234, -0.5],
  } as Gamepad)
  assert.equal(padsEqual(a, b), true)
  b.buttons[0].pressed = false
  assert.equal(padsEqual(a, b), false)
})

test("FOV triple and Source hor+ stay consistent", () => {
  const triple = fovTriple(103, "horizontal", 16 / 9)
  assert.ok(Math.abs(triple.h - 103) < 1e-9)
  assert.ok(Math.abs(triple.v - 70.53) < 0.05)
  assert.ok(triple.d > triple.h)
  const wide = horPlusFrom43(90, 16 / 9)
  assert.ok(Math.abs(wide - 106.26) < 0.05)
  const diag = diagonalFov(103, triple.v)
  assert.ok(Math.abs(diag - triple.d) < 1e-9)
})

test("eDPI conversion still uses documented yaw only", () => {
  assert.equal(edpi(800, 0.4), 320)
  const cm = cmPer360(800, 1.2, 0.022)
  assert.ok(Math.abs(cm - 43.295) < 0.01)
  const valorant = convertSensitivity(1.2, 0.022, 0.07)
  assert.ok(Math.abs(valorant - 0.377) < 0.01)
})

test("panel PPI and battery runtime", () => {
  const panel = panelMetrics(2560, 1440, 27)
  assert.ok(panel)
  assert.ok(Math.abs(panel.ppi - 108.8) < 0.1)
  const pack = batteryRuntime(3000, 250)
  assert.equal(pack?.hours, 12)
  assert.match(pack?.label ?? "", /12h/)
  assert.equal(batteryRuntime(3000, 0), null)
})

test("loot expected value and independent chance", () => {
  const result = lootOdds(
    [
      { name: "Common", rate: 80, value: 0.2 },
      { name: "Rare", rate: 18, value: 2 },
      { name: "Legendary", rate: 2, value: 40 },
    ],
    2,
    10,
    2,
  )
  assert.ok(Math.abs(result.ev - 1.32) < 0.001)
  assert.ok(Math.abs(result.versusCost + 0.68) < 0.001)
  assert.ok(Math.abs(result.chance - (1 - 0.98 ** 10)) < 1e-9)
  assert.equal(result.complete, true)
})

test("bracket byes and clicks", () => {
  const rounds = seedBracket(parseNames("North\nSouth\nEast"))
  assert.equal(rounds[0].length, 2)
  const advanced = advanceBracket(rounds, 0, 1, "East")
  const winner = championOf(advanceBracket(advanced, 1, 0, advanced[1][0].a === "North" ? "North" : "East"))
  assert.ok(winner === "North" || winner === "East")
})

test("CPS uses the real window length", () => {
  assert.equal(cpsFromClicks(30, 5000), 6)
  assert.equal(average([200, 300]), 250)
  assert.equal(average([]), null)
})

test("key readout uses physical code and character", () => {
  const info = describeKey({
    key: "a",
    code: "KeyA",
    location: 0,
    repeat: false,
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    metaKey: false,
  })
  assert.equal(info.code, "KeyA")
  assert.equal(info.key, "a")
  assert.deepEqual(info.mods, ["Ctrl"])
})
