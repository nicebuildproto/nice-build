import { PageShell } from "@/components/site/PageShell"
import { catalogGrid } from "@/components/site/frame"
import { ToolCard } from "@/components/ToolCard"
import { categories, getCategory, getFeaturedTools, getToolsByCategory, isCategory } from "@/lib/registry"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.key }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return {}

  return {
    title: `${category.label}${titleSuffix}`,
    description: category.description,
  }
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params
  if (!isCategory(slug)) notFound()

  const category = getCategory(slug)
  if (!category) notFound()

  const tools = getToolsByCategory(category.key)
  const featured = getFeaturedTools(category.key, 3)
  const rest = tools.filter((tool) => !featured.some((item) => item.slug === tool.slug))
  const heading = "text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase"

  return (
    <PageShell backHref="/">
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          {category.label}
        </h1>
        <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          {category.description}
        </p>
      </header>

      {tools.length === 0 ? (
        <p className="text-sm text-[var(--nb-secondary)]">No tools in this category yet.</p>
      ) : (
        <div className="flex flex-col gap-12">
          {featured.length > 0 ? (
            <section className="flex flex-col gap-4" aria-labelledby={`${category.key}-featured`}>
              <h2 id={`${category.key}-featured`} className={heading}>
                Featured tools
              </h2>
              <div className={catalogGrid}>
                {featured.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          ) : null}
          {rest.length > 0 ? (
            <section className="flex flex-col gap-4" aria-labelledby={`${category.key}-all`}>
              <h2 id={`${category.key}-all`} className={heading}>
                All tools
              </h2>
              <div className={catalogGrid}>
                {rest.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </PageShell>
  )
}
