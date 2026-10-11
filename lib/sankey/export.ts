export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const background = svg.dataset.exportBackground
  if (background) {
    const box = svg.viewBox.baseVal
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    rect.setAttribute("x", String(box.x || 0))
    rect.setAttribute("y", String(box.y || 0))
    rect.setAttribute("width", String(box.width || svg.clientWidth || 1200))
    rect.setAttribute("height", String(box.height || svg.clientHeight || 720))
    rect.setAttribute("fill", background)
    clone.insertBefore(rect, clone.firstChild)
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  if (!clone.getAttribute("width")) clone.setAttribute("width", String(svg.clientWidth || 1200))
  if (!clone.getAttribute("height")) clone.setAttribute("height", String(svg.clientHeight || 720))
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`
}

export function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const xml = serializeSvg(svg)
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  const width = svg.clientWidth || Number(svg.getAttribute("width")) || 1200
  const height = svg.clientHeight || Number(svg.getAttribute("height")) || 720

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("Could not render the diagram."))
    img.src = url
  })

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is unavailable.")
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, width, height)
  URL.revokeObjectURL(url)

  return await new Promise((resolve, reject) => {
    canvas.toBlob((next) => {
      if (next) resolve(next)
      else reject(new Error("Could not create a PNG."))
    }, "image/png")
  })
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
