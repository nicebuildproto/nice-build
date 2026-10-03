import { CatalogCard } from "@/components/ToolCard"
import { getFeaturedTools, getToolsByCategory, type categories, type CategoryIcon } from "@/lib/registry"
import {
  ArrowRight,
  BarChart3,
  Bitcoin,
  Briefcase,
  Calculator,
  Code2,
  FileStack,
  Gamepad2,
  Hammer,
  Palette,
  Sparkles,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react"

type CategoryItem = (typeof categories)[number]

const categoryIcons: Record<CategoryIcon, LucideIcon> = {
  Calculator,
  Code2,
  FileStack,
  Palette,
  BarChart3,
  Briefcase,
  Hammer,
  Users,
  Type,
  Sparkles,
  Gamepad2,
  Bitcoin,
}

export function CategoryTile({ category }: { category: CategoryItem }) {
  const tools = getToolsByCategory(category.key)
  const featured = getFeaturedTools(category.key, 2)
  const Icon = categoryIcons[category.icon]

  return (
    <CatalogCard
      href={`/category/${category.key}`}
      title={category.label}
      description={category.description}
      icon={
        <Icon
          aria-hidden
          className="size-4 shrink-0 text-[var(--nb-secondary)] transition-colors duration-150 group-hover/tool:text-[#ff0101]"
        />
      }
      trailing={
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--nb-secondary)] tabular-nums">
          {tools.length}
          <ArrowRight
            aria-hidden
            className="size-3.5 transition-transform duration-150 ease-out group-hover/tool:translate-x-0.5 group-hover/tool:text-[var(--nb-primary)]"
          />
        </span>
      }
      detail={
        featured.length > 0 ? (
          <p className="text-[13px] text-[var(--nb-secondary)]/75">
            {featured.map((tool) => tool.title).join(" · ")}
          </p>
        ) : null
      }
    />
  )
}
