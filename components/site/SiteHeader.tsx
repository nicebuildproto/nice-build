import { BrandLink } from "@/components/BrandLink"
import { stageFloat } from "@/components/stage/tokens"
import { BackLink } from "@/components/site/BackLink"
import { HeaderActions } from "@/components/site/HeaderActions"
import { siteContainer } from "@/components/site/frame"
import { cn } from "@/lib/utils"

export function SiteHeader({ backHref }: { backHref?: string }) {
  if (backHref) {
    return (
      <header className="sticky top-0 z-50 -mb-14 h-14 bg-transparent">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className={cn(stageFloat, "flex h-10 min-w-0 items-center gap-2 rounded-full pr-3 pl-1")}>
            <BackLink
              href={backHref}
              className="mb-0 size-8 shrink-0 bg-transparent text-foreground hover:bg-transparent hover:text-foreground"
            />
            <BrandLink logoClassName="h-6" priority />
          </div>
          <div className={cn(stageFloat, "flex h-10 shrink-0 items-center rounded-full px-1")}>
            <HeaderActions variant="stage" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className={cn(siteContainer, "flex h-14 items-center justify-between gap-3")}>
        <BrandLink logoClassName="h-6" priority />
        <HeaderActions />
      </div>
    </header>
  )
}
