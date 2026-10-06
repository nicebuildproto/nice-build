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
  { key: "files-media", label: "Files & Media", description: "Resize, convert, sign, and clean up files in your browser. Your files stay on your device.", icon: "FileStack" },
  { key: "design-creative", label: "Design & Creative", description: "Colour palettes, contrast, gradients, and CSS extras you can preview and copy.", icon: "Palette" },
  { key: "data-viz", label: "Data Visualization", description: "Paste a table, get a chart you can export. Funnels, Gantt, bars, lines, pies, scatter, waterfall, timelines, and simple diagrams.", icon: "BarChart3" },
  { key: "business", label: "Business Tools", description: "Invoices, quotes, fees, and margins — the everyday numbers behind running a job.", icon: "Briefcase" },
  { key: "home-trade", label: "Home & Trade", description: "Material estimates and a flashing designer for jobs around the house or on site.", icon: "Hammer" },
  { key: "people-teams", label: "People & Teams", description: "A few tools for how you work together — meetings, roles, and a light work-style quiz.", icon: "Users" },
  { key: "text-tools", label: "Text Tools", description: "Count, clean, convert, and compare text without sending it anywhere.", icon: "Type" },
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
    description: "Shrink an image in your browser and download the result — the original stays put.",
    route: "/files-media/image-compressor",
    status: "live",
    featured: true,
    tags: ["image", "compress", "jpg", "png"],
  },
  {
    slug: "pdf-merger",
    category: "files-media",
    title: "PDF Merger",
    description: "Combine several PDFs into one file you can download.",
    route: "/files-media/pdf-merger",
    status: "coming-soon",
    featured: true,
    tags: ["pdf", "merge", "files"],
  },
  {
    slug: "exif-stripper",
    category: "files-media",
    title: "EXIF Stripper",
    description: "Strip location and camera metadata from a photo — the download is a new file.",
    route: "/files-media/exif-stripper",
    status: "live",
    tags: ["exif", "privacy", "photo"],
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
    description: "Create a clean invoice and print it — or save it as a PDF from your browser.",
    route: "/business/invoice-generator",
    status: "live",
    featured: true,
    tags: ["invoice", "pdf", "billing"],
  },
  {
    slug: "quote-builder",
    category: "business",
    title: "Quote Builder",
    description: "Price a job, print a simple quote, and send it yourself.",
    route: "/business/quote-builder",
    status: "live",
    featured: true,
    tags: ["quote", "estimate", "price"],
  },
  {
    slug: "margin-calculator",
    category: "business",
    title: "Margin Calculator",
    description: "Turn cost and sell price into profit, margin, and markup.",
    route: "/business/margin-calculator",
    status: "live",
    tags: ["margin", "markup", "price"],
  },
  {
    slug: "flashing-designer",
    category: "home-trade",
    title: "Flashing Designer",
    description: "Design a custom flashing profile, pick a finish, and see the price as you go.",
    route: "/home-trade/flashing-designer",
    status: "live",
    featured: true,
    tags: ["flashing", "metal", "building"],
  },
  {
    slug: "paint-calculator",
    category: "home-trade",
    title: "Paint Calculator",
    description: "Estimate how much paint a room needs from the walls, coats, and coverage on the tin.",
    route: "/home-trade/paint-calculator",
    status: "live",
    featured: true,
    tags: ["paint", "room", "estimate"],
  },
  {
    slug: "material-estimator",
    category: "home-trade",
    title: "Material Estimator",
    description: "Ballpark timber, plaster, and sheet quantities from a few measurements you already have.",
    route: "/home-trade/material-estimator",
    status: "live",
    tags: ["materials", "estimate", "trade"],
  },
  {
    slug: "work-style",
    category: "people-teams",
    title: "Work Style Quiz",
    description: "A short quiz about how you like to work — a conversation starter, not a certificate.",
    route: "/people-teams/work-style",
    status: "live",
    featured: true,
    tags: ["quiz", "team", "work"],
  },
  {
    slug: "meeting-cost",
    category: "people-teams",
    title: "Meeting Cost Calculator",
    description: "See what a recurring meeting actually costs — one sitting, a month, and a year.",
    route: "/people-teams/meeting-cost",
    status: "live",
    featured: true,
    tags: ["meeting", "cost", "time"],
  },
  {
    slug: "raci-generator",
    category: "people-teams",
    title: "RACI Generator",
    description: "Assign who is responsible, accountable, consulted, and informed — then copy the grid.",
    route: "/people-teams/raci-generator",
    status: "live",
    tags: ["raci", "roles", "team"],
  },
  {
    slug: "word-counter",
    category: "text-tools",
    title: "Word Counter",
    description: "Count words, characters, and reading time as you type — nothing leaves the page.",
    route: "/text-tools/word-counter",
    status: "live",
    featured: true,
    tags: ["words", "count", "writing"],
  },
  {
    slug: "diff-checker",
    category: "text-tools",
    title: "Diff Checker",
    description: "Compare two blocks of text and see which lines were added, removed, or changed.",
    route: "/text-tools/diff-checker",
    status: "live",
    featured: true,
    tags: ["diff", "compare", "text"],
  },
  {
    slug: "case-converter",
    category: "text-tools",
    title: "Case Converter",
    description: "Switch text between sentence, title, upper, and lower case in one click.",
    route: "/text-tools/case-converter",
    status: "live",
    tags: ["case", "text", "convert"],
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
