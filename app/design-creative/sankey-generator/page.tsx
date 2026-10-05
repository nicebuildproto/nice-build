import { SankeyGenerator } from "@/components/sankey/SankeyGenerator"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { siteContainer } from "@/components/site/frame"
import { ToolGuide } from "@/components/tools/ToolGuide"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Sankey Diagram Generator${titleSuffix}`,
  description: "Turn a short table of flows into a Sankey diagram you can export — no design software required.",
  openGraph: {
    title: `Sankey Diagram Generator${titleSuffix}`,
    description: "Turn a short table of flows into a Sankey diagram you can export — no design software required.",
  },
}

export default function SankeyGeneratorPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="Sankey Diagram Generator"
        description="Create clear, beautiful Sankey diagrams from your data."
        path="/design-creative/sankey-generator"
      />
      <SankeyGenerator />
      <div className={`${siteContainer} py-16 sm:py-20`}>
        <div className="max-w-5xl">
          <ToolGuide slug="sankey-generator" />
        </div>
      </div>
    </>
  )
}
