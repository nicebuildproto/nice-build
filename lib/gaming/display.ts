import { formatDuration, ppi } from "../tools/pure"

export function panelMetrics(width: number, height: number, diagonal: number) {
  if (!(width > 0) || !(height > 0) || !(diagonal > 0)) return null
  const value = ppi(width, height, diagonal)
  return {
    ppi: value,
    pitchMm: 25.4 / value,
    megapixels: (width * height) / 1_000_000,
  }
}

export function devicePixels(cssWidth: number, cssHeight: number, ratio: number) {
  return { width: cssWidth * ratio, height: cssHeight * ratio }
}

export const monitorPresets = [
  { label: "1080p 24\"", width: 1920, height: 1080, diagonal: 24 },
  { label: "1440p 27\"", width: 2560, height: 1440, diagonal: 27 },
  { label: "UW 34\"", width: 3440, height: 1440, diagonal: 34 },
  { label: "4K 27\"", width: 3840, height: 2160, diagonal: 27 },
  { label: "4K 32\"", width: 3840, height: 2160, diagonal: 32 },
] as const

export function batteryRuntime(capacityMah: number, loadMa: number) {
  if (!(capacityMah > 0) || !(loadMa > 0)) return null
  const hours = capacityMah / loadMa
  return {
    hours,
    label: formatDuration(hours * 3600),
  }
}
