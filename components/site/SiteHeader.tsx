import { BrandLink } from "@/components/BrandLink"
import { HeaderActions } from "@/components/site/HeaderActions"
import { siteContainer } from "@/components/site/frame"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className={cn(siteContainer, "flex h-14 items-center justify-between gap-3")}>
        <BrandLink logoClassName="h-6" priority />
        <HeaderActions />
      </div>
    </header>
  )
}
