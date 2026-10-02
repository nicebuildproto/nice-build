import { ToolCard } from "@/components/ToolCard"
import { getFeaturedTools, getToolsByCategory, type categories } from "@/lib/registry"
import Link from "next/link"

type CategoryItem = (typeof categories)[number]

export function CategoryTile({ category }: { category: CategoryItem }) {
  const tools = getToolsByCategory(category.key)
  const featured = getFeaturedTools(category.key, 3)

  return (
    <section className="flex flex-col gap-5">
      <h2 className="flex items-baseline justify-between gap-4 text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
        {category.label}
        <span className="text-[11px] font-normal tracking-normal text-[var(--nb-secondary)]/70 normal-case tabular-nums">
          {tools.length === 1 ? "1 tool" : `${tools.length} tools`}
        </span>
      </h2>
      <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">{category.description}</p>
      <div className="grid gap-4">
        {featured.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
      <Link
        href={`/category/${category.key}`}
        className="w-fit text-[13px] text-[var(--nb-primary)] underline-offset-4 hover:underline"
      >
        Browse all →
      </Link>
    </section>
  )
}
