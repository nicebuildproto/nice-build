import { InfoPage, InfoSection } from "@/components/site/InfoPage"
import { categories } from "@/lib/registry"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: `About${titleSuffix}`,
  description: "Nice Tools is a set of calculators, converters, and small utilities. Most of the work happens in your browser. No account.",
}

export default function AboutPage() {
  return (
    <InfoPage
      current="/about"
      eyebrow="About"
      title="Useful tools, one job each."
      lede="Nice Tools is a set of calculators, converters, and small utilities. Open one, get a result, and leave."
    >
      <InfoSection title="What it is">
        <p>
          Fourteen categories, from percentages to invoices and material estimates. Each tool finishes one job.
        </p>
        <p>
          There is no account to create. Log in on this site is a preview, and it does not save anything.
        </p>
      </InfoSection>
      <InfoSection title="Where the work happens">
        <p>
          Calculations run in your browser. Image tools redraw a picture on this device and offer a download. Those files are not uploaded.
        </p>
        <p>
          Most results use only the figures you type. The crypto scanner is the exception: it reads public market data and shows when that data was fetched. Fee tools start from rates you can edit.
        </p>
      </InfoSection>
      <InfoSection title="What a result is">
        <p>
          Tax, health, building, and price figures are estimates from the formula on the page. They are not advice, a quote, a diagnosis, or a promise of a future price.
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
