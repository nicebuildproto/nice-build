import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ToolEntry } from "@/lib/registry"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function ToolCard({ tool }: { tool: ToolEntry }) {
  const isLive = tool.status === "live"

  const content = (
    <Card
      className={cn(
        "h-full min-h-36 justify-between [--card-spacing:--spacing(6)]",
        isLive
          ? "shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[translate,box-shadow] duration-150 ease-out group-hover/tool:-translate-y-1 group-hover/tool:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.12)] group-hover/tool:ring-foreground/18 motion-reduce:transition-none motion-reduce:group-hover/tool:translate-y-0"
          : "bg-transparent opacity-55 shadow-none ring-foreground/[0.06] grayscale"
      )}
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
            {tool.title}
          </CardTitle>
          {isLive ? (
            <ArrowUpRight
              aria-hidden
              className="size-4 shrink-0 text-[var(--nb-secondary)] transition-[translate,color] duration-150 ease-out group-hover/tool:translate-x-0.5 group-hover/tool:-translate-y-0.5 group-hover/tool:text-[var(--nb-primary)]"
            />
          ) : (
            <Badge
              variant="outline"
              className="shrink-0 border-black/10 font-normal text-[var(--nb-secondary)]"
            >
              Coming soon
            </Badge>
          )}
        </div>
        <CardDescription className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          {tool.description}
        </CardDescription>
      </CardHeader>
    </Card>
  )

  if (!isLive) {
    return (
      <div aria-disabled="true" className="h-full cursor-default select-none">
        {content}
      </div>
    )
  }

  return (
    <Link
      href={tool.route}
      className="group/tool block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {content}
    </Link>
  )
}
