import { cn } from "@/lib/utils"

export function NiceLogo({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <span className="relative inline-flex">
      <img
        src="/nice-build-logo.svg"
        alt="Nice Build"
        width={296}
        height={70}
        className={cn(
          "h-6 w-auto max-w-full origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:invert",
          "group-hover/logo:-translate-y-px group-hover/logo:-rotate-2 group-hover/logo:scale-[1.04]",
          "motion-reduce:transition-none motion-reduce:group-hover/logo:translate-y-0 motion-reduce:group-hover/logo:rotate-0 motion-reduce:group-hover/logo:scale-100",
          className
        )}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1 -right-1.5 size-1.5 origin-center scale-50 rounded-full bg-[var(--nb-yellow)] opacity-0 transition duration-300 ease-out group-hover/logo:scale-100 group-hover/logo:opacity-100 motion-reduce:hidden"
      />
    </span>
  )
}
