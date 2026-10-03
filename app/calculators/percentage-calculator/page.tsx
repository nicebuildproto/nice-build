import { PercentageClusterView } from "@/components/calculators/PercentageClusterView"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { percentagePages } from "@/lib/calculators/content"
import type { Metadata } from "next"

const page = percentagePages.basic

export const metadata: Metadata = {
  title: `${page.title} — Nice Build`,
  description: page.description,
}

export default function PercentageCalculatorPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={page.title}
        description={page.description}
        path="/calculators/percentage-calculator"
      />
      <PercentageClusterView page={page} />
    </>
  )
}
