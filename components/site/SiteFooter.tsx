import { siteContainer } from "@/components/site/frame"
import { cn } from "@/lib/utils"
import Link from "next/link"

const links = [
  { href: "/#browse", label: "Tools" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div
        className={cn(
          siteContainer,
          "flex justify-start py-8 sm:py-10"
        )}
      >
        <nav aria-label="Footer" className="flex flex-wrap justify-start gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] text-[var(--nb-secondary)] transition-colors hover:text-[var(--nb-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
