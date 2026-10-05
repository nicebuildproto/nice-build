import { FlashingDesigner } from "@/components/flashing/FlashingDesigner"
import { siteName } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Flashing Designer · ${siteName}`,
  description: "Design a custom flashing profile, pick a finish and dimensions, then review the price before you order.",
}

export default function FlashingDesignerPage() {
  return <FlashingDesigner />
}
