import { CategorySection } from "@/components/CategorySection"
import { NiceLogo } from "@/components/NiceLogo"
import { categories } from "@/lib/registry"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pt-16 pb-32 sm:pt-20">
      <header className={`mb-20 flex max-w-2xl flex-col items-start gap-10 sm:mb-24 sm:gap-12 ${reveal}`}>
        <NiceLogo priority className="mt-4 h-7 sm:mt-6 sm:h-8" />
        <h1 className="font-mono text-[length:var(--text-5xl)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-[var(--nb-primary)]">
          Your digital toolkit, built nicely.
        </h1>
      </header>

      <div className="flex flex-col gap-16 sm:gap-20">
        {categories.map((category, index) => (
          <div
            key={category.key}
            className={reveal}
            style={{ animationDelay: `${80 + index * 60}ms` }}
          >
            <CategorySection category={category.key} label={category.label} />
          </div>
        ))}
      </div>
    </main>
  )
}
