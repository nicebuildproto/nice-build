"use client"

import { brand } from "@/lib/workstyle/brand"
import { buildExportModel, guideToText, profileToMarkdown } from "@/lib/workstyle/export/model"
import type { GuideStatement, Profile } from "@/lib/workstyle/profile"
import type { CardFormat } from "@/lib/workstyle/share"

// Browser-side delivery of the exports. The content comes from the shared export model, so what is
// downloaded is the same structured result the page shows.

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const today = () => new Date().toISOString().slice(0, 10)

export async function downloadGuidePdf(profile: Profile, guide: GuideStatement[]) {
  // Loaded on demand so the PDF library never weighs on the assessment or the first view of results.
  const { buildGuidePdf } = await import("@/lib/workstyle/export/pdf")
  const bytes = await buildGuidePdf(buildExportModel(profile, guide, { date: today() }))
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), `${brand.fileSlug}-how-to-work-with-me.pdf`)
}

export function downloadMarkdown(profile: Profile, guide: GuideStatement[]) {
  const text = profileToMarkdown(buildExportModel(profile, guide, { date: today() }))
  downloadBlob(new Blob([text], { type: "text/markdown;charset=utf-8" }), `${brand.fileSlug}-profile.md`)
}

export function guideText(profile: Profile, guide: GuideStatement[]): string {
  return guideToText(buildExportModel(profile, guide))
}

export async function fetchCard(path: string): Promise<Blob> {
  const response = await fetch(path)
  if (!response.ok) throw new Error("The card couldn’t be prepared.")
  return response.blob()
}

export async function downloadCard(path: string, format: CardFormat) {
  downloadBlob(await fetchCard(path), `${brand.fileSlug}-card-${format}.png`)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers and non-secure contexts: fall back to a temporary selection.
    try {
      const area = document.createElement("textarea")
      area.value = text
      area.setAttribute("readonly", "")
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      const done = document.execCommand("copy")
      area.remove()
      return done
    } catch {
      return false
    }
  }
}
