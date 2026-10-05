import { PercentageClusterView } from "@/components/calculators/PercentageClusterView"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { percentagePages } from "@/lib/calculators/content"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"

const page = percentagePages.increase

export const metadata: Metadata = {
  title: `${page.title}${titleSuffix}`,
  description: page.description,
}

export default function PercentageIncreaseCalculatorPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={page.title}
        description={page.description}
        path="/calculators/percentage-increase-calculator"
      />
      <PercentageClusterView page={page} />
    </>
  )
}
