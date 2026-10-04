import { InfoPage, InfoSection } from "@/components/site/InfoPage"
import { categories } from "@/lib/registry"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About — Nice Build",
  description: "Nice Tools is a free, calm collection of calculators and small studios that run in your browser.",
}

export default function AboutPage() {
  return (
    <InfoPage
      current="/about"
      eyebrow="About"
      title="A quiet place for useful tools."
      lede="Nice Tools is a free collection of calculators, converters, and small studios. Open one, do the job, and leave with the result."
    >
      <InfoSection title="What it is">
        <p>
          Twelve categories, from everyday percentages to a flashing designer. Each tool is there to finish one task, not to become a product of its own.
        </p>
        <p>
          There is no account to create. Log in on this site is a preview and does not save anything.
        </p>
      </InfoSection>
      <InfoSection title="Where the work happens">
        <p>
          Calculations run in your browser. Image tools redraw a picture on this device and offer a download. The file is not uploaded.
        </p>
        <p>
          A result is only as current as the figures you type. Crypto tools do not read a market, and fee tools start from rates you can edit.
        </p>
      </InfoSection>
      <InfoSection title="What a result is">
        <p>
          Tax, health, building, and price figures are estimates from the formula on the page. They are not advice, a quote, a diagnosis, or a live price.
        </p>
      </InfoSection>
      <InfoSection title="The library">
        <ul className="flex flex-col gap-2">
          {categories.map((category) => (
            <li key={category.key}>
              <Link href={`/category/${category.key}`} className="underline-offset-4 hover:underline">
                {category.label}
              </Link>
              <span className="text-[var(--nb-secondary)]"> — {category.description}</span>
            </li>
          ))}
        </ul>
      </InfoSection>
    </InfoPage>
  )
}
