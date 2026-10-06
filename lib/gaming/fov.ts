import { horizontalFromVertical, toDeg, toRad, verticalFromHorizontal } from "../tools/fov"

export function diagonalFov(horizontal: number, vertical: number) {
  return toDeg(2 * Math.atan(Math.hypot(Math.tan(toRad(horizontal) / 2), Math.tan(toRad(vertical) / 2))))
}

/** Source-style hor+ : a 4:3 horizontal FOV scaled to another aspect. */
export function horPlusFrom43(h43: number, aspect: number) {
  return horizontalFromVertical(verticalFromHorizontal(h43, 4 / 3), aspect)
}

export function fovTriple(input: number, mode: "horizontal" | "vertical", aspect: number) {
  const h = mode === "horizontal" ? input : horizontalFromVertical(input, aspect)
  const v = mode === "vertical" ? input : verticalFromHorizontal(input, aspect)
  return { h, v, d: diagonalFov(h, v) }
}

export { aspectPresets, fovFromScreen, fovPresets, horizontalFromVertical, verticalFromHorizontal } from "../tools/fov"
