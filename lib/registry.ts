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

export const categories: { key: Category; label: string; description: string }[] = [
  { key: "calculators", label: "Calculators", description: "Quick, clean calculations for everyday numbers." },
  { key: "developer", label: "Developer Tools", description: "Formatters, converters, and generators for building software." },
  { key: "files-media", label: "Files & Media", description: "Convert, compress, and clean up files and images." },
  { key: "design-creative", label: "Design & Creative", description: "Colour, gradient, and visual tools for designers." },
  { key: "data-viz", label: "Data Visualization", description: "Turn data into clean, shareable diagrams and charts." },
  { key: "business", label: "Business Tools", description: "Invoices, quotes, and everyday business calculations." },
  { key: "home-trade", label: "Home & Trade", description: "Material estimates and tools for building and renovating." },
  { key: "people-teams", label: "People & Teams", description: "Understand how you and your team actually work." },
  { key: "text-tools", label: "Text Tools", description: "Count, clean, and compare text." },
  { key: "everyday-fun", label: "Everyday & Fun", description: "Small, useful tools for everyday moments." },
]

export const registry: ToolEntry[] = [
  {
    slug: "percentage-calculator",
    category: "calculators",
    title: "Percentage Calculator",
    description: "Find what percent one number is of another, or take a percentage of a number.",
    route: "/percentage-calculator",
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
    route: "/tip-calculator",
    status: "coming-soon",
    tags: ["tip", "bill", "split"],
  },
  {
    slug: "json-formatter",
    category: "developer",
    title: "JSON Formatter",
    description: "Pretty-print, minify, and validate JSON in the browser.",
    route: "/json-formatter",
    status: "coming-soon",
    featured: true,
    tags: ["json", "format", "validate"],
  },
  {
    slug: "uuid-generator",
    category: "developer",
    title: "UUID Generator",
    description: "Generate unique identifiers for APIs, databases, and tests.",
    route: "/uuid-generator",
    status: "coming-soon",
    featured: true,
    tags: ["uuid", "id", "generator"],
  },
  {
    slug: "regex-tester",
    category: "developer",
    title: "Regex Tester",
    description: "Try a regular expression against sample text and see the matches.",
    route: "/regex-tester",
    status: "coming-soon",
    tags: ["regex", "pattern", "match"],
  },
  {
    slug: "image-compressor",
    category: "files-media",
    title: "Image Compressor",
    description: "Shrink image files without sending them to a server.",
    route: "/image-compressor",
    status: "coming-soon",
    featured: true,
    tags: ["image", "compress", "jpg", "png"],
  },
  {
    slug: "pdf-merger",
    category: "files-media",
    title: "PDF Merger",
    description: "Combine several PDFs into one file.",
    route: "/pdf-merger",
    status: "coming-soon",
    featured: true,
    tags: ["pdf", "merge", "files"],
  },
  {
    slug: "exif-stripper",
    category: "files-media",
    title: "EXIF Stripper",
    description: "Remove location and camera metadata from photos.",
    route: "/exif-stripper",
    status: "coming-soon",
    tags: ["exif", "privacy", "photo"],
  },
  {
    slug: "sankey-generator",
    category: "design-creative",
    title: "Sankey Diagram Generator",
    description: "Create clear, beautiful Sankey diagrams from your data.",
    route: "/sankey-generator",
    status: "live",
    featured: true,
    tags: ["sankey", "diagram", "flow", "chart"],
  },
  {
    slug: "colour-palette-generator",
    category: "design-creative",
    title: "Colour Palette Generator",
    description: "Build a small, usable palette from a starting colour.",
    route: "/colour-palette-generator",
    status: "coming-soon",
    featured: true,
    tags: ["colour", "palette", "hex"],
  },
  {
    slug: "contrast-checker",
    category: "design-creative",
    title: "Contrast Checker",
    description: "Check text and background contrast against WCAG.",
    route: "/contrast-checker",
    status: "coming-soon",
    featured: true,
    tags: ["contrast", "a11y", "colour"],
  },
  {
    slug: "gradient-generator",
    category: "design-creative",
    title: "Gradient Generator",
    description: "Mix a CSS gradient and copy the code.",
    route: "/gradient-generator",
    status: "coming-soon",
    tags: ["gradient", "css", "colour"],
  },
  {
    slug: "funnel-chart",
    category: "data-viz",
    title: "Funnel Chart",
    description: "Show drop-off across a simple conversion funnel.",
    route: "/funnel-chart",
    status: "coming-soon",
    featured: true,
    tags: ["funnel", "chart", "conversion"],
  },
  {
    slug: "gantt-chart",
    category: "data-viz",
    title: "Gantt Chart",
    description: "Lay a short project timeline out as a Gantt chart.",
    route: "/gantt-chart",
    status: "coming-soon",
    tags: ["gantt", "timeline", "project"],
  },
  {
    slug: "invoice-generator",
    category: "business",
    title: "Invoice Generator",
    description: "Create a clean invoice and export it as a PDF.",
    route: "/invoice-generator",
    status: "coming-soon",
    featured: true,
    tags: ["invoice", "pdf", "billing"],
  },
  {
    slug: "quote-builder",
    category: "business",
    title: "Quote Builder",
    description: "Price a job and send a simple quote.",
    route: "/quote-builder",
    status: "coming-soon",
    featured: true,
    tags: ["quote", "estimate", "price"],
  },
  {
    slug: "margin-calculator",
    category: "business",
    title: "Margin Calculator",
    description: "Turn cost and sell price into margin and markup.",
    route: "/margin-calculator",
    status: "coming-soon",
    tags: ["margin", "markup", "price"],
  },
  {
    slug: "flashing-designer",
    category: "home-trade",
    title: "Flashing Designer",
    description: "Design a custom flashing profile and get an instant price.",
    route: "/flashing-designer",
    status: "live",
    featured: true,
    tags: ["flashing", "metal", "building"],
  },
  {
    slug: "paint-calculator",
    category: "home-trade",
    title: "Paint Calculator",
    description: "Estimate how much paint a room needs.",
    route: "/paint-calculator",
    status: "coming-soon",
    featured: true,
    tags: ["paint", "room", "estimate"],
  },
  {
    slug: "material-estimator",
    category: "home-trade",
    title: "Material Estimator",
    description: "Ballpark timber, plaster, and sheet quantities from a few measurements.",
    route: "/material-estimator",
    status: "coming-soon",
    tags: ["materials", "estimate", "trade"],
  },
  {
    slug: "work-style",
    category: "people-teams",
    title: "Work Style Quiz",
    description: "Find out how you and your team actually work.",
    route: "/work-style",
    status: "coming-soon",
    featured: true,
    tags: ["quiz", "team", "work"],
  },
  {
    slug: "meeting-cost",
    category: "people-teams",
    title: "Meeting Cost Calculator",
    description: "See what a recurring meeting actually costs in time and money.",
    route: "/meeting-cost",
    status: "coming-soon",
    featured: true,
    tags: ["meeting", "cost", "time"],
  },
  {
    slug: "raci-generator",
    category: "people-teams",
    title: "RACI Generator",
    description: "Assign who is responsible, accountable, consulted, and informed.",
    route: "/raci-generator",
    status: "coming-soon",
    tags: ["raci", "roles", "team"],
  },
  {
    slug: "word-counter",
    category: "text-tools",
    title: "Word Counter",
    description: "Count words, characters, and reading time as you type.",
    route: "/word-counter",
    status: "coming-soon",
    featured: true,
    tags: ["words", "count", "writing"],
  },
  {
    slug: "diff-checker",
    category: "text-tools",
    title: "Diff Checker",
    description: "Compare two blocks of text and highlight the changes.",
    route: "/diff-checker",
    status: "coming-soon",
    featured: true,
    tags: ["diff", "compare", "text"],
  },
  {
    slug: "case-converter",
    category: "text-tools",
    title: "Case Converter",
    description: "Switch text between sentence, title, upper, and lower case.",
    route: "/case-converter",
    status: "coming-soon",
    tags: ["case", "text", "convert"],
  },
  {
    slug: "age-calculator",
    category: "everyday-fun",
    title: "Age Calculator",
    description: "Work out exact age from a date of birth.",
    route: "/age-calculator",
    status: "coming-soon",
    featured: true,
    tags: ["age", "date", "birthday"],
  },
  {
    slug: "countdown",
    category: "everyday-fun",
    title: "Countdown",
    description: "Count down to a date, launch, or deadline.",
    route: "/countdown",
    status: "coming-soon",
    featured: true,
    tags: ["countdown", "date", "timer"],
  },
  {
    slug: "name-picker",
    category: "everyday-fun",
    title: "Name Picker",
    description: "Draw a name from a list, fairly and without fuss.",
    route: "/name-picker",
    status: "coming-soon",
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
    const haystack = [tool.title, tool.description, ...(tool.tags ?? [])]
      .join(" ")
      .toLowerCase()
    return haystack.includes(needle)
  })
}
