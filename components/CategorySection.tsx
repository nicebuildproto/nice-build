import { ToolCard } from "@/components/ToolCard"
import type { Category } from "@/lib/registry"
import { registry } from "@/lib/registry"

export function CategorySection({
  category,
  label,
}: {
  category: Category
  label: string
}) {
  const tools = registry.filter((tool) => tool.category === category)

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium tracking-wide text-[var(--nb-secondary)] uppercase">
        {label}
      </h2>
      {tools.length === 0 ? (
        <p className="text-sm text-[var(--nb-secondary)]">
          Nothing here yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </section>
  )
}
