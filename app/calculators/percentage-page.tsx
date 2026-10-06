import { PercentageClusterView } from "@/components/calculators/PercentageClusterView"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { percentagePages } from "@/lib/calculators/content"
import { siteUrl, titleSuffix } from "@/lib/site"
import type { Metadata } from "next"

function pageMetadata(page: (typeof percentagePages)[keyof typeof percentagePages]): Metadata {
  const title = `${page.title}${titleSuffix}`
  const url = `${siteUrl}/calculators/${page.slug}`
  return {
    title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: page.description,
      url,
    },
  }
}

export function percentageMetadata(mode: keyof typeof percentagePages) {
  return pageMetadata(percentagePages[mode])
}

export function PercentageToolPage({ mode }: { mode: keyof typeof percentagePages }) {
  const page = percentagePages[mode]
  return (
    <>
      <SoftwareApplicationJsonLd name={page.title} description={page.description} path={`/calculators/${page.slug}`} />
      <PercentageClusterView page={page} />
    </>
  )
}
