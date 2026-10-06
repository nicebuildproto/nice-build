export type KeyCap = { code: string; label: string; wide?: "sm" | "md" | "lg" }

export const keyboardRows: KeyCap[][] = [
  [
    { code: "Escape", label: "Esc" },
    { code: "F1", label: "F1" },
    { code: "F2", label: "F2" },
    { code: "F3", label: "F3" },
    { code: "F4", label: "F4" },
    { code: "F5", label: "F5" },
    { code: "F6", label: "F6" },
    { code: "F7", label: "F7" },
    { code: "F8", label: "F8" },
    { code: "F9", label: "F9" },
    { code: "F10", label: "F10" },
    { code: "F11", label: "F11" },
    { code: "F12", label: "F12" },
  ],
  [
    { code: "Backquote", label: "`" },
    { code: "Digit1", label: "1" },
    { code: "Digit2", label: "2" },
    { code: "Digit3", label: "3" },
    { code: "Digit4", label: "4" },
    { code: "Digit5", label: "5" },
    { code: "Digit6", label: "6" },
    { code: "Digit7", label: "7" },
    { code: "Digit8", label: "8" },
    { code: "Digit9", label: "9" },
    { code: "Digit0", label: "0" },
    { code: "Minus", label: "-" },
    { code: "Equal", label: "=" },
    { code: "Backspace", label: "Bksp", wide: "md" },
  ],
  [
    { code: "Tab", label: "Tab", wide: "sm" },
    { code: "KeyQ", label: "Q" },
    { code: "KeyW", label: "W" },
    { code: "KeyE", label: "E" },
    { code: "KeyR", label: "R" },
    { code: "KeyT", label: "T" },
    { code: "KeyY", label: "Y" },
    { code: "KeyU", label: "U" },
    { code: "KeyI", label: "I" },
    { code: "KeyO", label: "O" },
    { code: "KeyP", label: "P" },
    { code: "BracketLeft", label: "[" },
    { code: "BracketRight", label: "]" },
    { code: "Backslash", label: "\\", wide: "sm" },
  ],
  [
    { code: "CapsLock", label: "Caps", wide: "md" },
    { code: "KeyA", label: "A" },
    { code: "KeyS", label: "S" },
    { code: "KeyD", label: "D" },
    { code: "KeyF", label: "F" },
    { code: "KeyG", label: "G" },
    { code: "KeyH", label: "H" },
    { code: "KeyJ", label: "J" },
    { code: "KeyK", label: "K" },
    { code: "KeyL", label: "L" },
    { code: "Semicolon", label: ";" },
    { code: "Quote", label: "'" },
    { code: "Enter", label: "Enter", wide: "md" },
  ],
  [
    { code: "ShiftLeft", label: "Shift", wide: "lg" },
    { code: "KeyZ", label: "Z" },
    { code: "KeyX", label: "X" },
    { code: "KeyC", label: "C" },
    { code: "KeyV", label: "V" },
    { code: "KeyB", label: "B" },
    { code: "KeyN", label: "N" },
    { code: "KeyM", label: "M" },
    { code: "Comma", label: "," },
    { code: "Period", label: "." },
    { code: "Slash", label: "/" },
    { code: "ShiftRight", label: "Shift", wide: "lg" },
  ],
  [
    { code: "ControlLeft", label: "Ctrl", wide: "sm" },
    { code: "MetaLeft", label: "Meta", wide: "sm" },
    { code: "AltLeft", label: "Alt", wide: "sm" },
    { code: "Space", label: "Space", wide: "lg" },
    { code: "AltRight", label: "Alt", wide: "sm" },
    { code: "ControlRight", label: "Ctrl", wide: "sm" },
    { code: "ArrowLeft", label: "←" },
    { code: "ArrowUp", label: "↑" },
    { code: "ArrowDown", label: "↓" },
    { code: "ArrowRight", label: "→" },
  ],
]

export type KeyEventInfo = {
  key: string
  code: string
  location: string
  repeat: boolean
  mods: string[]
}

const locations = ["standard", "left", "right", "numpad"]

export function describeKey(event: Pick<KeyboardEvent, "key" | "code" | "location" | "repeat" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey">): KeyEventInfo {
  const mods = [
    event.ctrlKey ? "Ctrl" : null,
    event.shiftKey ? "Shift" : null,
    event.altKey ? "Alt" : null,
    event.metaKey ? "Meta" : null,
  ].filter((item): item is string => Boolean(item))
  return {
    key: event.key,
    code: event.code,
    location: locations[event.location] ?? String(event.location),
    repeat: event.repeat,
    mods,
  }
}
