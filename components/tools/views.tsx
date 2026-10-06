import {
  BarChartGenerator,
  DiagramGenerator,
  FlowchartGenerator,
  LineChartGenerator,
  PieChartGenerator,
  ScatterPlotGenerator,
  TimelineGenerator,
  WaterfallChartGenerator,
} from "@/components/tools/charts"
import { ColourPalette, ContrastChecker, GradientGenerator, ColourPicker, HexToRgb, RgbToHex } from "@/components/tools/colour"
import { AspectRatioCalculator, BorderRadiusGenerator, BoxShadowGenerator, PxToRem } from "@/components/tools/css-preview"
import { JsonFormatter, RegexTester, UuidGenerator } from "@/components/tools/developer"
import { BreakEvenCalculator, CommissionCalculator } from "@/components/business/calcs"
import { InvoiceGenerator, QuoteBuilder } from "@/components/business/documents"
import { MarginCalculator } from "@/components/business/margin"
import { ReceiptGenerator } from "@/components/business/receipt"
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
import { AgeCalculator, MeetingCost, TipCalculator } from "@/components/tools/numbers"
import { MaterialEstimator } from "@/components/trade/estimator"
import { PaintCalculator } from "@/components/trade/paint"
import {
  BoardFootCalculator,
  ConcreteCalculator,
  ConstructionEstimateGenerator,
  DeckCalculator,
  DrywallCalculator,
  FenceCalculator,
  GravelCalculator,
  GutterCalculator,
  HvacBtuCalculator,
  MulchCalculator,
  PaverCalculator,
  RoofingCalculator,
  RoofingShingleCalculator,
  RoofPitchCalculator,
  StairStringerCalculator,
  StudWallCalculator,
  TileCalculator,
} from "@/components/trade/calcs"
import { CoverLetterGenerator, ResumeBuilder } from "@/components/tools/papers"
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
import { CryptoDcaBacktest } from "@/components/tools/dca-backtest"
import {
  AiToolFitQuiz,
  BioLinkBuilder,
  BracketGenerator,
  PromptLibrary,
  SocialBatteryCheckin,
  ThreadFormatter,
  ThumbnailPreview,
  TokenCounter,
  UsernameChecker,
} from "@/components/tools/interactive"
import {
  CryptoTaxCalculator,
  ExpenseSplitter,
  LootBoxCalculator,
  ResaleProfitCalculator,
  SideHustleTracker,
  SteamLibraryCalculator,
  SubscriptionAudit,
} from "@/components/tools/ledgers"
import { BoundSpec } from "@/components/tools/SpecTool"
import { CaseConverter, DiffChecker, WordCounter } from "@/components/tools/text"
import { FunnelChart, GanttChart } from "@/components/tools/viz"
import { PdfOcr, PdfSigner, PdfToText } from "@/components/tools/pdf-tools"
import { AudioTrimmer, GifMaker, VideoTrimmer } from "@/components/tools/motion-tools"
import { ScreenshotAnnotator, ScreenshotBeautifier } from "@/components/tools/screenshot-tools"
import { JsonSchemaGenerator } from "@/components/tools/json-schema"
import { PasswordStrengthChecker } from "@/components/tools/password-strength"
import { EmailHeaderAnalyzer } from "@/components/tools/email-headers"
import { CssGridGenerator } from "@/components/tools/css-grid"
import { OpenGraphImageGenerator } from "@/components/tools/og-image"
import { NetWorthCalculator } from "@/components/tools/net-worth"
import { DebtPayoffCalculator } from "@/components/tools/debt-payoff"
import { AiContextWindowCalculator, PromptCostCalculator } from "@/components/tools/ai-cost"
import { FovCalculator } from "@/components/tools/fov"
import { GamingSensitivityCalculator } from "@/components/tools/sensitivity"
import { TimeZoneMeetingPlanner } from "@/components/tools/meeting-planner"
import { CryptoMomentumScanner } from "@/components/tools/crypto-momentum"
import { toolSpecs } from "@/lib/tools/specs"
import type { ComponentType } from "react"

function specView(slug: string): ComponentType {
  return function SpecView() {
    return <BoundSpec slug={slug} />
  }
}

export const toolViews: Record<string, { View: ComponentType; width?: "narrow" | "tool" | "wide" }> = {
  "tip-calculator": { View: TipCalculator },
  "json-formatter": { View: JsonFormatter, width: "tool" },
  "uuid-generator": { View: UuidGenerator, width: "tool" },
  "regex-tester": { View: RegexTester, width: "tool" },
  "image-compressor": { View: ImageCompressor },
  "exif-stripper": { View: ExifStripper },
  "colour-palette-generator": { View: ColourPalette, width: "tool" },
  "contrast-checker": { View: ContrastChecker, width: "tool" },
  "gradient-generator": { View: GradientGenerator, width: "tool" },
  "colour-picker": { View: ColourPicker, width: "tool" },
  "hex-to-rgb": { View: HexToRgb, width: "tool" },
  "rgb-to-hex": { View: RgbToHex, width: "tool" },
  "box-shadow-generator": { View: BoxShadowGenerator, width: "tool" },
  "border-radius-generator": { View: BorderRadiusGenerator, width: "tool" },
  "aspect-ratio-calculator": { View: AspectRatioCalculator, width: "tool" },
  "px-to-rem": { View: PxToRem, width: "tool" },
  "funnel-chart": { View: FunnelChart, width: "wide" },
  "gantt-chart": { View: GanttChart, width: "wide" },
  "invoice-generator": { View: InvoiceGenerator, width: "tool" },
  "quote-builder": { View: QuoteBuilder, width: "tool" },
  "margin-calculator": { View: MarginCalculator, width: "tool" },
  "break-even-calculator": { View: BreakEvenCalculator, width: "tool" },
  "commission-calculator": { View: CommissionCalculator },
  "paint-calculator": { View: PaintCalculator, width: "tool" },
  "material-estimator": { View: MaterialEstimator, width: "tool" },
  "concrete-calculator": { View: ConcreteCalculator, width: "tool" },
  "gravel-calculator": { View: GravelCalculator, width: "tool" },
  "mulch-calculator": { View: MulchCalculator, width: "tool" },
  "roof-pitch-calculator": { View: RoofPitchCalculator, width: "tool" },
  "tile-calculator": { View: TileCalculator, width: "tool" },
  "drywall-calculator": { View: DrywallCalculator, width: "tool" },
  "fence-calculator": { View: FenceCalculator, width: "tool" },
  "deck-calculator": { View: DeckCalculator, width: "tool" },
  "paver-calculator": { View: PaverCalculator, width: "tool" },
  "roofing-calculator": { View: RoofingCalculator, width: "tool" },
  "roofing-shingle-calculator": { View: RoofingShingleCalculator, width: "tool" },
  "gutter-calculator": { View: GutterCalculator, width: "tool" },
  "hvac-btu-calculator": { View: HvacBtuCalculator, width: "tool" },
  "board-foot-calculator": { View: BoardFootCalculator, width: "tool" },
  "stair-stringer-calculator": { View: StairStringerCalculator, width: "tool" },
  "stud-wall-calculator": { View: StudWallCalculator, width: "tool" },
  "construction-estimate-generator": { View: ConstructionEstimateGenerator, width: "tool" },
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
  "favicon-generator": { View: FaviconGenerator, width: "tool" },
  "qr-code-generator": { View: QrCodeGenerator },
  "flowchart-generator": { View: FlowchartGenerator, width: "wide" },
  "bar-chart-generator": { View: BarChartGenerator, width: "wide" },
  "line-chart-generator": { View: LineChartGenerator, width: "wide" },
  "pie-chart-generator": { View: PieChartGenerator, width: "wide" },
  "timeline-generator": { View: TimelineGenerator, width: "wide" },
  "diagram-generator": { View: DiagramGenerator, width: "wide" },
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
  "crypto-momentum-scanner": { View: CryptoMomentumScanner, width: "wide" },
  "crypto-tax-calculator": { View: CryptoTaxCalculator, width: "tool" },
  "crypto-dca-backtest-calculator": { View: CryptoDcaBacktest, width: "tool" },
  "loot-box-calculator": { View: LootBoxCalculator, width: "tool" },
  "library-value-calculator": { View: SteamLibraryCalculator },
  "bracket-generator": { View: BracketGenerator, width: "tool" },
  "thread-formatter": { View: ThreadFormatter, width: "tool" },
  "thumbnail-preview": { View: ThumbnailPreview, width: "tool" },
  "username-checker": { View: UsernameChecker },
  "bio-link-builder": { View: BioLinkBuilder },
  "token-counter": { View: TokenCounter, width: "tool" },
  "prompt-library": { View: PromptLibrary, width: "tool" },
  "subscription-audit-calculator": { View: SubscriptionAudit },
  "expense-splitter": { View: ExpenseSplitter },
  "side-hustle-tracker": { View: SideHustleTracker, width: "tool" },
  "resale-profit-calculator": { View: ResaleProfitCalculator },
  "social-battery-checkin": { View: SocialBatteryCheckin },
  "ai-tool-fit-quiz": { View: AiToolFitQuiz },
  "pdf-signer": { View: PdfSigner, width: "tool" },
  "pdf-ocr": { View: PdfOcr, width: "tool" },
  "pdf-to-text": { View: PdfToText, width: "tool" },
  "gif-maker": { View: GifMaker, width: "tool" },
  "video-trimmer": { View: VideoTrimmer, width: "tool" },
  "audio-trimmer": { View: AudioTrimmer, width: "tool" },
  "screenshot-annotator": { View: ScreenshotAnnotator, width: "wide" },
  "screenshot-beautifier": { View: ScreenshotBeautifier, width: "wide" },
  "json-schema-generator": { View: JsonSchemaGenerator, width: "tool" },
  "password-strength-checker": { View: PasswordStrengthChecker },
  "email-header-analyzer": { View: EmailHeaderAnalyzer, width: "tool" },
  "css-grid-generator": { View: CssGridGenerator, width: "tool" },
  "open-graph-image-generator": { View: OpenGraphImageGenerator, width: "tool" },
  "scatter-plot": { View: ScatterPlotGenerator, width: "wide" },
  "waterfall-chart": { View: WaterfallChartGenerator, width: "wide" },
  "net-worth-calculator": { View: NetWorthCalculator, width: "tool" },
  "debt-payoff-calculator": { View: DebtPayoffCalculator },
  "ai-context-window-calculator": { View: AiContextWindowCalculator, width: "tool" },
  "prompt-cost-calculator": { View: PromptCostCalculator, width: "tool" },
  "fov-calculator": { View: FovCalculator, width: "tool" },
  "sensitivity-converter": { View: GamingSensitivityCalculator, width: "tool" },
  "edpi-calculator": { View: GamingSensitivityCalculator, width: "tool" },
  "time-zone-meeting-planner": { View: TimeZoneMeetingPlanner, width: "wide" },
}

for (const [slug, spec] of Object.entries(toolSpecs)) {
  if (toolViews[slug]) continue
  toolViews[slug] = { View: specView(slug), width: spec.wide ? "tool" : "narrow" }
}
