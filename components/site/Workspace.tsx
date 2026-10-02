"use client"

import { NiceLogo } from "@/components/NiceLogo"
import { siteContainer, catalogGrid } from "@/components/site/frame"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { categories, getCategory, getLiveTools, type ToolEntry } from "@/lib/registry"
import { cn } from "@/lib/utils"
import { Plus, Search, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { createPortal } from "react-dom"

const storageKey = "nb-workspace"

const defaultPins = [
  "percentage-calculator",
  "tip-calculator",
  "json-formatter",
  "colour-palette-generator",
  "word-counter",
  "countdown",
]

const pinCardClass =
  "h-full min-h-36 justify-between [--card-spacing:--spacing(6)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[translate,box-shadow] duration-150 ease-out group-hover/pin:-translate-y-1 group-hover/pin:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.12)] motion-reduce:transition-none motion-reduce:group-hover/pin:translate-y-0"

const floatingCardClass =
  "h-full min-h-36 justify-between [--card-spacing:--spacing(6)] scale-[1.02] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)] motion-reduce:scale-100"

function readPins() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) return defaultPins
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return defaultPins
    const live = new Set(getLiveTools().map((tool) => tool.slug))
    return parsed.filter((slug): slug is string => typeof slug === "string" && live.has(slug))
  } catch {
    return defaultPins
  }
}

function writePins(slugs: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(slugs))
  } catch {
    // Ignore private-mode storage failures. The session still works.
  }
}

function moveSlug(slugs: string[], slug: string, toIndex: number) {
  const from = slugs.indexOf(slug)
  if (from < 0) return slugs
  const next = slugs.slice()
  next.splice(from, 1)
  const index = Math.max(0, Math.min(toIndex, next.length))
  if (index === from) return slugs
  next.splice(index, 0, slug)
  return next
}

export function Workspace({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const searchId = useId()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pinsRef = useRef<string[] | null>(null)
  const positions = useRef(new Map<string, DOMRect>())
  const suppressClick = useRef(false)
  const dragRef = useRef<{
    slug: string
    pointerId: number
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    width: number
    height: number
    dragging: boolean
  } | null>(null)
  const [pins, setPins] = useState<string[] | null>(null)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [moved, setMoved] = useState(false)
  const [status, setStatus] = useState("")
  const [dragSlug, setDragSlug] = useState<string | null>(null)
  const [dragVisual, setDragVisual] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    const stored = readPins()
    pinsRef.current = stored
    setPins(stored)
  }, [])

  useEffect(() => {
    pinsRef.current = pins
  }, [pins])

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const next = new Map<string, DOMRect>()
    grid.querySelectorAll<HTMLElement>("[data-pin]").forEach((node) => {
      const slug = node.dataset.pin
      if (!slug) return
      const rect = node.getBoundingClientRect()
      const prev = positions.current.get(slug)
      if (prev && slug !== dragRef.current?.slug && !reduce) {
        const dx = prev.left - rect.left
        const dy = prev.top - rect.top
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          node.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
            { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }
          )
        }
      }
      next.set(slug, rect)
    })
    positions.current = next
  }, [pins])

  useEffect(() => {
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  const pinnedTools = useMemo(() => {
    if (!pins) return []
    const bySlug = new Map(getLiveTools().map((tool) => [tool.slug, tool]))
    return pins.flatMap((slug) => {
      const tool = bySlug.get(slug)
      return tool ? [tool] : []
    })
  }, [pins])

  const available = useMemo(() => {
    const pinned = new Set(pins ?? [])
    const needle = query.trim().toLowerCase()
    return getLiveTools().filter((tool) => {
      if (pinned.has(tool.slug)) return false
      if (!needle) return true
      const category = getCategory(tool.category)?.label ?? ""
      return [tool.title, tool.description, category, ...(tool.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [pins, query])

  const groups = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          tools: available
            .map((tool, index) => ({ tool, index }))
            .filter(({ tool }) => tool.category === category.key),
        }))
        .filter((group) => group.tools.length > 0),
    [available]
  )

  useEffect(() => {
    setActive(0)
    setMoved(false)
  }, [query])

  function updatePins(next: string[], message: string) {
    setPins(next)
    writePins(next)
    setStatus(message)
  }

  function addTool(tool: ToolEntry) {
    if (!pins || pins.includes(tool.slug)) return
    updatePins([...pins, tool.slug], `Added ${tool.title}`)
  }

  function removeTool(tool: ToolEntry) {
    if (!pins) return
    updatePins(
      pins.filter((slug) => slug !== tool.slug),
      `Removed ${tool.title}`
    )
  }

  function rememberPositions() {
    const grid = gridRef.current
    if (!grid) return
    const next = new Map<string, DOMRect>()
    grid.querySelectorAll<HTMLElement>("[data-pin]").forEach((node) => {
      if (node.dataset.pin) next.set(node.dataset.pin, node.getBoundingClientRect())
    })
    positions.current = next
  }

  function indexAtPoint(x: number, y: number, slug: string) {
    const grid = gridRef.current
    if (!grid) return 0
    const nodes = [...grid.querySelectorAll<HTMLElement>("[data-pin]")]
    let index = 0
    for (const node of nodes) {
      if (node.dataset.pin === slug) continue
      const rect = node.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const sameRow = Math.abs(centerY - y) <= rect.height / 2
      if (centerY < y - rect.height / 2 || (sameRow && centerX < x)) index += 1
    }
    return index
  }

  function onPinPointerDown(event: PointerEvent<HTMLAnchorElement>, tool: ToolEntry) {
    if (event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = {
      slug: tool.slug,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      dragging: false,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some pointer events cannot be captured. Drag still follows the card.
    }
  }

  function onPinPointerMove(event: PointerEvent<HTMLAnchorElement>) {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.dragging) {
      if (dx * dx + dy * dy < 36) return
      drag.dragging = true
      setDragSlug(drag.slug)
    }

    setDragVisual({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
      width: drag.width,
      height: drag.height,
    })

    const scroller = scrollerRef.current
    if (scroller) {
      const bounds = scroller.getBoundingClientRect()
      if (event.clientY < bounds.top + 56) scroller.scrollTop -= 14
      else if (event.clientY > bounds.bottom - 56) scroller.scrollTop += 14
    }

    const current = pinsRef.current
    if (!current) return
    const toIndex = indexAtPoint(event.clientX, event.clientY, drag.slug)
    const next = moveSlug(current, drag.slug, toIndex)
    if (next === current) return
    rememberPositions()
    pinsRef.current = next
    setPins(next)
  }

  function finishDrag(event: PointerEvent<HTMLAnchorElement>) {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    if (drag.dragging) {
      suppressClick.current = true
      window.setTimeout(() => {
        suppressClick.current = false
      }, 0)
      if (pinsRef.current) writePins(pinsRef.current)
      const title = getLiveTools().find((tool) => tool.slug === drag.slug)?.title
      if (title) setStatus(`Moved ${title}`)
    }
    dragRef.current = null
    setDragSlug(null)
    setDragVisual(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== "Tab" || !rootRef.current) return
    const nodes = [
      ...rootRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
      ),
    ]
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (available.length === 0) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setMoved(true)
      setActive((index) => {
        if (!moved && !query.trim()) return 0
        return Math.min(available.length - 1, index + 1)
      })
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setMoved(true)
      setActive((index) => Math.max(0, index - 1))
    } else if (event.key === "Enter") {
      const needle = query.trim()
      if (!needle && !moved) return
      event.preventDefault()
      const tool = available[Math.min(active, available.length - 1)]
      if (tool) addTool(tool)
    }
  }

  const trimmed = query.trim()
  const highlight = trimmed.length > 0 || moved
  const ready = pins !== null
  const draggedTool = dragSlug ? pinnedTools.find((tool) => tool.slug === dragSlug) : undefined

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onDialogKeyDown}
      className={cn(
        "fixed inset-0 z-[80] flex flex-col bg-background animate-in fade-in duration-200 ease-out motion-reduce:animate-none",
        dragSlug && "cursor-grabbing select-none"
      )}
    >
      <header className="shrink-0 bg-background">
        <div className={cn(siteContainer, "flex h-14 items-center justify-between gap-3")}>
          <Link
            href="/"
            onClick={onClose}
            className="inline-flex items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <NiceLogo className="h-6" />
          </Link>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close workspace"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--nb-accent)] text-[var(--nb-secondary)] outline-none transition-colors hover:text-[var(--nb-primary)] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      </header>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={cn(siteContainer, "py-8 sm:py-12")}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--nb-accent)] text-[13px] font-medium text-[var(--nb-primary)]"
            >
              D
            </span>
            <span>
              <span className="block text-[14px] font-medium text-[var(--nb-primary)]">Demo</span>
              <span className="block text-[13px] text-[var(--nb-secondary)]">Preview account</span>
            </span>
          </div>

          <h1
            id={titleId}
            className="mt-8 text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-[var(--nb-primary)] sm:text-4xl"
          >
            Your tools
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--nb-secondary)]">
            Pin the tools you want within reach, then drag a card to rearrange it. This preview stays in this browser.
          </p>
          <p className="sr-only" role="status">
            {status}
          </p>

          <div className="mt-8">
            {!ready ? (
              <div className="min-h-36" />
            ) : pinnedTools.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                <p className="text-sm font-medium text-[var(--nb-primary)]">Nothing pinned yet.</p>
                <p className="mt-1 text-[13px] text-[var(--nb-secondary)]">
                  Search below and add a tool.
                </p>
              </div>
            ) : (
              <div ref={gridRef} className={catalogGrid}>
                {pinnedTools.map((tool) => {
                  const category = getCategory(tool.category)
                  const dragging = dragSlug === tool.slug
                  return (
                    <div key={tool.slug} data-pin={tool.slug} className="group/pin relative h-full">
                      {dragging ? (
                        <div className="pointer-events-none absolute inset-0 rounded-xl bg-[var(--nb-accent)]" />
                      ) : null}
                      <Link
                        href={tool.route}
                        draggable={false}
                        onClick={(event) => {
                          if (suppressClick.current) {
                            event.preventDefault()
                            return
                          }
                          onClose()
                        }}
                        onPointerDown={(event) => onPinPointerDown(event, tool)}
                        onPointerMove={onPinPointerMove}
                        onPointerUp={finishDrag}
                        onPointerCancel={finishDrag}
                        className={cn(
                          "relative block h-full cursor-grab touch-none rounded-xl outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing",
                          dragging && "invisible",
                          dragSlug && dragSlug !== tool.slug && "pointer-events-none"
                        )}
                      >
                        <Card className={cn(pinCardClass, dragSlug && "group-hover/pin:translate-y-0 group-hover/pin:shadow-[0_1px_2px_rgba(0,0,0,0.03)]")}>
                          <CardHeader>
                            <div className="flex flex-col gap-2 pr-8">
                              <p className="text-[12px] text-[var(--nb-secondary)]">{category?.label}</p>
                              <CardTitle className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
                                {tool.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 text-[13px] leading-relaxed text-[var(--nb-secondary)]">
                                {tool.description}
                              </CardDescription>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${tool.title}`}
                        onClick={() => removeTool(tool)}
                        className={cn(
                          "absolute top-5 right-5 z-10 inline-flex size-7 items-center justify-center rounded-full bg-[var(--nb-accent)] text-[var(--nb-secondary)] opacity-100 outline-none transition-opacity hover:text-[var(--nb-primary)] focus-visible:ring-3 focus-visible:ring-ring/50 sm:opacity-0 sm:group-focus-within/pin:opacity-100 sm:group-hover/pin:opacity-100",
                          dragging && "invisible"
                        )}
                      >
                        <X aria-hidden className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <section className="mt-14" aria-labelledby={`${searchId}-label`}>
            <h2
              id={`${searchId}-label`}
              className="text-lg font-medium tracking-[-0.02em] text-[var(--nb-primary)]"
            >
              Add a tool
            </h2>
            <p className="mt-1 text-sm text-[var(--nb-secondary)]">
              Search the catalogue and pin what you use.
            </p>

            <div className="relative mt-5 max-w-2xl">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow] duration-150",
                  "focus-within:border-foreground/15 focus-within:shadow-[0_0_0_3px_var(--nb-accent)]"
                )}
              >
                <Search aria-hidden className="size-4 shrink-0 text-[var(--nb-secondary)]" />
                <input
                  ref={searchRef}
                  id={searchId}
                  role="combobox"
                  aria-expanded={available.length > 0}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    highlight && available[active] ? `${listId}-${available[active].slug}` : undefined
                  }
                  type="search"
                  value={query}
                  placeholder="Search tools"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onSearchKey}
                  className="h-12 w-full bg-transparent text-[15px] text-[var(--nb-primary)] outline-none placeholder:text-[var(--nb-secondary)] [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("")
                      searchRef.current?.focus()
                    }}
                    className="rounded-md p-1 text-[var(--nb-secondary)] outline-none hover:text-[var(--nb-primary)] focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div id={listId} className="mt-6 flex flex-col gap-8">
              {!ready ? null : trimmed && available.length === 0 ? (
                <p className="text-sm text-[var(--nb-secondary)]">No tools match “{trimmed}”.</p>
              ) : available.length === 0 ? (
                <p className="text-sm text-[var(--nb-secondary)]">Every live tool is already pinned.</p>
              ) : (
                groups.map((group) => (
                  <section key={group.category.key} className="flex flex-col gap-1">
                    <h3 className="px-3 pb-1 text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                      {group.category.label}
                    </h3>
                    <ul>
                      {group.tools.map(({ tool, index }) => {
                        const selected = highlight && index === active
                        return (
                          <li key={tool.slug} id={`${listId}-${tool.slug}`}>
                            <button
                              type="button"
                              onMouseEnter={() => {
                                setMoved(true)
                                setActive(index)
                              }}
                              onClick={() => addTool(tool)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                                selected && "bg-[var(--nb-accent)]"
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
                              <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-[var(--nb-secondary)]">
                                <Plus aria-hidden className="size-3.5" />
                                Add
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
      {dragVisual && draggedTool ? (
        <div
          className="pointer-events-none fixed top-0 left-0 z-[90]"
          style={{
            transform: `translate(${dragVisual.x}px, ${dragVisual.y}px)`,
            width: dragVisual.width,
          }}
        >
          <Card className={floatingCardClass}>
            <CardHeader>
              <div className="flex flex-col gap-2 pr-8">
                <p className="text-[12px] text-[var(--nb-secondary)]">
                  {getCategory(draggedTool.category)?.label}
                </p>
                <CardTitle className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
                  {draggedTool.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-[13px] leading-relaxed text-[var(--nb-secondary)]">
                  {draggedTool.description}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      ) : null}
    </div>,
    document.body
  )
}
