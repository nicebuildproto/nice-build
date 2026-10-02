import { NiceLogo } from "@/components/NiceLogo"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function BrandLink({
  className,
  logoClassName,
  priority = false,
}: {
  className?: string
  logoClassName?: string
  priority?: boolean
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group/logo relative inline-flex items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--nb-yellow)_45%,transparent)]",
        className
      )}
    >
      <NiceLogo priority={priority} className={logoClassName} />
    </Link>
  )
}
