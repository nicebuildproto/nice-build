import { colourById, materialById } from "@/lib/flashing/pricing"
import type { FlashingModel } from "./model"

/** "Monument, colour out" or the plain material name. */
export function materialShort(m: Pick<FlashingModel, "material" | "colourId" | "side">): string {
  if (m.material === "colour") {
    const colour = colourById(m.colourId)
    return colour ? `${colour.label.replace("®", "")}, colour ${m.side}` : materialById(m.material).label
  }
  return materialById(m.material).label
}
