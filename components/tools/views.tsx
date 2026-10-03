import {
  BarChartGenerator,
  DiagramGenerator,
  FlowchartGenerator,
  LineChartGenerator,
  PieChartGenerator,
  TimelineGenerator,
} from "@/components/tools/charts"
import { ColourPalette, ContrastChecker, GradientGenerator } from "@/components/tools/colour"
import { JsonFormatter, RegexTester, UuidGenerator } from "@/components/tools/developer"
import { InvoiceGenerator, QuoteBuilder } from "@/components/tools/documents"
import { Countdown, NamePicker } from "@/components/tools/everyday"
import { ExifStripper, ImageCompressor } from "@/components/tools/files"
import {
  FaviconGenerator,
  ImageCropper,
  ImageResizer,
  ImageToBase64,
  JpgToPng,
  PngToJpg,
  SvgToPng,
  WebpToJpg,
} from "@/components/tools/media"
import {
  AgeCalculator,
  MarginCalculator,
  MaterialEstimator,
  MeetingCost,
  PaintCalculator,
  TipCalculator,
} from "@/components/tools/numbers"
import { CoverLetterGenerator, ReceiptGenerator, ResumeBuilder } from "@/components/tools/papers"
import { RaciGenerator, WorkStyleQuiz } from "@/components/tools/people"
import {
  BitcoinHalvingCountdown,
  CookingTimer,
  CpsTest,
  DeadZoneTester,
  GamepadTester,
  KeyboardTester,
  MarkdownPreview,
  MouseTester,
  QrCodeGenerator,
  ReactionTimeTest,
  RefreshRateTester,
  ScreenPpiCalculator,
  StopwatchTool,
  WheelSpinner,
  WorldClock,
} from "@/components/tools/play"
import { BoundSpec } from "@/components/tools/SpecTool"
import { CaseConverter, DiffChecker, WordCounter } from "@/components/tools/text"
import { FunnelChart, GanttChart } from "@/components/tools/viz"
import { toolSpecs } from "@/lib/tools/specs"
import type { ComponentType } from "react"

function specView(slug: string): ComponentType {
  return function SpecView() {
    return <BoundSpec slug={slug} />
  }
}

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
  "image-resizer": { View: ImageResizer, width: "tool" },
  "image-cropper": { View: ImageCropper, width: "tool" },
  "jpg-to-png": { View: JpgToPng, width: "tool" },
  "png-to-jpg": { View: PngToJpg, width: "tool" },
  "webp-to-jpg": { View: WebpToJpg, width: "tool" },
  "svg-to-png": { View: SvgToPng, width: "tool" },
  "image-to-base64": { View: ImageToBase64, width: "tool" },
  "favicon-generator": { View: FaviconGenerator },
  "qr-code-generator": { View: QrCodeGenerator },
  "flowchart-generator": { View: FlowchartGenerator, width: "tool" },
  "bar-chart-generator": { View: BarChartGenerator, width: "tool" },
  "line-chart-generator": { View: LineChartGenerator, width: "tool" },
  "pie-chart-generator": { View: PieChartGenerator, width: "tool" },
  "timeline-generator": { View: TimelineGenerator, width: "tool" },
  "diagram-generator": { View: DiagramGenerator, width: "tool" },
  "resume-builder": { View: ResumeBuilder, width: "tool" },
  "cover-letter-generator": { View: CoverLetterGenerator, width: "tool" },
  "receipt-generator": { View: ReceiptGenerator, width: "tool" },
  "markdown-preview": { View: MarkdownPreview, width: "tool" },
  "wheel-spinner": { View: WheelSpinner },
  stopwatch: { View: StopwatchTool },
  "cooking-timer": { View: CookingTimer },
  "world-clock": { View: WorldClock },
  "gamepad-tester": { View: GamepadTester, width: "tool" },
  "keyboard-tester": { View: KeyboardTester, width: "tool" },
  "mouse-tester": { View: MouseTester, width: "tool" },
  "reaction-time": { View: ReactionTimeTest },
  "cps-test": { View: CpsTest },
  "refresh-rate-tester": { View: RefreshRateTester },
  "dead-zone-tester": { View: DeadZoneTester },
  "screen-ppi-calculator": { View: ScreenPpiCalculator },
  "bitcoin-halving-countdown": { View: BitcoinHalvingCountdown },
}

for (const [slug, spec] of Object.entries(toolSpecs)) {
  if (toolViews[slug]) continue
  toolViews[slug] = { View: specView(slug), width: spec.wide ? "tool" : "narrow" }
}
