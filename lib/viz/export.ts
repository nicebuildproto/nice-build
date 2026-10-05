export {
  downloadBlob,
  downloadText,
  serializeSvg,
  svgToPngBlob,
} from "@/lib/sankey/export"

export async function copyPng(svg: SVGSVGElement, scale = 2): Promise<boolean> {
  const { svgToPngBlob, downloadBlob } = await import("@/lib/sankey/export")
  const blob = await svgToPngBlob(svg, scale)
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    downloadBlob("chart.png", blob)
    return false
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
  return true
}
