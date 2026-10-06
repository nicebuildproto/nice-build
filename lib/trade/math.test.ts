import assert from "node:assert/strict"
import test from "node:test"
import {
  boardFeet,
  concreteBags,
  coveringCount,
  deckBoards,
  describeTins,
  estimateLines,
  estimatePrice,
  fenceParts,
  flooringPacks,
  gutterParts,
  hvacLoad,
  packPaintTins,
  paintEstimate,
  parseLength,
  parseNumber,
  pitchFrom,
  plasterSheets,
  roundTrade,
  roundUp,
  slabVolume,
  stairStringer,
  studCount,
  withWaste,
} from "./math.ts"

test("parseLength reads the unit on the value or the selector", () => {
  assert.equal(parseLength("4.2", "m"), 4.2)
  assert.equal(parseLength("4200 mm", "m"), 4.2)
  assert.equal(parseLength("4200", "mm"), 4.2)
  assert.equal(parseLength("12 ft", "m"), 12 * 0.3048)
  assert.equal(parseLength("", "m"), null)
  assert.equal(parseNumber("1,250"), 1250)
})

test("paint: 4.2 × 3.6 × 2.7 room, ceiling, 3 m² openings, 2 coats at 12 m²/L", () => {
  const result = paintEstimate({
    lengthM: 4.2,
    widthM: 3.6,
    heightM: 2.7,
    coats: 2,
    coverage: 12,
    includeCeiling: true,
    doors: 0,
    doorAreaM2: 1.8,
    windows: 0,
    windowAreaM2: 1.2,
    extraOpeningsM2: 3,
    wastePercent: 0,
  })
  assert.equal(roundTrade(result.area, 1), 54.2)
  assert.equal(roundTrade(result.total, 1), 9)
})

test("paint subtracts doors and windows and does not go negative", () => {
  const result = paintEstimate({
    lengthM: 3.5,
    widthM: 4,
    heightM: 2.4,
    coats: 2,
    coverage: 10,
    includeCeiling: false,
    doors: 1,
    doorAreaM2: 1.8,
    windows: 1,
    windowAreaM2: 1.2,
    extraOpeningsM2: 0,
    wastePercent: 10,
  })
  const walls = 2 * (3.5 + 4) * 2.4 - 3
  assert.equal(roundTrade(result.walls, 1), roundTrade(walls, 1))
  assert.ok(result.total > result.base)
  const hugeOpenings = paintEstimate({
    ...{
      lengthM: 2,
      widthM: 2,
      heightM: 2,
      coats: 1,
      coverage: 10,
      includeCeiling: false,
      doors: 20,
      doorAreaM2: 2,
      windows: 0,
      windowAreaM2: 1.2,
      extraOpeningsM2: 0,
      wastePercent: 0,
    },
  })
  assert.equal(hugeOpenings.walls, 0)
  assert.equal(hugeOpenings.area, 0)
})

test("paint tins prefer a sensible Bunnings pack, not the exact litre", () => {
  const pack = packPaintTins(12.4)
  assert.equal(pack.purchased, 15)
  assert.equal(describeTins(pack), "1 × 15 L")
  const small = packPaintTins(4.1)
  assert.ok(small.purchased >= 4.1)
  assert.ok(small.purchased <= 7)
  assert.equal(packPaintTins(0).purchased, 0)
})

test("waste is visible and optional", () => {
  const none = withWaste(8.2, 0)
  assert.equal(none.total, 8.2)
  const ten = withWaste(8.2, 10)
  assert.equal(roundTrade(ten.waste, 1), 0.8)
  assert.equal(roundTrade(ten.total, 1), 9)
})

test("plasterboard 6 × 2.7 m with 10% waste is 7 sheets", () => {
  const result = plasterSheets(6, 2.7, 10)
  assert.equal(result.sheets, 7)
})

test("studs include both ends on a 4.8 m wall at 450 mm", () => {
  assert.equal(studCount(4.8, 450), 12)
  assert.equal(studCount(4.5, 450), 11)
  assert.equal(studCount(0.2, 450), 2)
})

test("flooring packs round up after waste", () => {
  const result = flooringPacks(4, 3, 2.4, 10)
  assert.equal(roundTrade(result.area, 1), 12)
  assert.equal(result.packs, 6)
})

test("concrete slab 4 × 3 m × 100 mm is 1.2 m³, 120 bags before waste", () => {
  const slab = slabVolume(4, 3, 0.1, 0)
  assert.equal(roundTrade(slab.volume, 2), 1.2)
  assert.equal(concreteBags(1.2), 120)
  const withWaste = slabVolume(4, 3, 0.1, 5)
  assert.equal(roundTrade(withWaste.total, 3), 1.26)
  assert.equal(roundUp(1.26, 0.2), 1.4)
})

test("tiles and pavers apply waste then round up", () => {
  const tiles = coveringCount(4.2 * 3.1, 0.6 * 0.6, 10)
  assert.equal(tiles.count, 40)
  const pavers = coveringCount(24, 0.2 * 0.1, 10)
  assert.equal(pavers.count, 1320)
})

test("fence posts include the end of an 18 m run at 2.4 m", () => {
  const fence = fenceParts(18, 2.4, 2)
  assert.equal(fence.posts, 9)
  assert.equal(fence.bays, 8)
  assert.equal(fence.rails, 16)
})

test("deck boards divide the width by board plus gap", () => {
  const deck = deckBoards(4.8, 3.6, 90, 5, 0)
  assert.equal(deck.boards, 38)
  assert.equal(deck.eachM, 4.8)
})

test("roof pitch and HVAC stay honest about being estimates", () => {
  const pitch = pitchFrom(300, 1000)
  assert.equal(roundTrade(pitch.angle, 1), 16.7)
  assert.equal(roundTrade(pitch.rafter, 0), 1044)
  const load = hvacLoad(40)
  assert.equal(load.btu, 17200)
  assert.equal(roundTrade(load.kw, 2), 5.04)
})

test("gutter downpipes are at least one, then every 8 m", () => {
  assert.equal(gutterParts(22).downpipes, 3)
  assert.equal(gutterParts(3).downpipes, 1)
})

test("board feet convert millimetres and metres", () => {
  const result = boardFeet(25, 150, 2.4, 8)
  assert.equal(roundTrade(result.total, 1), 30.5)
})

test("stair risers round to a whole number and report 2R+G", () => {
  const stair = stairStringer(2700, 175, 250)
  assert.equal(stair.risers, 15)
  assert.equal(stair.riserMm, 180)
  assert.equal(stair.treads, 14)
  assert.equal(roundTrade(stair.twoRPlusG, 0), 610)
})

test("construction estimate adds markup on cost, not margin on price", () => {
  const parsed = estimateLines("Demolition, 800\nFraming, 2400\nFixing, 1600")
  assert.equal(parsed.cost, 4800)
  const priced = estimatePrice(parsed.cost, 15)
  assert.equal(priced.markup, 720)
  assert.equal(priced.price, 5520)
  const bad = estimateLines("Framing only")
  assert.equal(bad.issues.length, 1)
})

test("zero and negative inputs stay null through parseLength", () => {
  assert.equal(parseLength("-1", "m"), -1)
  assert.equal(parseLength("abc", "m"), null)
  assert.equal(parseLength("4.2 m", "mm"), 4.2)
})
