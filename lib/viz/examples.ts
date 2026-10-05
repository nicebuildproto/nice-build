import { vizId } from "./id"

export type NamedExample<T> = {
  id: string
  title: string
  description: string
  data: T
}

export type SeriesRow = { id: string; label: string; values: string[] }

export function seriesRow(label: string, values: (string | number)[] | string | number): SeriesRow {
  const list = Array.isArray(values) ? values : [values]
  return { id: vizId(), label, values: list.map(String) }
}

export type FunnelStage = { id: string; label: string; value: string }

export function funnelStage(label: string, value: string | number): FunnelStage {
  return { id: vizId(), label, value: String(value) }
}

export const funnelExamples: NamedExample<FunnelStage[]>[] = [
  {
    id: "marketing",
    title: "Marketing funnel",
    description: "Visits through to a paid plan.",
    data: [
      funnelStage("Visits", 8200),
      funnelStage("Sign-ups", 1640),
      funnelStage("Activated", 738),
      funnelStage("Trial", 295),
      funnelStage("Paid", 88),
    ],
  },
  {
    id: "sales",
    title: "Sales funnel",
    description: "Leads through to closed deals.",
    data: [
      funnelStage("Leads", 420),
      funnelStage("Qualified", 168),
      funnelStage("Proposal", 74),
      funnelStage("Negotiation", 31),
      funnelStage("Won", 18),
    ],
  },
  {
    id: "recruitment",
    title: "Recruitment funnel",
    description: "Applicants through to hired.",
    data: [
      funnelStage("Applicants", 640),
      funnelStage("Screened", 210),
      funnelStage("Interview", 64),
      funnelStage("Offer", 16),
      funnelStage("Hired", 11),
    ],
  },
]

export type GanttTask = {
  id: string
  name: string
  group: string
  start: string
  end: string
  progress: string
  milestone: boolean
  dependsOn: string
}

export function ganttTask(
  name: string,
  start: string,
  end: string,
  extra: Partial<GanttTask> = {}
): GanttTask {
  return {
    id: vizId(),
    name,
    group: extra.group ?? "",
    start,
    end,
    progress: extra.progress ?? "0",
    milestone: extra.milestone ?? false,
    dependsOn: extra.dependsOn ?? "",
  }
}

export const ganttExamples: NamedExample<GanttTask[]>[] = [
  {
    id: "launch",
    title: "Product launch",
    description: "Six weeks from brief to launch day.",
    data: [
      ganttTask("Brief", "2026-10-06", "2026-10-10", { group: "Plan", progress: "100" }),
      ganttTask("Design", "2026-10-11", "2026-10-24", { group: "Make", progress: "60", dependsOn: "Brief" }),
      ganttTask("Build", "2026-10-20", "2026-11-07", { group: "Make", progress: "25", dependsOn: "Design" }),
      ganttTask("QA", "2026-11-04", "2026-11-12", { group: "Ship", progress: "0", dependsOn: "Build" }),
      ganttTask("Launch", "2026-11-13", "2026-11-13", { group: "Ship", milestone: true, progress: "0" }),
    ],
  },
  {
    id: "website",
    title: "Website project",
    description: "Content, design, and a quiet go-live.",
    data: [
      ganttTask("Sitemap", "2026-10-06", "2026-10-09", { group: "Content", progress: "100" }),
      ganttTask("Copy", "2026-10-10", "2026-10-24", { group: "Content", progress: "40" }),
      ganttTask("Visual design", "2026-10-13", "2026-10-31", { group: "Design", progress: "20" }),
      ganttTask("Build pages", "2026-10-27", "2026-11-14", { group: "Build", progress: "0" }),
      ganttTask("Go live", "2026-11-18", "2026-11-18", { group: "Build", milestone: true }),
    ],
  },
  {
    id: "construction",
    title: "Construction project",
    description: "A short residential programme.",
    data: [
      ganttTask("Foundations", "2026-10-06", "2026-10-17", { group: "Site", progress: "80" }),
      ganttTask("Frame", "2026-10-18", "2026-11-06", { group: "Structure", progress: "10" }),
      ganttTask("Lock-up", "2026-11-07", "2026-11-21", { group: "Structure", progress: "0" }),
      ganttTask("Fit-off", "2026-11-22", "2026-12-12", { group: "Finish", progress: "0" }),
      ganttTask("Handover", "2026-12-18", "2026-12-18", { group: "Finish", milestone: true }),
    ],
  },
]

export type GraphNodeType = "start" | "process" | "decision" | "end"

export type GraphNode = {
  id: string
  label: string
  type: GraphNodeType
  x: number
  y: number
}

export type GraphEdge = { id: string; from: string; to: string; label: string }

export type GraphModel = { nodes: GraphNode[]; edges: GraphEdge[] }

export function graphNode(label: string, type: GraphNodeType = "process"): GraphNode {
  return { id: vizId(), label, type, x: 0, y: 0 }
}

export function graphEdge(from: string, to: string, label = ""): GraphEdge {
  return { id: vizId(), from, to, label }
}

function graphFromSteps(
  steps: { label: string; type?: GraphNodeType }[],
  links: [number, number, string?][]
): GraphModel {
  const nodes = steps.map((step) => graphNode(step.label, step.type ?? "process"))
  const edges = links.map(([from, to, label]) => graphEdge(nodes[from].id, nodes[to].id, label ?? ""))
  return { nodes, edges }
}

export const flowchartExamples: NamedExample<GraphModel>[] = [
  {
    id: "approval",
    title: "Approval process",
    description: "A request with a yes/no decision.",
    data: graphFromSteps(
      [
        { label: "Request in", type: "start" },
        { label: "Review", type: "process" },
        { label: "Approved?", type: "decision" },
        { label: "Revise", type: "process" },
        { label: "Sign off", type: "end" },
      ],
      [
        [0, 1],
        [1, 2],
        [2, 4, "Yes"],
        [2, 3, "No"],
        [3, 1],
      ]
    ),
  },
  {
    id: "journey",
    title: "Customer journey",
    description: "From landing page to a paid account.",
    data: graphFromSteps(
      [
        { label: "Land", type: "start" },
        { label: "Browse", type: "process" },
        { label: "Ready?", type: "decision" },
        { label: "Create account", type: "process" },
        { label: "Leave", type: "end" },
        { label: "Subscribe", type: "end" },
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3, "Yes"],
        [2, 4, "No"],
        [3, 5],
      ]
    ),
  },
  {
    id: "workflow",
    title: "Simple workflow",
    description: "Collect, check, ship.",
    data: graphFromSteps(
      [
        { label: "Collect", type: "start" },
        { label: "Check", type: "process" },
        { label: "Issues?", type: "decision" },
        { label: "Fix", type: "process" },
        { label: "Ship", type: "end" },
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3, "Yes"],
        [2, 4, "No"],
        [3, 1],
      ]
    ),
  },
]

export const diagramExamples: NamedExample<GraphModel>[] = [
  {
    id: "process",
    title: "Process flow",
    description: "Brief through to review.",
    data: graphFromSteps(
      [
        { label: "Brief" },
        { label: "Design" },
        { label: "Build" },
        { label: "Review" },
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
      ]
    ),
  },
  {
    id: "team",
    title: "Team structure",
    description: "A small product group.",
    data: graphFromSteps(
      [
        { label: "Product" },
        { label: "Design" },
        { label: "Engineering" },
        { label: "Support" },
      ],
      [
        [0, 1],
        [0, 2],
        [2, 3],
      ]
    ),
  },
  {
    id: "system",
    title: "System relationships",
    description: "App, API, and data.",
    data: graphFromSteps(
      [
        { label: "Web app" },
        { label: "API" },
        { label: "Database" },
        { label: "Queue" },
      ],
      [
        [0, 1],
        [1, 2],
        [1, 3],
      ]
    ),
  },
]

export const barExamples: NamedExample<{ series: string[]; rows: SeriesRow[] }>[] = [
  {
    id: "product",
    title: "Sales by product",
    description: "Units this quarter.",
    data: {
      series: ["Units"],
      rows: [
        seriesRow("Apron", 42),
        seriesRow("Barge", 28),
        seriesRow("Valley", 19),
        seriesRow("Ridge", 33),
        seriesRow("Drip", 14),
      ],
    },
  },
  {
    id: "month",
    title: "Revenue by month",
    description: "Two years, side by side.",
    data: {
      series: ["2025", "2026"],
      rows: [
        seriesRow("Jan", [48, 52]),
        seriesRow("Feb", [44, 57]),
        seriesRow("Mar", [51, 61]),
        seriesRow("Apr", [47, 55]),
        seriesRow("May", [53, 64]),
        seriesRow("Jun", [58, 70]),
      ],
    },
  },
  {
    id: "team",
    title: "Team comparison",
    description: "Tickets closed this month.",
    data: {
      series: ["Closed"],
      rows: [
        seriesRow("Design", 18),
        seriesRow("Build", 31),
        seriesRow("Support", 24),
        seriesRow("Sales", 12),
      ],
    },
  },
]

export const lineExamples: NamedExample<{ series: string[]; rows: SeriesRow[] }>[] = [
  {
    id: "revenue",
    title: "Revenue over time",
    description: "Monthly revenue for two years.",
    data: {
      series: ["2025", "2026"],
      rows: [
        seriesRow("Jan", [120, 138]),
        seriesRow("Feb", [116, 142]),
        seriesRow("Mar", [128, 151]),
        seriesRow("Apr", [121, 147]),
        seriesRow("May", [134, 160]),
        seriesRow("Jun", [141, 168]),
      ],
    },
  },
  {
    id: "traffic",
    title: "Website traffic",
    description: "Weekly visits.",
    data: {
      series: ["Visits"],
      rows: [
        seriesRow("3 Aug", 1840),
        seriesRow("10 Aug", 2012),
        seriesRow("17 Aug", 1766),
        seriesRow("24 Aug", 2210),
        seriesRow("31 Aug", 2384),
        seriesRow("7 Sep", 2195),
      ],
    },
  },
  {
    id: "temp",
    title: "Temperature",
    description: "Daily highs in Adelaide.",
    data: {
      series: ["°C"],
      rows: [
        seriesRow("Mon", 18),
        seriesRow("Tue", 21),
        seriesRow("Wed", 19),
        seriesRow("Thu", 24),
        seriesRow("Fri", 27),
        seriesRow("Sat", 23),
        seriesRow("Sun", 20),
      ],
    },
  },
]

export const pieExamples: NamedExample<{ series: string[]; rows: SeriesRow[] }>[] = [
  {
    id: "budget",
    title: "Budget breakdown",
    description: "Where this month’s spend goes.",
    data: {
      series: ["Amount"],
      rows: [
        seriesRow("People", 48),
        seriesRow("Tools", 18),
        seriesRow("Office", 12),
        seriesRow("Ads", 14),
        seriesRow("Other", 8),
      ],
    },
  },
  {
    id: "sources",
    title: "Traffic sources",
    description: "How people found the site.",
    data: {
      series: ["Share"],
      rows: [
        seriesRow("Search", 46),
        seriesRow("Direct", 22),
        seriesRow("Referral", 16),
        seriesRow("Email", 10),
        seriesRow("Social", 6),
      ],
    },
  },
  {
    id: "share",
    title: "Market share",
    description: "A simple category split.",
    data: {
      series: ["Share"],
      rows: [
        seriesRow("Us", 34),
        seriesRow("A", 28),
        seriesRow("B", 21),
        seriesRow("Others", 17),
      ],
    },
  },
]

export type TimelineEvent = {
  id: string
  date: string
  title: string
  description: string
  category: string
}

export function timelineEvent(
  date: string,
  title: string,
  extra: Partial<TimelineEvent> = {}
): TimelineEvent {
  return {
    id: vizId(),
    date,
    title,
    description: extra.description ?? "",
    category: extra.category ?? "",
  }
}

export const timelineExamples: NamedExample<TimelineEvent[]>[] = [
  {
    id: "milestones",
    title: "Project milestones",
    description: "A year of shipping.",
    data: [
      timelineEvent("Q1 2026", "Kick-off", { description: "Team and brief locked.", category: "Plan" }),
      timelineEvent("March 2026", "Private beta", { description: "First customers in.", category: "Build" }),
      timelineEvent("10 June 2026", "Public launch", { description: "Site went live.", category: "Ship" }),
      timelineEvent("Q3 2026", "Second market", { description: "Opened AU + NZ.", category: "Grow" }),
    ],
  },
  {
    id: "history",
    title: "Product history",
    description: "How the product grew.",
    data: [
      timelineEvent("2023", "First sketch"),
      timelineEvent("2024", "Prototype"),
      timelineEvent("Q2 2025", "Paid pilot"),
      timelineEvent("2026", "Nice Tools"),
    ],
  },
  {
    id: "roadmap",
    title: "Roadmap",
    description: "What is coming next.",
    data: [
      timelineEvent("Oct 2026", "Charts", { description: "Data visualization family." }),
      timelineEvent("Q4 2026", "Export pack", { description: "Cleaner PNG and SVG." }),
      timelineEvent("Q1 2027", "Templates", { description: "More starting points." }),
    ],
  },
]

export type ScatterPoint = { id: string; x: string; y: string; series: string; label: string }

export function scatterPoint(x: string | number, y: string | number, series = "Series 1", label = ""): ScatterPoint {
  return { id: vizId(), x: String(x), y: String(y), series, label }
}

export const scatterExamples: NamedExample<ScatterPoint[]>[] = [
  {
    id: "height-weight",
    title: "Height and score",
    description: "Two series of related measurements.",
    data: [
      scatterPoint(162, 58, "Team A", "Ada"),
      scatterPoint(171, 64, "Team A", "Bo"),
      scatterPoint(168, 61, "Team A", "Cam"),
      scatterPoint(176, 72, "Team A", "Dee"),
      scatterPoint(159, 54, "Team B", "Eve"),
      scatterPoint(180, 78, "Team B", "Fay"),
      scatterPoint(174, 70, "Team B", "Gus"),
      scatterPoint(166, 60, "Team B", "Han"),
    ],
  },
  {
    id: "spend",
    title: "Spend vs conversion",
    description: "Campaigns on two channels.",
    data: [
      scatterPoint(120, 2.1, "Search", "Brand"),
      scatterPoint(340, 4.8, "Search", "Generic"),
      scatterPoint(90, 1.4, "Search", "Competitor"),
      scatterPoint(210, 3.2, "Social", "Awareness"),
      scatterPoint(160, 2.6, "Social", "Retarget"),
      scatterPoint(280, 3.9, "Social", "Launch"),
    ],
  },
]

export type WaterfallRow = { id: string; label: string; value: string; kind: "relative" | "total" }

export function waterfallRow(label: string, value: string | number, kind: "relative" | "total" = "relative"): WaterfallRow {
  return { id: vizId(), label, value: String(value), kind }
}

export const waterfallExamples: NamedExample<WaterfallRow[]>[] = [
  {
    id: "pl",
    title: "Monthly P&L",
    description: "Opening cash through to closing.",
    data: [
      waterfallRow("Opening", 120, "total"),
      waterfallRow("Sales", 64),
      waterfallRow("Refunds", -12),
      waterfallRow("Costs", -28),
      waterfallRow("Closing", 144, "total"),
    ],
  },
  {
    id: "headcount",
    title: "Headcount bridge",
    description: "Starts, leavers, and the ending total.",
    data: [
      waterfallRow("Start of year", 42, "total"),
      waterfallRow("Hires", 11),
      waterfallRow("Leavers", -6),
      waterfallRow("Transfers in", 2),
      waterfallRow("End of year", 49, "total"),
    ],
  },
]
