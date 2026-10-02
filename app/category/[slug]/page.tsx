import { BrandLink } from "@/components/BrandLink"
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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pt-10 pb-24 sm:pt-14">
      <BrandLink className="opacity-80 transition-opacity hover:opacity-100" logoClassName="h-5" />

      <header className="mt-10 mb-10 flex flex-col gap-3">
        <h1 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          {category.label}
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">{category.description}</p>
      </header>

      {tools.length === 0 ? (
        <p className="text-sm text-[var(--nb-secondary)]">Nothing here yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </main>
  )
}
