import { BackLink } from "@/components/site/BackLink"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { siteContainer } from "@/components/site/frame"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

const widths = {
  wide: "max-w-none",
  tool: "max-w-5xl",
  narrow: "max-w-3xl",
} as const

export function PageShell({
  children,
  backHref,
  width = "wide",
  footer = true,
}: {
  children: ReactNode
  backHref?: string
  width?: keyof typeof widths
  footer?: boolean
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className={cn(siteContainer, "flex flex-1 flex-col pt-8 pb-20 sm:pt-12 sm:pb-24")}>
        <div className={cn("w-full", widths[width])}>
          {backHref ? <BackLink href={backHref} className="mt-4 sm:mt-8" /> : null}
          {children}
        </div>
      </main>
      {footer ? <SiteFooter /> : null}
    </div>
  )
}
