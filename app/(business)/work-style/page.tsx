import Link from "next/link"

export default function WorkStylePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]"
      >
        Nice Build
      </Link>
      <h1 className="mt-3 text-2xl font-medium tracking-tight text-[var(--nb-primary)]">
        Work Style Quiz
      </h1>
      <p className="mt-2 text-sm text-[var(--nb-secondary)]">Coming soon.</p>
    </main>
  )
}
