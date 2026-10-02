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
        "inline-flex items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <NiceLogo priority={priority} className={logoClassName} />
    </Link>
  )
}
