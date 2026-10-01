import { CategorySection } from "@/components/CategorySection"
import { categories } from "@/lib/registry"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm text-[var(--nb-secondary)]">Nice Build</p>
        <h1 className="max-w-xl text-3xl font-medium tracking-tight text-[var(--nb-primary)]">
          Useful tools, designed with care.
        </h1>
      </header>
      {categories.map((category) => (
        <CategorySection
          key={category.key}
          category={category.key}
          label={category.label}
        />
      ))}
    </main>
  )
}
