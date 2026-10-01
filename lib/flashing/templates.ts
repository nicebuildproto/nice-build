import type { Point } from "./geometry"

export interface FlashingTemplate {
  id: string
  code: string
  name: string
  alias?: string
  summary: string
  detail: string
  points: Point[]
}

const p = (x: number, y: number): Point => ({ x, y })

export const templates: FlashingTemplate[] = [
  {
    id: "apron",
    code: "APR",
    name: "Apron Flashing",
    summary: "Seals where a sloped roof meets a wall, chimney or parapet.",
    detail:
      "Seals the horizontal intersection where a sloped roof meets a vertical surface (wall, chimney, parapet), preventing water pooling at the base.",
    points: [p(15, 0), p(0, 0), p(0, 100), p(150, 140), p(160, 155)],
  },
  {
    id: "step",
    code: "STP",
    name: "Step Flashing",
    summary: "Staggered L-shaped pieces layered with tiles or shingles along a sidewall.",
    detail:
      "Staggered L-shaped pieces for shingled or tiled roofs alongside a sidewall or chimney, layered with the roofing material, directing water back onto the roof.",
    points: [p(0, 0), p(0, 100), p(100, 100)],
  },
  {
    id: "counter",
    code: "CTR",
    name: "Counter Flashing",
    alias: "Cap flashing",
    summary: "Fixed to the wall above, shielding base flashing from wind-driven rain.",
    detail:
      "Embedded in masonry or fixed to a wall, it hangs down to shield the top edge of base or step flashing from wind-driven rain.",
    points: [p(0, 0), p(25, 0), p(25, 100), p(40, 115)],
  },
  {
    id: "valley",
    code: "VAL",
    name: "Valley Gutter",
    summary: "Wide channel where two roof slopes meet, carrying fast, heavy water.",
    detail:
      "A wide inverted-channel profile where two roof slopes converge into a V, handling high-volume, fast-moving water down to the eaves.",
    points: [p(0, -15), p(10, 0), p(150, 40), p(170, 25), p(190, 40), p(330, 0), p(340, -15)],
  },
  {
    id: "ridge",
    code: "RDG",
    name: "Ridge & Hip Capping",
    summary: "A watertight lid over the peak where two roof planes join.",
    detail:
      "A V-shaped or curved profile at the highest roof peaks, forming a watertight lid over the joint between two roof planes.",
    points: [p(0, 70), p(10, 60), p(150, 0), p(290, 60), p(300, 70)],
  },
  {
    id: "barge",
    code: "BRG",
    name: "Barge Capping",
    alias: "Verge flashing",
    summary: "Wraps the barge board at gable ends, sealing sheet ends from weather.",
    detail:
      "Wraps tightly around the fascia or barge board at exposed gable ends, sealing sheet ends from crosswind and driving rain.",
    points: [p(0, 20), p(0, 0), p(130, 0), p(130, 150), p(115, 160)],
  },
  {
    id: "drip",
    code: "DRP",
    name: "Drip Edge",
    alias: "Gutter apron",
    summary: "Angled strip at the roof's lower edge, guiding water into the gutter.",
    detail:
      "An angled strip along the bottom roof edge, guiding water outward into the gutter and away from the fascia board.",
    points: [p(0, 0), p(100, 15), p(100, 45), p(115, 60)],
  },
]

export function templateById(id: string | null): FlashingTemplate | null {
  return templates.find((template) => template.id === id) ?? null
}
