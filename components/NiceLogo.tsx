import { cn } from "@/lib/utils"

export function NiceLogo({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <img
      src="/nice-build-logo.svg"
      alt="Nice Build"
      width={296}
      height={70}
      className={cn("h-6 w-auto max-w-full", className)}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  )
}
