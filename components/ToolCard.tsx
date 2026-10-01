import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ToolEntry } from "@/lib/registry"
import Link from "next/link"

export function ToolCard({ tool }: { tool: ToolEntry }) {
  const isLive = tool.status === "live"

  const content = (
    <Card
      className={
        isLive
          ? "h-full transition-colors hover:bg-[var(--nb-accent)]"
          : "h-full opacity-80"
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[var(--nb-primary)]">{tool.title}</CardTitle>
          {!isLive ? (
            <Badge variant="secondary" className="shrink-0">
              Coming soon
            </Badge>
          ) : null}
        </div>
        <CardDescription className="text-[var(--nb-secondary)]">
          {tool.description}
        </CardDescription>
      </CardHeader>
    </Card>
  )

  if (!isLive) {
    return (
      <div aria-disabled="true" className="cursor-default">
        {content}
      </div>
    )
  }

  return (
    <Link href={tool.route} className="block focus:outline-none">
      {content}
    </Link>
  )
}
