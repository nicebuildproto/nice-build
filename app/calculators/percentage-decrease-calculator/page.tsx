import { PercentageClusterView } from "@/components/calculators/PercentageClusterView"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { percentagePages } from "@/lib/calculators/content"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"

const page = percentagePages.decrease

export const metadata: Metadata = {
  title: `${page.title}${titleSuffix}`,
  description: page.description,
}

export default function PercentageDecreaseCalculatorPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={page.title}
        description={page.description}
        path="/calculators/percentage-decrease-calculator"
      />
      <PercentageClusterView page={page} />
    </>
  )
}
