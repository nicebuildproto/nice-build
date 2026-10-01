import type { Metadata } from "next"
import { FlashingDesigner } from "@/components/flashing/FlashingDesigner"

export const metadata: Metadata = {
  title: "Flashing Designer · Nice Build",
  description: "Draw a flashing profile, choose a material, see the price.",
}

export default function FlashingDesignerPage() {
  return <FlashingDesigner />
}
