export const NOTE_MAX_LENGTH = 140
export const NOTE_FONT = '"Geist", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

let measureContext: CanvasRenderingContext2D | null | undefined

function measurer(fontSize: number): (text: string) => number {
  if (measureContext === undefined) {
    measureContext = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null
  }
  const ctx = measureContext
  if (ctx) {
    ctx.font = `400 ${fontSize}px ${NOTE_FONT}`
    return (text) => ctx.measureText(text).width
  }
  return (text) => text.length * fontSize * 0.56
}

/** Wrap a note to a pixel width. Never drops text: an over-long word is split across lines. */
export function wrapNote(note: string, maxWidth: number, fontSize: number): string[] {
  const measure = measurer(fontSize)
  const lines: string[] = []
  for (const paragraph of note.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) continue
    let line = ""
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (measure(candidate) <= maxWidth) {
        line = candidate
        continue
      }
      if (line) lines.push(line)
      line = ""
      let rest = word
      while (measure(rest) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1
        while (cut > 1 && measure(rest.slice(0, cut)) > maxWidth) cut--
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      line = rest
    }
    if (line) lines.push(line)
  }
  return lines
}
