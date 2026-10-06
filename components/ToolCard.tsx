import { catalogGrid } from "@/components/site/frame"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategory, type ToolEntry } from "@/lib/registry"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

export { catalogGrid }

const liveCardClass =
  "h-full min-h-36 justify-between [--card-spacing:--spacing(6)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[translate,box-shadow] duration-150 ease-out group-hover/tool:-translate-y-1 group-hover/tool:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.12)] motion-reduce:transition-none motion-reduce:group-hover/tool:translate-y-0"

const soonCardClass =
  "h-full min-h-36 justify-between [--card-spacing:--spacing(6)] bg-transparent opacity-55 shadow-none ring-foreground/[0.06] grayscale"

export function CategoryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit max-w-full items-center rounded-full bg-[var(--nb-yellow)]/10 px-2 py-0.5 text-[11px] leading-4 font-medium tracking-[-0.01em] text-[var(--nb-yellow)]">
      {label}
    </span>
  )
}

export function CatalogCard({
  title,
  description,
  href,
  icon,
  trailing,
  detail,
  eyebrow,
}: {
  title: string
  description: string
  href?: string
  icon?: ReactNode
  trailing?: ReactNode
  detail?: ReactNode
  eyebrow?: ReactNode
}) {
  const content = (
    <Card className={cn(href ? liveCardClass : soonCardClass)}>
      <CardHeader className="gap-2">
        {eyebrow}
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
            {icon}
            {title}
          </CardTitle>
          {trailing}
        </div>
        <CardDescription className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          {description}
        </CardDescription>
        {detail}
      </CardHeader>
    </Card>
  )

  if (!href) {
    return (
      <div aria-disabled="true" className="h-full cursor-default select-none">
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="group/tool block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {content}
    </Link>
  )
}

export function ToolCard({ tool }: { tool: ToolEntry }) {
  const isLive = tool.status === "live"
  const category = getCategory(tool.category)

  return (
    <CatalogCard
      title={tool.title}
      description={tool.description}
      href={isLive ? tool.route : undefined}
      eyebrow={category ? <CategoryPill label={category.label} /> : null}
      trailing={
        isLive ? (
          <ArrowUpRight
            aria-hidden
            className="size-4 shrink-0 text-[var(--nb-secondary)] transition-[translate,color] duration-150 ease-out group-hover/tool:translate-x-0.5 group-hover/tool:-translate-y-0.5 group-hover/tool:text-[var(--nb-primary)]"
          />
        ) : (
          <Badge variant="outline" className="shrink-0 border-border font-normal text-[var(--nb-secondary)]">
            Coming soon
          </Badge>
        )
      }
    />
  )
}
