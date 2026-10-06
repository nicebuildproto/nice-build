import { libraryTools } from "./tools/library"

export type ToolStatus = "live" | "coming-soon"

export type Category =
  | "calculators"
  | "developer"
  | "files-media"
  | "design-creative"
  | "data-viz"
  | "business"
  | "home-trade"
  | "people-teams"
  | "text-tools"
  | "everyday-fun"
  | "gaming-hardware"
  | "crypto"
  | "creator"
  | "ai-tools"

export interface ToolEntry {
  slug: string
  category: Category
  title: string
  description: string
  route: string
  status: ToolStatus
  featured?: boolean
  cluster?: string
  tags?: string[]
  seoTitle?: string
  related?: string[]
}

export type CategoryIcon =
  | "Calculator"
  | "Code2"
  | "FileStack"
  | "Palette"
  | "BarChart3"
  | "Briefcase"
  | "Hammer"
  | "Users"
  | "Type"
  | "Sparkles"
  | "Gamepad2"
  | "Bitcoin"
  | "Video"
  | "Bot"

export const categories: { key: Category; label: string; description: string; icon: CategoryIcon }[] = [
  { key: "calculators", label: "Calculators", description: "Everyday maths — percentages, loans, pay, and more. Type the numbers and we'll do the rest.", icon: "Calculator" },
  { key: "developer", label: "Developer Tools", description: "Formatters, converters, and generators that run in your browser. Paste, tweak, copy.", icon: "Code2" },
  { key: "files-media", label: "Files & Media", description: "Compress, convert, merge, sign, and clean up files in your browser. Your files stay on your device.", icon: "FileStack" },
  { key: "design-creative", label: "Design & Creative", description: "Colour palettes, contrast, gradients, and CSS extras you can preview and copy.", icon: "Palette" },
  { key: "data-viz", label: "Data Visualization", description: "Paste a table, get a chart you can export. Funnels, Gantt, bars, lines, pies, scatter, waterfall, timelines, and simple diagrams.", icon: "BarChart3" },
  { key: "business", label: "Business Tools", description: "Invoices, quotes, fees, and margins — the everyday numbers behind running a job.", icon: "Briefcase" },
  { key: "home-trade", label: "Home & Trade", description: "Paint, concrete, tiles, and material quantities for a job — from measurements you already have.", icon: "Hammer" },
  { key: "people-teams", label: "People & Teams", description: "Short tools for how you work together — meetings, roles, and a light work-style quiz.", icon: "Users" },
  { key: "text-tools", label: "Text Tools", description: "Paste text, see the result. Count, convert, clean, and compare — in this browser.", icon: "Type" },
  { key: "everyday-fun", label: "Everyday & Fun", description: "Small helpers for everyday moments — timers, pickers, dice, and a bit of play.", icon: "Sparkles" },
  { key: "gaming-hardware", label: "Gaming & Hardware", description: "Test a controller, check a click, or convert the numbers players actually use.", icon: "Gamepad2" },
  { key: "crypto", label: "Crypto", description: "A free momentum scanner plus calculators for profit, position size, and staking. No wallet connection.", icon: "Bitcoin" },
  { key: "creator", label: "Creator Tools", description: "Rates, posting windows, and small utilities for publishing — starting points, not promises.", icon: "Video" },
  { key: "ai-tools", label: "AI Tools", description: "Token counts, prompt notes, and cost estimates from published prices you can check yourself.", icon: "Bot" },
]

// Every tool lives at /[category]/[slug]. Add new tools on that path.
export const registry: ToolEntry[] = [
  {
    slug: "percentage-calculator",
    category: "calculators",
    title: "Percentage Calculator",
    description: "Find what percent one number is of another, or take a percentage of a number. Results update as you type.",
    route: "/calculators/percentage-calculator",
    status: "live",
    featured: true,
    cluster: "percentage",
    tags: ["percent", "maths", "ratio"],
  },
  {
    slug: "percentage-increase-calculator",
    category: "calculators",
    title: "Percentage Increase Calculator",
    description: "Increase a number by a percent, or find the percentage increase between two numbers.",
    route: "/calculators/percentage-increase-calculator",
    status: "live",
    featured: true,
    cluster: "percentage",
    tags: ["percent", "increase", "growth"],
  },
  {
    slug: "percentage-decrease-calculator",
    category: "calculators",
    title: "Percentage Decrease Calculator",
    description: "Decrease a number by a percent, or find the percentage decrease between two numbers.",
    route: "/calculators/percentage-decrease-calculator",
    status: "live",
    cluster: "percentage",
    tags: ["percent", "decrease", "reduction"],
  },
  {
    slug: "discount-calculator",
    category: "calculators",
    title: "Discount Calculator",
    description: "Work out the sale price and how much you save from a percent off.",
    route: "/calculators/discount-calculator",
    status: "live",
    featured: true,
    cluster: "percentage",
    tags: ["percent", "discount", "sale", "retail"],
  },
  {
    slug: "tip-calculator",
    category: "calculators",
    title: "Tip Calculator",
    description: "Work out the tip, the total, and each person's share of the bill.",
    route: "/calculators/tip-calculator",
    status: "live",
    cluster: "percentage",
    tags: ["tip", "bill", "split"],
  },
  {
    slug: "json-formatter",
    category: "developer",
    title: "JSON Formatter",
    description: "Pretty-print, minify, and validate JSON in your browser. Nothing is uploaded.",
    route: "/developer/json-formatter",
    status: "live",
    featured: true,
    cluster: "json",
    seoTitle: "JSON Formatter",
    tags: ["json", "formatter", "beautifier", "pretty print", "validate", "minify"],
  },
  {
    slug: "uuid-generator",
    category: "developer",
    title: "UUID Generator",
    description: "Generate UUID v4 or v7 identifiers — one, or a list to copy and download.",
    route: "/developer/uuid-generator",
    status: "live",
    featured: true,
    cluster: "ids",
    seoTitle: "UUID Generator",
    tags: ["uuid", "guid", "generator", "v4", "v7"],
  },
  {
    slug: "regex-tester",
    category: "developer",
    title: "Regex Tester",
    description: "Test a JavaScript regular expression against sample text. See matches, groups, and positions.",
    route: "/developer/regex-tester",
    status: "live",
    featured: true,
    cluster: "json",
    seoTitle: "Regex Tester",
    tags: ["regex", "regular expression", "tester", "match", "javascript"],
  },
  {
    slug: "image-compressor",
    category: "files-media",
    title: "Image Compressor",
    description: "Compress a JPG or PNG in your browser and download a smaller JPEG. Your files stay on your device.",
    route: "/files-media/image-compressor",
    status: "live",
    featured: true,
    seoTitle: "Image Compressor",
    tags: ["compress image", "compress jpg", "compress png", "image compressor"],
    related: ["image-resizer", "png-to-jpg", "exif-stripper", "jpg-to-png"],
  },
  {
    slug: "pdf-merger",
    category: "files-media",
    title: "PDF Merger",
    description: "Merge PDFs in your browser, reorder the files, and download one document. Your files stay on your device.",
    route: "/files-media/pdf-merger",
    status: "live",
    featured: true,
    seoTitle: "PDF Merger",
    tags: ["merge pdf", "combine pdf", "pdf merger", "join pdf"],
    related: ["pdf-signer", "pdf-to-text", "pdf-ocr"],
  },
  {
    slug: "exif-stripper",
    category: "files-media",
    title: "EXIF Stripper",
    description: "Remove location and camera metadata from a photo in your browser. You download a new JPEG — the original stays put.",
    route: "/files-media/exif-stripper",
    status: "live",
    seoTitle: "Remove EXIF Data",
    tags: ["remove exif", "strip metadata", "photo privacy", "gps"],
    related: ["image-compressor", "image-cropper", "screenshot-annotator"],
  },
  {
    slug: "sankey-generator",
    category: "design-creative",
    title: "Sankey Diagram Generator",
    description: "Turn a table of flows into a Sankey diagram you can export as SVG or PNG.",
    route: "/design-creative/sankey-generator",
    status: "live",
    featured: true,
    tags: ["sankey", "diagram", "flow", "chart"],
  },
  {
    slug: "colour-palette-generator",
    category: "design-creative",
    title: "Colour Palette Generator",
    description: "Generate a colour palette from a starting colour, then copy hex, RGB, or CSS variables.",
    route: "/design-creative/colour-palette-generator",
    status: "live",
    featured: true,
    cluster: "colour",
    seoTitle: "Colour Palette Generator",
    tags: ["colour", "palette", "hex", "colour scheme", "swatch"],
  },
  {
    slug: "contrast-checker",
    category: "design-creative",
    title: "Contrast Checker",
    description: "Check colour contrast against WCAG AA and AAA. See a live sample, then copy the pair.",
    route: "/design-creative/contrast-checker",
    status: "live",
    featured: true,
    cluster: "colour",
    seoTitle: "Contrast Checker",
    tags: ["contrast", "a11y", "wcag", "accessibility", "colour"],
  },
  {
    slug: "gradient-generator",
    category: "design-creative",
    title: "Gradient Generator",
    description: "Build a CSS linear or radial gradient, preview it, and copy the code.",
    route: "/design-creative/gradient-generator",
    status: "live",
    cluster: "colour",
    seoTitle: "Gradient Generator",
    tags: ["gradient", "css", "linear-gradient", "radial", "background"],
  },
  {
    slug: "funnel-chart",
    category: "data-viz",
    title: "Funnel Chart",
    description: "Show drop-off across a conversion funnel — stages, percents, and the drop — then export it.",
    route: "/data-viz/funnel-chart",
    status: "live",
    featured: true,
    tags: ["funnel", "chart", "conversion"],
  },
  {
    slug: "gantt-chart",
    category: "data-viz",
    title: "Gantt Chart",
    description: "Lay tasks on a timeline as a Gantt chart — dates, progress, and a today marker.",
    route: "/data-viz/gantt-chart",
    status: "live",
    tags: ["gantt", "timeline", "project"],
  },
  {
    slug: "invoice-generator",
    category: "business",
    title: "Invoice Generator",
    description: "Create a professional invoice online. Add your business details, customer, line items and GST, then download or print your invoice.",
    route: "/business/invoice-generator",
    status: "live",
    featured: true,
    cluster: "billing",
    seoTitle: "Invoice Generator",
    tags: ["invoice", "pdf", "gst", "billing"],
  },
  {
    slug: "quote-builder",
    category: "business",
    title: "Quote Builder",
    description: "Create a professional quote online with line items, pricing, GST and customer details. Download or print your quote when you're ready.",
    route: "/business/quote-builder",
    status: "live",
    featured: true,
    cluster: "billing",
    seoTitle: "Quote Builder",
    tags: ["quote", "estimate", "gst", "price"],
  },
  {
    slug: "margin-calculator",
    category: "business",
    title: "Margin Calculator",
    description: "Calculate gross margin, profit and markup from cost and selling price — or work backwards from the margin you want.",
    route: "/business/margin-calculator",
    status: "live",
    cluster: "billing",
    seoTitle: "Margin Calculator",
    tags: ["margin", "markup", "profit", "price"],
  },
  {
    slug: "paint-calculator",
    category: "home-trade",
    title: "Paint Calculator",
    description: "How much paint do you need? Measure the room, set the coats, and get litres plus a tin size to take to the shop.",
    route: "/home-trade/paint-calculator",
    status: "live",
    featured: true,
    seoTitle: "Paint Calculator",
    tags: ["paint", "paint calculator", "how much paint", "litres", "room", "walls"],
    related: ["material-estimator", "drywall-calculator", "tile-calculator", "stud-wall-calculator"],
  },
  {
    slug: "material-estimator",
    category: "home-trade",
    title: "Material Estimator",
    description: "How many plasterboard sheets, timber studs, or flooring packs a job needs — with waste you can see.",
    route: "/home-trade/material-estimator",
    status: "live",
    seoTitle: "Material Estimator",
    tags: ["materials", "plasterboard", "studs", "flooring", "estimate"],
    related: ["paint-calculator", "drywall-calculator", "stud-wall-calculator", "concrete-calculator"],
  },
  {
    slug: "work-style",
    category: "people-teams",
    title: "Work Style Quiz",
    description: "Five questions about how you tend to work. A conversation starter for a team — not a personality type or a hiring test.",
    route: "/people-teams/work-style",
    status: "live",
    featured: true,
    seoTitle: "Work Style Quiz",
    tags: ["work style quiz", "team quiz", "how you work"],
    related: ["raci-generator", "team-working-agreement", "meeting-cost"],
  },
  {
    slug: "meeting-cost",
    category: "people-teams",
    title: "Meeting Cost Calculator",
    description: "See what a recurring meeting costs — one sitting, a month, and a year — from people, rate, and length.",
    route: "/people-teams/meeting-cost",
    status: "live",
    featured: true,
    seoTitle: "Meeting Cost Calculator",
    tags: ["meeting cost", "meeting calculator", "cost of a meeting"],
    related: ["meeting-agenda", "work-style", "one-on-one-agenda"],
  },
  {
    slug: "raci-generator",
    category: "people-teams",
    title: "RACI Generator",
    description: "Build a RACI matrix: who is responsible, accountable, consulted, and informed. Copy or download the grid.",
    route: "/people-teams/raci-generator",
    status: "live",
    seoTitle: "RACI Matrix Generator",
    tags: ["raci", "raci matrix", "responsible accountable", "team roles"],
    related: ["team-working-agreement", "meeting-agenda", "work-style"],
  },
  {
    slug: "word-counter",
    category: "text-tools",
    title: "Word Counter",
    description: "Count words, characters, sentences, and reading time as you type. Select a passage to count just that. Your text stays on your device.",
    route: "/text-tools/word-counter",
    status: "live",
    featured: true,
    seoTitle: "Word Counter",
    tags: ["word count", "character count", "reading time", "online word counter"],
    related: ["character-counter", "reading-time", "readability-checker", "case-converter"],
  },
  {
    slug: "diff-checker",
    category: "text-tools",
    title: "Diff Checker",
    description: "Compare two texts side by side. See added and removed lines — or words — then copy a unified diff. Your text stays on your device.",
    route: "/text-tools/diff-checker",
    status: "live",
    featured: true,
    seoTitle: "Diff Checker",
    tags: ["diff checker", "compare text", "text compare", "line diff"],
    related: ["text-cleaner", "remove-duplicate-lines", "word-counter"],
  },
  {
    slug: "case-converter",
    category: "text-tools",
    title: "Case Converter",
    description: "Convert text to sentence case, Title Case, UPPERCASE, lowercase, camelCase, PascalCase, snake_case, or kebab-case.",
    route: "/text-tools/case-converter",
    status: "live",
    seoTitle: "Case Converter",
    tags: ["case converter", "title case", "uppercase", "camelCase", "snake_case"],
    related: ["slug-generator", "text-cleaner", "word-counter"],
  },
  {
    slug: "dice-roller",
    category: "everyday-fun",
    title: "Dice Roller",
    description: "Roll a handful of dice — tap one to throw it again, or roll the lot.",
    route: "/everyday-fun/dice-roller",
    status: "live",
    featured: true,
    tags: ["dice", "roll", "random", "game"],
  },
  {
    slug: "age-calculator",
    category: "everyday-fun",
    title: "Age Calculator",
    description: "Work out exact age from a date of birth — years, months, and days.",
    route: "/everyday-fun/age-calculator",
    status: "live",
    featured: true,
    tags: ["age", "date", "birthday"],
  },
  {
    slug: "countdown",
    category: "everyday-fun",
    title: "Countdown",
    description: "Count down to a date, launch, or deadline — days, hours, minutes, seconds.",
    route: "/everyday-fun/countdown",
    status: "live",
    featured: true,
    tags: ["countdown", "date", "timer"],
  },
  {
    slug: "name-picker",
    category: "everyday-fun",
    title: "Name Picker",
    description: "Draw a name from a list, fairly and without fuss — optionally remove it after.",
    route: "/everyday-fun/name-picker",
    status: "live",
    tags: ["random", "picker", "names"],
  },
  ...libraryTools,
]

export function isCategory(value: string): value is Category {
  return categories.some((category) => category.key === value)
}

export function getCategory(key: string) {
  return categories.find((category) => category.key === key)
}

export function getToolsByCategory(key: Category) {
  return registry.filter((tool) => tool.category === key)
}

export function getFeaturedTools(key: Category, limit = 3) {
  const tools = getToolsByCategory(key)
  const featured = tools.filter((tool) => tool.featured)
  return (featured.length > 0 ? featured : tools).slice(0, limit)
}

export const homeFeaturedSlugs = [
  "percentage-calculator",
  "crypto-momentum-scanner",
  "sankey-generator",
] as const

export function getHomeFeaturedTools() {
  return homeFeaturedSlugs.flatMap((slug) => {
    const tool = registry.find((entry) => entry.slug === slug)
    return tool?.status === "live" ? [tool] : []
  })
}

export function getToolsByCluster(cluster: string) {
  return registry.filter((tool) => tool.cluster === cluster)
}

export function getLiveTools() {
  return registry.filter((tool) => tool.status === "live")
}

export function searchTools(query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return registry.filter((tool) => {
    const category = getCategory(tool.category)?.label ?? ""
    const haystack = [tool.title, tool.description, category, ...(tool.tags ?? [])]
      .join(" ")
      .toLowerCase()
    return haystack.includes(needle)
  })
}
