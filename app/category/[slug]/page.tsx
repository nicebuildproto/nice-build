import { PageShell } from "@/components/site/PageShell"
import { catalogGrid } from "@/components/site/frame"
import { ToolCard } from "@/components/ToolCard"
import { categories, getCategory, getToolsByCategory, isCategory } from "@/lib/registry"
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
    title: `${category.label} — Nice Build`,
    description: category.description,
  }
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params
  if (!isCategory(slug)) notFound()

  const category = getCategory(slug)
  if (!category) notFound()

  const tools = getToolsByCategory(category.key)

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
        <p className="text-sm text-[var(--nb-secondary)]">Nothing here yet.</p>
      ) : (
        <div className={catalogGrid}>
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
