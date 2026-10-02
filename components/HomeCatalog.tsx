"use client"

import { CategoryTile } from "@/components/CategoryTile"
import { ToolCard } from "@/components/ToolCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { categories, getLiveTools, searchTools } from "@/lib/registry"
import Link from "next/link"
import { useMemo, useState } from "react"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

export function HomeCatalog() {
  const [query, setQuery] = useState("")
  const matches = useMemo(() => searchTools(query), [query])
  const live = useMemo(() => getLiveTools(), [])
  const isSearching = query.trim().length > 0

  return (
    <div className="flex flex-col gap-14">
      <div className={`flex max-w-md flex-col gap-2 ${reveal}`}>
        <Label htmlFor="tool-search" className="sr-only">
          Search tools
        </Label>
        <Input
          id="tool-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools"
          className="h-10"
        />
      </div>

      {isSearching ? (
        matches.length === 0 ? (
          <p className="text-sm text-[var(--nb-secondary)]">No tools match “{query.trim()}”.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {matches.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-14">
          {live.length > 0 ? (
            <section className={`flex flex-col gap-4 ${reveal}`} style={{ animationDelay: "60ms" }}>
              <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                Live
              </h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {live.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={tool.route}
                      className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)] underline-offset-4 hover:underline"
                    >
                      {tool.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={`flex flex-col gap-3 ${reveal}`} style={{ animationDelay: "120ms" }}>
            <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
              Browse
            </h2>
            <div className="grid sm:grid-cols-2 sm:gap-x-8">
              {categories.map((category) => (
                <CategoryTile key={category.key} category={category} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
