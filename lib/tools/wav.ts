export function encodeWav(buffer: AudioBuffer, start: number, end: number) {
  const sampleRate = buffer.sampleRate
  const from = Math.max(0, Math.floor(start * sampleRate))
  const to = Math.min(buffer.length, Math.ceil(end * sampleRate))
  const frames = Math.max(0, to - from)
  const channels = buffer.numberOfChannels
  const bytesPerSample = 2
  const blockAlign = channels * bytesPerSample
  const dataSize = frames * blockAlign
  const header = 44
  const bytes = new ArrayBuffer(header + dataSize)
  const view = new DataView(bytes)
  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, "data")
  view.setUint32(40, dataSize, true)

  const channelData = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index))
  let offset = header
  for (let i = 0; i < frames; i++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][from + i] ?? 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([bytes], { type: "audio/wav" })
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
}

export function clampRange(start: number, end: number, duration: number) {
  const a = Math.max(0, Math.min(duration, start))
  const b = Math.max(0, Math.min(duration, end))
  return a <= b ? { start: a, end: b } : { start: b, end: a }
}
