"use client"

import { CategoryTile } from "@/components/CategoryTile"
import { catalogGrid } from "@/components/site/frame"
import { ToolCard } from "@/components/ToolCard"
import { categories, getCategory, getLiveTools, searchTools, type ToolEntry } from "@/lib/registry"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useId, useMemo, useRef, useState } from "react"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

export function HomeCatalog() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [shortcut, setShortcut] = useState("⌘K")
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const router = useRouter()

  const trimmed = query.trim()
  const matches = useMemo(() => searchTools(trimmed), [trimmed])
  const live = useMemo(() => getLiveTools(), [])
  const results = trimmed ? matches : live
  const isSearching = trimmed.length > 0

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K")
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      const command = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"
      const slash = event.key === "/" && !typing
      if (!command && !slash) return
      event.preventDefault()
      inputRef.current?.focus()
      setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    setActive(0)
  }, [trimmed])

  function openResult(tool: ToolEntry) {
    if (tool.status !== "live") return
    router.push(tool.route)
  }

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(results.length - 1, index + 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((index) => Math.max(0, index - 1))
    } else if (event.key === "Enter") {
      const tool = results[active]
      if (tool) {
        event.preventDefault()
        openResult(tool)
      }
    } else if (event.key === "Escape") {
      setQuery("")
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="flex flex-col">
      <header className={`relative z-20 mb-14 max-w-3xl sm:mb-20 ${reveal}`}>
        <h1 className="font-mono text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-[var(--nb-primary)] sm:text-[length:var(--text-5xl)]">
          Your (nice)
          <br />
          digital toolkit.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--nb-secondary)]">
          Grab a calculator, converter, or generator and get the answer in a few taps. No sign-up, no clutter — just the tool you need.
        </p>

        <div className="relative mt-8 max-w-2xl sm:mt-10">
          <label htmlFor="tool-search" className="sr-only">
            Search tools
          </label>
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow] duration-150",
              open && "border-foreground/15 shadow-[0_0_0_3px_var(--nb-accent)]"
            )}
          >
            <Search aria-hidden className="size-4 shrink-0 text-[var(--nb-secondary)]" />
            <input
              ref={inputRef}
              id="tool-search"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              type="search"
              value={query}
              placeholder="Search tools"
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onSearchKey}
              className="h-12 w-full bg-transparent text-[15px] text-[var(--nb-primary)] outline-none placeholder:text-[var(--nb-secondary)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery("")
                  inputRef.current?.focus()
                }}
                className="rounded-md p-1 text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]"
              >
                <X className="size-4" />
              </button>
            ) : (
              <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-[var(--nb-secondary)] sm:inline">
                {shortcut}
              </kbd>
            )}
          </div>

          {open ? (
            <div
              id={listId}
              role="listbox"
              onMouseDown={(event) => event.preventDefault()}
              className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-30 overflow-hidden rounded-2xl border border-border bg-popover shadow-[0_16px_40px_-24px_rgba(0,0,0,0.45)] animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none"
            >
              <p className="px-4 pt-3 pb-1 text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                {isSearching ? "Results" : "Live"}
              </p>
              {results.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--nb-secondary)]">
                  No tools match “{trimmed}”.
                </p>
              ) : (
                <ul className="max-h-[min(22rem,50vh)] overflow-y-auto p-2">
                  {results.map((tool, index) => {
                    const category = getCategory(tool.category)
                    const selected = index === active
                    const liveTool = tool.status === "live"
                    return (
                      <li key={tool.slug} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          disabled={!liveTool}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => openResult(tool)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            selected && "bg-[var(--nb-accent)]",
                            !liveTool && "cursor-default opacity-55"
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
                              {tool.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[13px] text-[var(--nb-secondary)]">
                              {tool.description}
                            </span>
                          </span>
                          <span className="shrink-0 pt-0.5 text-[12px] text-[var(--nb-secondary)]">
                            {liveTool ? category?.label : "Soon"}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <div className={cn("flex flex-col gap-12 transition-opacity duration-150 sm:gap-16", open && "opacity-45")}>
        {isSearching && !open ? (
          matches.length === 0 ? (
            <p className="text-sm text-[var(--nb-secondary)]">No tools match “{trimmed}”.</p>
          ) : (
            <section className="flex flex-col gap-4">
              <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                Results
              </h2>
              <div className={catalogGrid}>
                {matches.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )
        ) : (
            <section
              id="browse"
              className={`flex scroll-mt-24 flex-col gap-4 ${reveal}`}
              style={{ animationDelay: "60ms" }}
            >
              <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                Browse
              </h2>
              <div className={catalogGrid}>
                {categories.map((category) => (
                  <CategoryTile key={category.key} category={category} />
                ))}
              </div>
            </section>
        )}
      </div>
    </div>
  )
}
