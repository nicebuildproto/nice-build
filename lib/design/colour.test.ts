import assert from "node:assert/strict"
import test from "node:test"
import { contrastGrades, contrastRatio, formatHsl, formatRgb, parseHex, suggestForeground } from "./colour.ts"
import {
  gradientCss,
  gradientDeclaration,
  reverseStops,
  type GradientStop,
} from "./gradient.ts"
import {
  borderRadiusCss,
  boxShadowCss,
  gcd,
  pxToRem,
  solveAspect,
} from "./layout.ts"
import { buildPalette, mergeLockedPalette, paletteCssVars, paletteHexList } from "./palette.ts"

test("parseHex expands shorthand and rejects junk", () => {
  assert.equal(parseHex("#ABC"), "#aabbcc")
  assert.equal(parseHex("ff0101"), "#ff0101")
  assert.equal(parseHex("#fffdf8"), "#fffdf8")
  assert.equal(parseHex("#ff01018"), null)
  assert.equal(parseHex(""), null)
})

test("rgb and hsl formatting", () => {
  assert.equal(formatRgb("#ff0101"), "rgb(255, 1, 1)")
  assert.equal(formatHsl("#ff0101"), "hsl(0, 100%, 50%)")
})

test("contrast ratio matches WCAG pairs", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21)
  const grey = contrastGrades("#ffffff", "#767676")
  assert.ok(grey)
  assert.ok(grey.ratio >= 4.5)
  assert.equal(grey.aaNormal, true)
  assert.equal(grey.aaaNormal, false)
  assert.equal(grey.ui, true)
  const fail = contrastGrades("#888888", "#ffffff")
  assert.ok(fail)
  assert.equal(fail.aaNormal, false)
})

test("suggest foreground only moves lightness enough to pass AA", () => {
  const next = suggestForeground("#888888", "#ffffff", 4.5)
  assert.ok(next)
  const grades = contrastGrades(next!, "#ffffff")
  assert.ok(grades)
  assert.equal(grades.aaNormal, true)
  assert.equal(suggestForeground("#111111", "#ffffff"), "#111111")
})

test("palette modes stay deterministic and five swatches", () => {
  const tints = buildPalette("#1f6f5b", "tints")
  assert.equal(tints.length, 5)
  assert.equal(tints[2]?.hex, "#1f6f5b")
  assert.deepEqual(buildPalette("#1f6f5b", "tints"), tints)
  const locked = mergeLockedPalette(buildPalette("#c45c26", "tints"), tints, new Set(["base"]))
  assert.equal(locked.find((swatch) => swatch.id === "base")?.hex, "#1f6f5b")
  assert.match(paletteCssVars(tints), /--base: #1f6f5b;/)
  assert.equal(paletteHexList(tints).split("\n").length, 5)
})

test("gradient CSS is clean for linear and radial", () => {
  const stops: GradientStop[] = [
    { id: "a", colour: "#111111", position: 0 },
    { id: "b", colour: "#ff0101", position: 100 },
  ]
  assert.equal(gradientCss("linear", 120, stops), "linear-gradient(120deg, #111111 0%, #ff0101 100%)")
  assert.equal(gradientDeclaration(gradientCss("linear", 90, stops)), "background: linear-gradient(90deg, #111111 0%, #ff0101 100%);")
  assert.equal(
    gradientCss("radial", 0, stops),
    "radial-gradient(circle at center, #111111 0%, #ff0101 100%)",
  )
  const reversed = reverseStops(stops)
  assert.equal(reversed[0]?.colour, "#ff0101")
  assert.equal(reversed[0]?.position, 0)
})

test("aspect ratio solve and simplify", () => {
  const both = solveAspect({ width: "1920", height: "1080", ratioW: "16", ratioH: "9" })
  assert.equal(both?.label, "16:9")
  const height = solveAspect({ width: "1920", height: "", ratioW: "16", ratioH: "9" })
  assert.equal(height?.height, 1080)
  const width = solveAspect({ width: "", height: "1080", ratioW: "16", ratioH: "9" })
  assert.equal(width?.width, 1920)
  assert.equal(gcd(1920, 1080), 120)
})

test("px to rem, shadow, and radius CSS", () => {
  assert.equal(pxToRem(24, 16), 1.5)
  assert.equal(pxToRem(16, 0), null)
  assert.equal(
    boxShadowCss(0, 8, 24, 0, "#111111", 12),
    "0px 8px 24px 0px rgba(17, 17, 17, 0.12)",
  )
  assert.equal(boxShadowCss(0, 2, 8, 0, "#111111", 16, true).startsWith("inset "), true)
  assert.equal(borderRadiusCss(16, 16, 16, 16), "16px")
  assert.equal(borderRadiusCss(8, 16, 24, 4), "8px 16px 24px 4px")
})
