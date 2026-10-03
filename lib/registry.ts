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

export const categories: { key: Category; label: string; description: string; icon: CategoryIcon }[] = [
  { key: "calculators", label: "Calculators", description: "Quick, clean calculations for everyday numbers.", icon: "Calculator" },
  { key: "developer", label: "Developer Tools", description: "Formatters, converters, and generators for building software.", icon: "Code2" },
  { key: "files-media", label: "Files & Media", description: "Convert, compress, and clean up files and images.", icon: "FileStack" },
  { key: "design-creative", label: "Design & Creative", description: "Colour, gradient, and visual tools for designers.", icon: "Palette" },
  { key: "data-viz", label: "Data Visualization", description: "Turn data into clean, shareable diagrams and charts.", icon: "BarChart3" },
  { key: "business", label: "Business Tools", description: "Invoices, quotes, and everyday business calculations.", icon: "Briefcase" },
  { key: "home-trade", label: "Home & Trade", description: "Material estimates and tools for building and renovating.", icon: "Hammer" },
  { key: "people-teams", label: "People & Teams", description: "Understand how you and your team actually work.", icon: "Users" },
  { key: "text-tools", label: "Text Tools", description: "Count, clean, and compare text.", icon: "Type" },
  { key: "everyday-fun", label: "Everyday & Fun", description: "Small, useful tools for everyday moments.", icon: "Sparkles" },
]

// Every tool lives at /[category]/[slug]. Add new tools on that path.
export const registry: ToolEntry[] = [
  {
    slug: "percentage-calculator",
    category: "calculators",
    title: "Percentage Calculator",
    description: "Find what percent one number is of another, or take a percentage of a number.",
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
    description: "Work out the new amount after a number grows by a percent.",
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
    description: "Work out what remains after a number drops by a percent.",
    route: "/calculators/percentage-decrease-calculator",
    status: "live",
    cluster: "percentage",
    tags: ["percent", "decrease", "reduction"],
  },
  {
    slug: "discount-calculator",
    category: "calculators",
    title: "Discount Calculator",
    description: "See the sale price and how much you save from a retail discount.",
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
    description: "Split the bill and work out the tip, fast.",
    route: "/calculators/tip-calculator",
    status: "live",
    tags: ["tip", "bill", "split"],
  },
  {
    slug: "json-formatter",
    category: "developer",
    title: "JSON Formatter",
    description: "Pretty-print, minify, and validate JSON in the browser.",
    route: "/developer/json-formatter",
    status: "live",
    featured: true,
    tags: ["json", "format", "validate"],
  },
  {
    slug: "uuid-generator",
    category: "developer",
    title: "UUID Generator",
    description: "Generate unique identifiers for APIs, databases, and tests.",
    route: "/developer/uuid-generator",
    status: "live",
    featured: true,
    tags: ["uuid", "id", "generator"],
  },
  {
    slug: "regex-tester",
    category: "developer",
    title: "Regex Tester",
    description: "Try a regular expression against sample text and see the matches.",
    route: "/developer/regex-tester",
    status: "live",
    tags: ["regex", "pattern", "match"],
  },
  {
    slug: "image-compressor",
    category: "files-media",
    title: "Image Compressor",
    description: "Shrink image files without sending them to a server.",
    route: "/files-media/image-compressor",
    status: "live",
    featured: true,
    tags: ["image", "compress", "jpg", "png"],
  },
  {
    slug: "pdf-merger",
    category: "files-media",
    title: "PDF Merger",
    description: "Combine several PDFs into one file.",
    route: "/files-media/pdf-merger",
    status: "coming-soon",
    featured: true,
    tags: ["pdf", "merge", "files"],
  },
  {
    slug: "exif-stripper",
    category: "files-media",
    title: "EXIF Stripper",
    description: "Remove location and camera metadata from photos.",
    route: "/files-media/exif-stripper",
    status: "live",
    tags: ["exif", "privacy", "photo"],
  },
  {
    slug: "sankey-generator",
    category: "design-creative",
    title: "Sankey Diagram Generator",
    description: "Create clear, beautiful Sankey diagrams from your data.",
    route: "/design-creative/sankey-generator",
    status: "live",
    featured: true,
    tags: ["sankey", "diagram", "flow", "chart"],
  },
  {
    slug: "colour-palette-generator",
    category: "design-creative",
    title: "Colour Palette Generator",
    description: "Build a small, usable palette from a starting colour.",
    route: "/design-creative/colour-palette-generator",
    status: "live",
    featured: true,
    tags: ["colour", "palette", "hex"],
  },
  {
    slug: "contrast-checker",
    category: "design-creative",
    title: "Contrast Checker",
    description: "Check text and background contrast against WCAG.",
    route: "/design-creative/contrast-checker",
    status: "live",
    featured: true,
    tags: ["contrast", "a11y", "colour"],
  },
  {
    slug: "gradient-generator",
    category: "design-creative",
    title: "Gradient Generator",
    description: "Mix a CSS gradient and copy the code.",
    route: "/design-creative/gradient-generator",
    status: "live",
    tags: ["gradient", "css", "colour"],
  },
  {
    slug: "funnel-chart",
    category: "data-viz",
    title: "Funnel Chart",
    description: "Show drop-off across a simple conversion funnel.",
    route: "/data-viz/funnel-chart",
    status: "live",
    featured: true,
    tags: ["funnel", "chart", "conversion"],
  },
  {
    slug: "gantt-chart",
    category: "data-viz",
    title: "Gantt Chart",
    description: "Lay a short project timeline out as a Gantt chart.",
    route: "/data-viz/gantt-chart",
    status: "live",
    tags: ["gantt", "timeline", "project"],
  },
  {
    slug: "invoice-generator",
    category: "business",
    title: "Invoice Generator",
    description: "Create a clean invoice and export it as a PDF.",
    route: "/business/invoice-generator",
    status: "live",
    featured: true,
    tags: ["invoice", "pdf", "billing"],
  },
  {
    slug: "quote-builder",
    category: "business",
    title: "Quote Builder",
    description: "Price a job and send a simple quote.",
    route: "/business/quote-builder",
    status: "live",
    featured: true,
    tags: ["quote", "estimate", "price"],
  },
  {
    slug: "margin-calculator",
    category: "business",
    title: "Margin Calculator",
    description: "Turn cost and sell price into margin and markup.",
    route: "/business/margin-calculator",
    status: "live",
    tags: ["margin", "markup", "price"],
  },
  {
    slug: "flashing-designer",
    category: "home-trade",
    title: "Flashing Designer",
    description: "Design a custom flashing profile and get an instant price.",
    route: "/home-trade/flashing-designer",
    status: "live",
    featured: true,
    tags: ["flashing", "metal", "building"],
  },
  {
    slug: "paint-calculator",
    category: "home-trade",
    title: "Paint Calculator",
    description: "Estimate how much paint a room needs.",
    route: "/home-trade/paint-calculator",
    status: "live",
    featured: true,
    tags: ["paint", "room", "estimate"],
  },
  {
    slug: "material-estimator",
    category: "home-trade",
    title: "Material Estimator",
    description: "Ballpark timber, plaster, and sheet quantities from a few measurements.",
    route: "/home-trade/material-estimator",
    status: "live",
    tags: ["materials", "estimate", "trade"],
  },
  {
    slug: "work-style",
    category: "people-teams",
    title: "Work Style Quiz",
    description: "Find out how you and your team actually work.",
    route: "/people-teams/work-style",
    status: "live",
    featured: true,
    tags: ["quiz", "team", "work"],
  },
  {
    slug: "meeting-cost",
    category: "people-teams",
    title: "Meeting Cost Calculator",
    description: "See what a recurring meeting actually costs in time and money.",
    route: "/people-teams/meeting-cost",
    status: "live",
    featured: true,
    tags: ["meeting", "cost", "time"],
  },
  {
    slug: "raci-generator",
    category: "people-teams",
    title: "RACI Generator",
    description: "Assign who is responsible, accountable, consulted, and informed.",
    route: "/people-teams/raci-generator",
    status: "live",
    tags: ["raci", "roles", "team"],
  },
  {
    slug: "word-counter",
    category: "text-tools",
    title: "Word Counter",
    description: "Count words, characters, and reading time as you type.",
    route: "/text-tools/word-counter",
    status: "live",
    featured: true,
    tags: ["words", "count", "writing"],
  },
  {
    slug: "diff-checker",
    category: "text-tools",
    title: "Diff Checker",
    description: "Compare two blocks of text and highlight the changes.",
    route: "/text-tools/diff-checker",
    status: "live",
    featured: true,
    tags: ["diff", "compare", "text"],
  },
  {
    slug: "case-converter",
    category: "text-tools",
    title: "Case Converter",
    description: "Switch text between sentence, title, upper, and lower case.",
    route: "/text-tools/case-converter",
    status: "live",
    tags: ["case", "text", "convert"],
  },
  {
    slug: "dice-roller",
    category: "everyday-fun",
    title: "Dice Roller",
    description: "Roll a handful of dice.",
    route: "/everyday-fun/dice-roller",
    status: "live",
    featured: true,
    tags: ["dice", "roll", "random", "game"],
  },
  {
    slug: "age-calculator",
    category: "everyday-fun",
    title: "Age Calculator",
    description: "Work out exact age from a date of birth.",
    route: "/everyday-fun/age-calculator",
    status: "live",
    featured: true,
    tags: ["age", "date", "birthday"],
  },
  {
    slug: "countdown",
    category: "everyday-fun",
    title: "Countdown",
    description: "Count down to a date, launch, or deadline.",
    route: "/everyday-fun/countdown",
    status: "live",
    featured: true,
    tags: ["countdown", "date", "timer"],
  },
  {
    slug: "name-picker",
    category: "everyday-fun",
    title: "Name Picker",
    description: "Draw a name from a list, fairly and without fuss.",
    route: "/everyday-fun/name-picker",
    status: "live",
    tags: ["random", "picker", "names"],
  },
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
