import type { Metadata } from "next"
import { FlashingDesigner } from "@/components/flashing/FlashingDesigner"
import { siteContainer } from "@/components/site/frame"
import { ToolGuide } from "@/components/tools/ToolGuide"

export const metadata: Metadata = {
  title: "Flashing Designer · Nice Build",
  description: "Draw a flashing profile, choose a material, see the price.",
}

export default function FlashingDesignerPage() {
  return (
    <>
      <FlashingDesigner />
      <div className={`${siteContainer} py-16 sm:py-20`}>
        <div className="max-w-5xl">
          <ToolGuide slug="flashing-designer" />
        </div>
      </div>
    </>
  )
}
