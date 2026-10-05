import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { PageShell } from "@/components/site/PageShell"
import { ToolGuide } from "@/components/tools/ToolGuide"
import { toolViews } from "@/components/tools/views"
import { registry } from "@/lib/registry"
import { siteUrl, titleSuffix } from "@/lib/site"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return Object.keys(toolViews).flatMap((slug) => {
    const tool = registry.find((item) => item.slug === slug)
    if (!tool) return []
    return [{ category: tool.category, slug }]
  })
}

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category, slug } = await params
  const tool = registry.find((item) => item.slug === slug && item.category === category)
  if (!tool) return {}
  return {
    title: `${tool.title}${titleSuffix}`,
    description: tool.description,
    alternates: { canonical: `${siteUrl}${tool.route}` },
  }
}

export default async function SimpleToolPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const tool = registry.find((item) => item.slug === slug && item.category === category)
  const view = toolViews[slug]
  if (!tool || !view) notFound()

  const View = view.View

  return (
    <>
      <SoftwareApplicationJsonLd name={tool.title} description={tool.description} path={tool.route} />
      <PageShell backHref={`/category/${tool.category}`} width={view.width ?? "narrow"}>
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-[var(--nb-primary)] sm:text-4xl">
            {tool.title}
          </h1>
          <p className="max-w-xl text-sm text-[var(--nb-secondary)]">{tool.description}</p>
        </header>
        <View />
        <ToolGuide slug={tool.slug} />
      </PageShell>
    </>
  )
}
