import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { PageShell } from "@/components/site/PageShell"
import { toolViews } from "@/components/tools/views"
import { registry } from "@/lib/registry"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return Object.keys(toolViews).map((slug) => ({ slug }))
}

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tool = registry.find((item) => item.slug === slug)
  if (!tool) return {}
  return {
    title: `${tool.title} — Nice Build`,
    description: tool.description,
  }
}

export default async function SimpleToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = registry.find((item) => item.slug === slug)
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
      </PageShell>
    </>
  )
}
