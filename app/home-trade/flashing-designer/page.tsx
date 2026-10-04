import type { Metadata } from "next"
import { FlashingDesigner } from "@/components/flashing/FlashingDesigner"

export const metadata: Metadata = {
  title: "Flashing Designer · Nice Build",
  description: "Configure a flashing profile, finish and dimensions, then review your design before ordering.",
}

export default function FlashingDesignerPage() {
  return <FlashingDesigner />
}
