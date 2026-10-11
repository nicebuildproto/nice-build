import assert from "node:assert/strict"
import test from "node:test"
import { badNumber } from "../../components/viz/data-entry.tsx"
import { resolveTheme } from "./style.ts"
import { stageSurfaces, themeById, vizThemes } from "./themes.ts"

test("stage surfaces are only white and dusk", () => {
  assert.deepEqual(Object.keys(stageSurfaces).sort(), ["dusk", "white"])
  assert.equal(stageSurfaces.white.background, "#FFFFFF")
  assert.notEqual(stageSurfaces.dusk.background, stageSurfaces.white.background)
})

test("chart themes keep their series when the stage changes", () => {
  const white = resolveTheme({ ...base(), stage: "white", theme: "signal" })
  const dusk = resolveTheme({ ...base(), stage: "dusk", theme: "signal" })
  assert.deepEqual(white.series, vizThemes.signal.series)
  assert.deepEqual(dusk.series, vizThemes.signal.series)
  assert.equal(white.background, stageSurfaces.white.background)
  assert.equal(dusk.background, stageSurfaces.dusk.background)
  assert.equal(dusk.ink, stageSurfaces.dusk.ink)
})

test("legacy dusk theme id does not paint a third stage", () => {
  assert.equal(themeById("dusk").id, "ink")
  const resolved = resolveTheme({ ...base(), theme: "dusk" as "ink", stage: "white" })
  assert.equal(resolved.background, "#FFFFFF")
})

test("badNumber accepts blanks and rejects words", () => {
  assert.equal(badNumber(""), false)
  assert.equal(badNumber("1,200"), false)
  assert.equal(badNumber("visits"), true)
})

function base() {
  return {
    theme: "ink" as const,
    stage: "white" as const,
    showValues: true,
    showLabels: true,
    showPercent: true,
    showGrid: true,
    showLegend: true,
    legend: "bottom" as const,
    labelSize: 12,
    valueSize: 11,
    labelWeight: 500 as const,
    padding: 24,
  }
}
