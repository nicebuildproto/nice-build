// Central brand configuration. Everything brand-specific lives here so a final name can be
// swapped in one place. "Workshape" is a PROVISIONAL name — see docs/workstyle/brand-and-naming.md.

export const brand = {
  name: "Workshape",
  // Wordmark is rendered as two weights of the same word: [heavy part][light italic part].
  wordmark: { lead: "work", tail: "shape" },
  tagline: "Understand how you work. Help others work with you.",
  promise: "Understand how you work. Help others work with you.",
  shortDescription:
    "A work-style guide built from about 28 short questions. You get a visual signature, a guide you can edit and share, and no account to create.",
  // Public path of the product inside this app. If the product moves to its own domain,
  // change this and add a host rewrite in proxy.ts (see docs/workstyle/architecture.md).
  basePath: "/how-i-work",
  estimatedMinutes: "7–10",
  estimatedMinutesLabel: "about 8 minutes",
  // Name used in file names and share text.
  fileSlug: "workshape",
  metaTitle: "Workshape — understand how you work",
  metaDescription:
    "A short, honest work-style guide. Answer about 28 questions, get a visual signature and a ‘how to work with me’ page you can edit and share. No account.",
  cardInvite: "Find yours at",
  // Shown wherever the product speaks about itself, so nobody mistakes it for a validated test.
  disclaimer:
    "Self-reported preferences, interpreted by fixed rules. Not a clinical, hiring or ability test, and not a validated psychometric instrument.",
} as const

export function productPath(path = ""): string {
  return `${brand.basePath}${path}`
}
