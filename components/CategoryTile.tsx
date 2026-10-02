import { getFeaturedTools, getToolsByCategory, type categories } from "@/lib/registry"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

type CategoryItem = (typeof categories)[number]

export function CategoryTile({ category }: { category: CategoryItem }) {
  const tools = getToolsByCategory(category.key)
  const featured = getFeaturedTools(category.key, 2)

  return (
    <Link
      href={`/category/${category.key}`}
      className={cn(
        "group/cat -mx-3 flex flex-col gap-1.5 rounded-xl px-3 py-4",
        "outline-none transition-colors duration-150 ease-out",
        "hover:bg-[var(--nb-accent)]",
        "focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
          {category.label}
        </h2>
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--nb-secondary)] tabular-nums">
          {tools.length}
          <ArrowRight
            aria-hidden
            className="size-3.5 text-[var(--nb-secondary)] transition-transform duration-150 ease-out group-hover/cat:translate-x-0.5 group-hover/cat:text-[var(--nb-primary)]"
          />
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        {category.description}
      </p>
      {featured.length > 0 ? (
        <p className="text-[13px] text-[var(--nb-secondary)]/70">
          {featured.map((tool) => tool.title).join(" · ")}
        </p>
      ) : null}
    </Link>
  )
}
