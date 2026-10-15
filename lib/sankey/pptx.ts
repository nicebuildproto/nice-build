import { svgToPng } from "@/lib/sankey/export"
import type { ValidFlow } from "@/lib/sankey/types"

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sankey-diagram"
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(",") + 1))
    }
    reader.onerror = () => reject(new Error("Could not read the image."))
    reader.readAsDataURL(blob)
  })
}

/** Speaker notes: one line per flow, then any node notes. Enough to rebuild the diagram. */
export function buildSpeakerNotes(flows: ValidFlow[], nodeNotes: { name: string; note: string }[]): string {
  const lines = flows.map((flow) => `${flow.source} > ${flow.target}: ${flow.value}`)
  const notes = nodeNotes.filter((item) => item.note)
  if (notes.length > 0) {
    lines.push("", "Notes:")
    for (const item of notes) lines.push(`${item.name}: ${item.note.replace(/\s*\n\s*/g, " ")}`)
  }
  return lines.join("\n")
}

/** One 16:9 slide: title, the diagram as a crisp 3x picture, and the data in the speaker notes. */
export async function exportSankeyPptx(
  svg: SVGSVGElement,
  options: { title?: string; flows: ValidFlow[]; nodeNotes: { name: string; note: string }[] }
): Promise<void> {
  // Loaded only now, so the page stays light for people who never export to PowerPoint.
  const { default: PptxGenJS } = await import("pptxgenjs")

  const title = options.title?.trim() || "Sankey diagram"
  const { blob, width, height } = await svgToPng(svg, 3, { tight: true })
  const data = await blobToBase64(blob)

  const pptx = new PptxGenJS()
  pptx.layout = "LAYOUT_WIDE" // 13.33in x 7.5in
  pptx.title = title

  const slide = pptx.addSlide()
  slide.background = { color: "FFFFFF" }
  slide.addText(title, {
    x: 0.5,
    y: 0.5,
    w: 12.33,
    h: 0.6,
    fontFace: "Arial",
    fontSize: 28,
    bold: true,
    color: "18181B",
    align: "left",
    valign: "top",
    margin: 0,
  })

  // Fit the picture into the space under the title, keeping its proportions.
  const box = { x: 0.5, y: 1.3, w: 12.3, h: 6.0 }
  const ratio = width / height
  let w = box.w
  let h = w / ratio
  if (h > box.h) {
    h = box.h
    w = h * ratio
  }
  slide.addImage({
    data: `image/png;base64,${data}`,
    x: box.x + (box.w - w) / 2,
    y: box.y + (box.h - h) / 2,
    w,
    h,
    altText: `Sankey diagram with ${options.flows.length} flows. The flows are listed in the speaker notes.`,
  })

  slide.addNotes(buildSpeakerNotes(options.flows, options.nodeNotes))

  await pptx.writeFile({ fileName: `${slugify(title)}.pptx` })
}
