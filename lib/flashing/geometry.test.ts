import assert from "node:assert/strict"
import test from "node:test"
import { directionStrokes, LENGTH_DIRECTION, liveExtendAngle, rotatePoints, type Point } from "./geometry.ts"

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

test("rotate 90 degrees clockwise keeps segment lengths", () => {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 0, y: 80 },
    { x: 180, y: 80 },
  ]
  const rotated = rotatePoints(points, 90)
  assert.equal(rotated.length, 3)
  const before = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
  const after = Math.hypot(rotated[1].x - rotated[0].x, rotated[1].y - rotated[0].y)
  assert.ok(Math.abs(before - after) < 1e-6)
  const dx = rotated[1].x - rotated[0].x
  const dy = rotated[1].y - rotated[0].y
  assert.ok(Math.abs(Math.abs(dx) - 80) < 1e-6)
  assert.ok(Math.abs(dy) < 1e-6)
})

test("live extend angle shows the fold while placing the next segment", () => {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]
  const rightAngle = liveExtendAngle(points, 1, { x: 100, y: 100 })
  assert.ok(rightAngle !== null)
  assert.ok(Math.abs(rightAngle - 90) < 1e-6)
  const first = liveExtendAngle([{ x: 0, y: 0 }], 0, { x: 100, y: 0 })
  assert.ok(first !== null)
  assert.ok(Math.abs(first) < 1e-6)
})
