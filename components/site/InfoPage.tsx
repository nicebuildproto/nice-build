import { PageShell } from "@/components/site/PageShell"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { ReactNode } from "react"

const pages = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
]

export function InfoPage({
  eyebrow,
  title,
  lede,
  children,
  current,
}: {
  eyebrow: string
  title: string
  lede: string
  children: ReactNode
  current: string
}) {
  return (
    <PageShell backHref="/" width="narrow">
      <article className="flex flex-col">
        <header className="mb-12 flex max-w-xl flex-col gap-4 sm:mb-16">
          <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">{eyebrow}</p>
          <h1 className="font-mono text-[2.25rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance text-[var(--nb-primary)] sm:text-5xl">
            {title}
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--nb-secondary)]">{lede}</p>
        </header>
        <div className="flex flex-col gap-10">{children}</div>
        <nav aria-label="More about Nice Tools" className="mt-16 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-8">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              aria-current={page.href === current ? "page" : undefined}
              className={cn(
                "text-[13px] underline-offset-4 hover:underline",
                page.href === current ? "text-[var(--nb-primary)]" : "text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]"
              )}
            >
              {page.label}
            </Link>
          ))}
        </nav>
      </article>
    </PageShell>
  )
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex max-w-xl flex-col gap-3 border-t border-border pt-8">
      <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-[var(--nb-primary)]">{children}</div>
    </section>
  )
}
