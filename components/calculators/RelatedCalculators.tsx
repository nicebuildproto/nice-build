import { getToolsByCluster } from "@/lib/registry"
import Link from "next/link"

export function RelatedCalculators({ currentSlug }: { currentSlug: string }) {
  const related = getToolsByCluster("percentage").filter((tool) => tool.slug !== currentSlug)

  if (related.length === 0) return null

  return (
    <aside className="mt-16 flex flex-col gap-4">
      <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
        Related calculators
      </h2>
      <ul className="flex flex-col gap-2">
        {related.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={tool.route}
              className="text-[13px] text-[var(--nb-primary)] underline-offset-4 hover:underline"
            >
              {tool.title}
            </Link>
            <p className="text-[13px] text-[var(--nb-secondary)]">{tool.description}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}
