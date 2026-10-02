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
      src="/nice-tools-logo.png"
      alt="Nice Tools"
      width={296}
      height={70}
      className={cn("h-6 w-auto max-w-full dark:invert", className)}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  )
}
