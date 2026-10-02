import { ColourPalette, ContrastChecker, GradientGenerator } from "@/components/tools/colour"
import { JsonFormatter, RegexTester, UuidGenerator } from "@/components/tools/developer"
import { InvoiceGenerator, QuoteBuilder } from "@/components/tools/documents"
import { Countdown, NamePicker } from "@/components/tools/everyday"
import { ExifStripper, ImageCompressor } from "@/components/tools/files"
import {
  AgeCalculator,
  MarginCalculator,
  MaterialEstimator,
  MeetingCost,
  PaintCalculator,
  TipCalculator,
} from "@/components/tools/numbers"
import { RaciGenerator, WorkStyleQuiz } from "@/components/tools/people"
import { CaseConverter, DiffChecker, WordCounter } from "@/components/tools/text"
import { FunnelChart, GanttChart } from "@/components/tools/viz"
import type { ComponentType } from "react"

export const toolViews: Record<string, { View: ComponentType; width?: "narrow" | "tool" }> = {
  "tip-calculator": { View: TipCalculator },
  "json-formatter": { View: JsonFormatter, width: "tool" },
  "uuid-generator": { View: UuidGenerator },
  "regex-tester": { View: RegexTester, width: "tool" },
  "image-compressor": { View: ImageCompressor },
  "exif-stripper": { View: ExifStripper },
  "colour-palette-generator": { View: ColourPalette, width: "tool" },
  "contrast-checker": { View: ContrastChecker, width: "tool" },
  "gradient-generator": { View: GradientGenerator, width: "tool" },
  "funnel-chart": { View: FunnelChart, width: "tool" },
  "gantt-chart": { View: GanttChart, width: "tool" },
  "invoice-generator": { View: InvoiceGenerator, width: "tool" },
  "quote-builder": { View: QuoteBuilder, width: "tool" },
  "margin-calculator": { View: MarginCalculator },
  "paint-calculator": { View: PaintCalculator, width: "tool" },
  "material-estimator": { View: MaterialEstimator, width: "tool" },
  "work-style": { View: WorkStyleQuiz },
  "meeting-cost": { View: MeetingCost },
  "raci-generator": { View: RaciGenerator, width: "tool" },
  "word-counter": { View: WordCounter, width: "tool" },
  "diff-checker": { View: DiffChecker, width: "tool" },
  "case-converter": { View: CaseConverter, width: "tool" },
  "age-calculator": { View: AgeCalculator },
  countdown: { View: Countdown },
  "name-picker": { View: NamePicker },
}
