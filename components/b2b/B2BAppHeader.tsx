import { stageFloat } from "@/components/stage/tokens"
import type { B2BLogo } from "@/lib/b2b/tenants"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

export function B2BAppHeader({
  logo,
  customerName,
  productName,
  trailing,
  actions,
  homeHref = "/",
  variant = "bar",
  className,
}: {
  logo: B2BLogo
  customerName: string
  productName: string
  trailing?: ReactNode
  actions?: ReactNode
  homeHref?: string
  variant?: "bar" | "stage"
  className?: string
}) {
  if (variant === "stage") {
    return (
      <div className={cn("flex h-14 items-center justify-between gap-3 px-4", className)}>
        <div className={cn(stageFloat, "flex h-10 min-w-0 items-center gap-3 rounded-full pr-3 pl-3")}>
          <Link
            href={homeHref}
            className="shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={customerName}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              priority
              className="h-6 w-auto max-w-[34vw] object-contain object-left sm:max-w-40"
            />
          </Link>
          <span className="hidden min-w-0 truncate text-sm font-medium text-foreground sm:inline">{productName}</span>
        </div>
        <div className={cn(stageFloat, "flex h-10 shrink-0 items-center gap-1 rounded-full px-1")}>
          {trailing}
          {actions}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex h-14 items-center gap-3 px-4 sm:gap-4 sm:px-6", className)}>
      <Link
        href={homeHref}
        className="shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={customerName}
      >
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          priority
          className="h-7 w-auto max-w-[42vw] object-contain object-left sm:h-8 sm:max-w-56"
        />
      </Link>
      <span className="hidden min-w-0 truncate text-sm font-medium text-[var(--nb-primary)] min-[420px]:inline">{productName}</span>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {trailing}
        {actions}
      </div>
    </div>
  )
}
