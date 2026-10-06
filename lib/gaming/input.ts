export type PadSnapshot = {
  id: string
  index: number
  mapping: GamepadMappingType | string
  connected: boolean
  timestamp: number
  buttons: { pressed: boolean; value: number }[]
  axes: number[]
}

/** W3C standard gamepad mapping labels. Xbox first, PlayStation in the same slot. */
export const standardButtons = [
  "A / Cross",
  "B / Circle",
  "X / Square",
  "Y / Triangle",
  "LB / L1",
  "RB / R1",
  "LT / L2",
  "RT / R2",
  "Back / Share",
  "Start / Options",
  "L3",
  "R3",
  "D-pad up",
  "D-pad down",
  "D-pad left",
  "D-pad right",
  "Home / Guide",
] as const

export const standardAxes = ["Left X", "Left Y", "Right X", "Right Y"] as const

export const standardShortButtons = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "Back", "Start", "L3", "R3", "↑", "↓", "←", "→", "Home"] as const

export function buttonLabel(index: number, mapping: string) {
  if (mapping === "standard" && standardButtons[index]) return `${index} · ${standardButtons[index]}`
  return `Button ${index}`
}

export function buttonShortLabel(index: number, mapping: string) {
  if (mapping === "standard" && standardShortButtons[index]) return standardShortButtons[index]
  return String(index)
}

export function axisLabel(index: number, mapping: string) {
  if (mapping === "standard" && standardAxes[index]) return standardAxes[index]
  return `Axis ${index}`
}

export function snapshotPad(pad: Gamepad): PadSnapshot {
  return {
    id: pad.id,
    index: pad.index,
    mapping: pad.mapping,
    connected: pad.connected,
    timestamp: pad.timestamp,
    buttons: pad.buttons.map((button) => ({ pressed: button.pressed, value: roundAxis(button.value) })),
    axes: [...pad.axes].map(roundAxis),
  }
}

export function padsEqual(a: PadSnapshot | null, b: PadSnapshot | null) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.id !== b.id || a.index !== b.index || a.connected !== b.connected || a.mapping !== b.mapping) return false
  if (a.buttons.length !== b.buttons.length || a.axes.length !== b.axes.length) return false
  for (let i = 0; i < a.buttons.length; i += 1) {
    if (a.buttons[i].pressed !== b.buttons[i].pressed || a.buttons[i].value !== b.buttons[i].value) return false
  }
  for (let i = 0; i < a.axes.length; i += 1) {
    if (a.axes[i] !== b.axes[i]) return false
  }
  return true
}

export function roundAxis(value: number) {
  return Math.round(value * 1000) / 1000
}

export function applyAxialDeadzone(value: number, zone: number) {
  return Math.abs(value) < zone ? 0 : value
}

export function applyRadialDeadzone(x: number, y: number, zone: number, scaled = false) {
  const mag = Math.hypot(x, y)
  if (mag < zone || mag === 0) return { x: 0, y: 0, mag: 0 }
  if (!scaled) return { x, y, mag }
  const usable = 1 - zone
  if (usable <= 0) return { x: 0, y: 0, mag: 0 }
  const next = (mag - zone) / usable
  return { x: (x / mag) * next, y: (y / mag) * next, mag: next }
}

export function mouseButtonName(button: number) {
  return ["Left", "Middle", "Right", "Back", "Forward"][button] ?? `Button ${button}`
}
