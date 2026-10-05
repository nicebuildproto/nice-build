export const fovPresets = [
  { id: "cs2", label: "CS2 (90° 4:3)", horizontal: 90, aspect: 4 / 3 },
  { id: "valorant", label: "Valorant (103°)", horizontal: 103, aspect: 16 / 9 },
  { id: "overwatch", label: "Overwatch 2 (103°)", horizontal: 103, aspect: 16 / 9 },
  { id: "apex", label: "Apex Legends (110°)", horizontal: 110, aspect: 16 / 9 },
  { id: "minecraft", label: "Minecraft (70° vertical)", vertical: 70, aspect: 16 / 9 },
  { id: "source", label: "Source default (90° 4:3)", horizontal: 90, aspect: 4 / 3 },
] as const

export const aspectPresets = [
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "16:10", label: "16:10", value: 16 / 10 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "21:9", label: "21:9", value: 21 / 9 },
  { id: "32:9", label: "32:9", value: 32 / 9 },
] as const

export function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function toDeg(rad: number) {
  return (rad * 180) / Math.PI
}

export function verticalFromHorizontal(hDeg: number, aspect: number) {
  return toDeg(2 * Math.atan(Math.tan(toRad(hDeg) / 2) / aspect))
}

export function horizontalFromVertical(vDeg: number, aspect: number) {
  return toDeg(2 * Math.atan(Math.tan(toRad(vDeg) / 2) * aspect))
}

export function fovFromScreen(distance: number, width: number) {
  if (!(distance > 0) || !(width > 0)) return null
  return toDeg(2 * Math.atan(width / 2 / distance))
}
