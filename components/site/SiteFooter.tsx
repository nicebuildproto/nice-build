import { siteContainer } from "@/components/site/frame"
import { cn } from "@/lib/utils"
import Link from "next/link"

const links = [
  { href: "/#browse", label: "Tools" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
  { href: "#privacy", label: "Privacy" },
  { href: "#terms", label: "Terms" },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div
        className={cn(
          siteContainer,
          "flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-10"
        )}
      >
        <p className="flex items-center gap-2 text-[13px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--nb-yellow)]" />
          Nice Build
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] text-[var(--nb-secondary)] underline-offset-4 hover:text-[var(--nb-primary)] hover:underline hover:decoration-[var(--nb-yellow)]"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] text-[var(--nb-secondary)] underline-offset-4 hover:text-[var(--nb-primary)] hover:underline hover:decoration-[var(--nb-yellow)]"
              >
                {link.label}
              </a>
            )
          )}
        </nav>
      </div>
    </footer>
  )
}
