import { SankeyGenerator } from "@/components/sankey/SankeyGenerator"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { StageBackProvider } from "@/components/stage/chrome"
import { siteContainer } from "@/components/site/frame"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { ToolGuide } from "@/components/tools/ToolGuide"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Sankey Diagram Generator${titleSuffix}`,
  description: "Turn a table of flows into a Sankey diagram you can export as SVG or PNG.",
  openGraph: {
    title: `Sankey Diagram Generator${titleSuffix}`,
    description: "Turn a table of flows into a Sankey diagram you can export as SVG or PNG.",
  },
}

export default function SankeyGeneratorPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="Sankey Diagram Generator"
        description="Turn a table of flows into a Sankey diagram you can export as SVG or PNG."
        path="/design-creative/sankey-generator"
      />
      <div className="flex min-h-full flex-1 flex-col">
        <SiteHeader backHref="/category/data-viz" />
        <StageBackProvider href="/category/data-viz">
          <SankeyGenerator title="Sankey Diagram Generator" />
        </StageBackProvider>
        <div className={`${siteContainer} py-16 sm:py-20`}>
          <p id="how-it-works" className="max-w-xl scroll-mt-24 text-sm text-[var(--nb-secondary)]">
            Visualize how quantities flow from one stage to another.
          </p>
          <div className="max-w-5xl">
            <ToolGuide slug="sankey-generator" />
          </div>
        </div>
        <SiteFooter />
      </div>
    </>
  )
}
