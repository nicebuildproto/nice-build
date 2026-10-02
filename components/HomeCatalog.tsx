"use client"

import { CategoryTile } from "@/components/CategoryTile"
import { ToolCard } from "@/components/ToolCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { categories, searchTools } from "@/lib/registry"
import { useMemo, useState } from "react"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

export function HomeCatalog() {
  const [query, setQuery] = useState("")
  const matches = useMemo(() => searchTools(query), [query])
  const isSearching = query.trim().length > 0

  return (
    <div className="flex flex-col gap-10">
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
        <div className="grid gap-16 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-16">
          {categories.map((category, index) => (
            <div
              key={category.key}
              className={reveal}
              style={{ animationDelay: `${80 + index * 40}ms` }}
            >
              <CategoryTile category={category} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
