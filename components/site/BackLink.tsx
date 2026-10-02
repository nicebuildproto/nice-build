import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function BackLink({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Back"
      className={cn(
        "group mb-6 inline-flex size-9 items-center justify-center rounded-full bg-[var(--nb-accent)] text-[var(--nb-secondary)] outline-none transition-colors hover:text-[var(--nb-primary)] focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <ArrowLeft
        aria-hidden
        className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      />
    </Link>
  )
}
