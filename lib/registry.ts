export type ToolStatus = "live" | "coming-soon"

export type Category = "building" | "business" | "data-viz" | "tools"

export interface ToolEntry {
  slug: string
  category: Category
  title: string
  description: string
  route: string
  status: ToolStatus
}

export const categories: { key: Category; label: string }[] = [
  { key: "building", label: "Building" },
  { key: "business", label: "Business & Strategy" },
  { key: "data-viz", label: "Data Visualization" },
  { key: "tools", label: "Everyday Tools" },
]

export const registry: ToolEntry[] = [
  {
    slug: "flashing-designer",
    category: "building",
    title: "Flashing Designer",
    description: "Design a custom flashing profile and get an instant price.",
    route: "/flashing-designer",
    status: "live",
  },
  {
    slug: "work-style",
    category: "business",
    title: "Work Style Quiz",
    description: "Find out how you and your team actually work.",
    route: "/work-style",
    status: "coming-soon",
  },
  {
    slug: "sankey",
    category: "data-viz",
    title: "Sankey Diagram Generator",
    description: "Turn flow data into a clean, shareable Sankey diagram.",
    route: "/sankey",
    status: "coming-soon",
  },
  {
    slug: "percentage-calculator",
    category: "tools",
    title: "Percentage Calculator",
    description: "Quick, clean percentage calculations.",
    route: "/percentage-calculator",
    status: "live",
  },
  {
    slug: "tip-calculator",
    category: "tools",
    title: "Tip Calculator",
    description: "Split the bill and work out the tip, fast.",
    route: "/tip-calculator",
    status: "coming-soon",
  },
]
