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
    <section className="flex flex-col gap-5">
      <h2 className="flex items-baseline justify-between gap-4 text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
        {label}
        <span className="text-[11px] font-normal tracking-normal text-[var(--nb-secondary)]/70 normal-case tabular-nums">
          {tools.length === 1 ? "1 tool" : `${tools.length} tools`}
        </span>
      </h2>
      {tools.length === 0 ? (
        <p className="text-sm text-[var(--nb-secondary)]">Nothing here yet.</p>
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
