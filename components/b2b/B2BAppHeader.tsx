import type { B2BHelpLink, B2BLogo } from "@/lib/b2b/tenants"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

export function B2BAppHeader({
  logo,
  customerName,
  productName,
  help,
  trailing,
  homeHref = "/",
  className,
}: {
  logo: B2BLogo
  customerName: string
  productName: string
  help?: B2BHelpLink
  trailing?: ReactNode
  homeHref?: string
  className?: string
}) {
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
      <span className="min-w-0 truncate text-sm font-medium text-[var(--nb-primary)]">{productName}</span>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {trailing}
        {help ? (
          <Link
            href={help.href}
            className="inline-flex h-8 items-center rounded-md px-2 text-[13px] font-medium text-[var(--nb-secondary)] outline-none hover:bg-[var(--nb-accent)] hover:text-[var(--nb-primary)] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {help.label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
