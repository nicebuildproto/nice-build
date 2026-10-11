import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { StageBackProvider } from "@/components/stage/chrome"
import { siteContainer } from "@/components/site/frame"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { ToolGuide } from "@/components/tools/ToolGuide"
import { toolViews } from "@/components/tools/views"
import { registry } from "@/lib/registry"
import { siteUrl, titleSuffix } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ComponentType } from "react"

export function generateStaticParams() {
  return Object.keys(toolViews).flatMap((slug) => {
    const tool = registry.find((item) => item.slug === slug)
    if (!tool || tool.route !== `/${tool.category}/${tool.slug}`) return []
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
  const title = `${tool.seoTitle ?? tool.title}${titleSuffix}`
  return {
    title,
    description: tool.description,
    keywords: tool.tags,
    alternates: { canonical: `${siteUrl}${tool.route}` },
    openGraph: {
      title,
      description: tool.description,
      url: `${siteUrl}${tool.route}`,
    },
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

  if (view.stage) {
    const StageView = View as ComponentType<{ title: string }>
    return (
      <>
        <SoftwareApplicationJsonLd
          name={tool.title}
          description={tool.description}
          path={tool.route}
          webApplication={tool.slug === "crypto-momentum-scanner"}
        />
        <div className="flex min-h-full flex-1 flex-col">
          <SiteHeader backHref={`/category/${tool.category}`} />
          <StageBackProvider href={`/category/${tool.category}`}>
            <StageView title={tool.title} />
          </StageBackProvider>
          <main className={cn(siteContainer, "pt-10 pb-20 sm:pt-14 sm:pb-24")}>
            <p id="how-it-works" className="max-w-xl scroll-mt-24 text-sm text-[var(--nb-secondary)]">
              {tool.description}
            </p>
            <ToolGuide slug={tool.slug} />
          </main>
          <SiteFooter />
        </div>
      </>
    )
  }

  return (
    <>
      <SoftwareApplicationJsonLd
        name={tool.title}
        description={tool.description}
        path={tool.route}
        webApplication={tool.slug === "crypto-momentum-scanner"}
      />
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
