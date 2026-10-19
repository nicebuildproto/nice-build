import { brand } from "../brand.ts"
import { dimensionIds, dimensions } from "../dimensions.ts"
import type { GuideStatement, Profile } from "../profile.ts"
import { buildSignature, type Signature } from "../signature.ts"
import type { DimensionId } from "../types.ts"

// One structured model feeds the text, Markdown and PDF exports — and is built from the same Profile
// the website renders — so none of them can drift from what the person sees on screen.

export type ExportModel = {
  brandName: string
  name?: string
  title: string
  statement: string
  lead: string
  dimensions: {
    id: DimensionId
    title: string
    label: string
    summary: string
    poleA: string
    poleB: string
    position: number
    range: [number, number]
    evidence: string
    note: string | null
  }[]
  patterns: { title: string; text: string }[]
  best: string[]
  friction: string[]
  guide: { id: string; label: string; text: string }[]
  experiments: string[]
  notice: { text: string; support: "supported" | "tentative" }[]
  closing: string
  caveats: string[]
  disclaimer: string
  signature: Signature
  date?: string
}

const evidenceWords = { good: "Good evidence", some: "Some evidence", thin: "Thin evidence" } as const

export function patternLinks(profile: Profile): [DimensionId, DimensionId][] {
  const links: [DimensionId, DimensionId][] = []
  for (const pattern of profile.patterns) {
    const ids = pattern.sources.map((source) => source.dimension)
    for (let i = 0; i < ids.length; i += 1) for (let j = i + 1; j < ids.length; j += 1) links.push([ids[i], ids[j]])
  }
  return links
}

export function signatureFor(profile: Profile): Signature {
  return buildSignature(profile.summary.dimensions, patternLinks(profile))
}

export function buildExportModel(profile: Profile, guide: GuideStatement[], options: { date?: string } = {}): ExportModel {
  return {
    brandName: brand.name,
    name: profile.summary.name,
    title: profile.headline.title,
    statement: profile.headline.statement,
    lead: profile.headline.lead,
    dimensions: dimensionIds.flatMap((id) => {
      const view = profile.dimensions[id]
      if (!view) return []
      const spec = dimensions[id]
      return [
        {
          id,
          title: spec.title,
          label: view.label,
          summary: view.summary,
          poleA: spec.a.label,
          poleB: spec.b.label,
          position: view.position,
          range: view.range,
          evidence: evidenceWords[view.evidence],
          note: view.rangeNote,
        },
      ]
    }),
    patterns: profile.patterns.map((pattern) => ({ title: pattern.title, text: pattern.text })),
    best: profile.best.map((item) => item.text),
    friction: profile.friction.map((item) => item.text),
    guide: guide.map(({ id, label, text }) => ({ id, label, text })),
    experiments: profile.experiments.map((item) => item.text),
    notice: profile.notice.map(({ text, support }) => ({ text, support })),
    closing: profile.closing,
    caveats: profile.caveats,
    disclaimer: brand.disclaimer,
    signature: signatureFor(profile),
    date: options.date,
  }
}

// ───────────────────────── Text and Markdown ─────────────────────────

export function guideToText(model: ExportModel): string {
  const owner = model.name ? `${model.name}: how to work with me` : "How to work with me"
  const lines = [owner, ""]
  for (const item of model.guide) lines.push(item.label.toUpperCase(), item.text, "")
  lines.push(`—`, `Made with ${model.brandName}. ${model.disclaimer}`)
  return lines.join("\n").trim()
}

export function profileToMarkdown(model: ExportModel): string {
  const lines: string[] = []
  lines.push(`# ${model.name ? `${model.name} — ` : ""}${model.title}`, "", `*${model.statement}*`, "", model.lead, "")
  if (model.patterns.length) {
    lines.push("## Patterns worth noticing", "")
    for (const pattern of model.patterns) lines.push(`**${pattern.title}.** ${pattern.text}`, "")
  }
  lines.push("## The eight dimensions", "")
  for (const dimension of model.dimensions) {
    lines.push(`### ${dimension.title}: ${dimension.label}`, dimension.summary, `_${dimension.evidence}._${dimension.note ? ` ${dimension.note}` : ""}`, "")
  }
  lines.push("## What brings out your best", "", ...model.best.map((text) => `- ${text}`), "")
  lines.push("## Where friction may show up", "", ...model.friction.map((text) => `- ${text}`), "")
  lines.push("## How to work with me", "")
  for (const item of model.guide) lines.push(`**${item.label}.** ${item.text}`, "")
  lines.push("## Experiments to try", "", ...model.experiments.map((text, index) => `${index + 1}. ${text}`), "")
  lines.push("## What colleagues may notice", "", ...model.notice.map((item) => `- ${item.text} _(${item.support === "supported" ? "well supported by your answers" : "a tentative guess"})_`), "")
  lines.push("## One last thing", "", model.closing, "")
  lines.push("---", "", `Made with ${model.brandName}. ${model.disclaimer}`)
  return lines.join("\n")
}
