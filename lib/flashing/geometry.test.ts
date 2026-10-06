import assert from "node:assert/strict"
import test from "node:test"
import { directionStrokes, LENGTH_DIRECTION, type Point } from "./geometry.ts"

function unit(stroke: { a: Point; b: Point }) {
  const dx = stroke.b.x - stroke.a.x
  const dy = stroke.b.y - stroke.a.y
  const mag = Math.hypot(dx, dy)
  return { x: dx / mag, y: dy / mag }
}

test("facing marks on an L profile are parallel along the length direction", () => {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 0, y: 100 },
    { x: 100, y: 100 },
  ]
  const strokes = directionStrokes(points, 24, 8)
  assert.equal(strokes.length, 3)
  for (const stroke of strokes) {
    const dir = unit(stroke)
    assert.ok(Math.abs(dir.x - LENGTH_DIRECTION.x) < 1e-9)
    assert.ok(Math.abs(dir.y - LENGTH_DIRECTION.y) < 1e-9)
    assert.ok(Math.abs(Math.hypot(stroke.b.x - stroke.a.x, stroke.b.y - stroke.a.y) - 24) < 1e-6)
  }
})

test("a nearly straight vertex does not get a facing mark", () => {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 50, y: 1 },
    { x: 100, y: 0 },
  ]
  const strokes = directionStrokes(points, 20)
  assert.equal(strokes.length, 2)
})
