import { NiceLogo } from "@/components/NiceLogo"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function BrandLink({
  className,
  logoClassName,
}: {
  className?: string
  logoClassName?: string
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <NiceLogo className={logoClassName} />
    </Link>
  )
}
