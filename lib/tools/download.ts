export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function downloadText(text: string, filename: string, type = "text/plain;charset=utf-8") {
  downloadBlob(new Blob([text], { type }), filename)
}

export function downloadBytes(bytes: Uint8Array, filename: string, type: string) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  downloadBlob(new Blob([copy], { type }), filename)
}
