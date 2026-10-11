import { newRow, type SankeyRow } from "@/lib/sankey/types"

function rows(entries: [string, string, string][]): SankeyRow[] {
  return entries.map(([source, target, value]) => ({
    ...newRow(),
    source,
    target,
    value,
  }))
}

export interface SankeyExample {
  id: string
  title: string
  description: string
  rows: SankeyRow[]
}

export const sankeyExamples: SankeyExample[] = [
  {
    id: "launch",
    title: "Launch week",
    description: "Where visits came from, and what people did next.",
    rows: rows([
      ["Search", "Site", "46"],
      ["Social", "Site", "24"],
      ["Email", "Site", "18"],
      ["Site", "Signup", "36"],
      ["Site", "Read", "52"],
      ["Signup", "Trial", "22"],
      ["Signup", "Newsletter", "14"],
    ]),
  },
  {
    id: "revenue",
    title: "Company Revenue",
    description: "How income splits into cost and profit.",
    rows: rows([
      ["Revenue", "Product", "500"],
      ["Revenue", "Services", "300"],
      ["Product", "Costs", "200"],
      ["Product", "Profit", "300"],
      ["Services", "Costs", "150"],
      ["Services", "Profit", "150"],
    ]),
  },
  {
    id: "energy",
    title: "Energy Flow",
    description: "Generation through to homes and industry.",
    rows: rows([
      ["Coal", "Electricity", "40"],
      ["Gas", "Electricity", "35"],
      ["Solar", "Electricity", "25"],
      ["Electricity", "Homes", "45"],
      ["Electricity", "Industry", "30"],
      ["Electricity", "Losses", "25"],
    ]),
  },
  {
    id: "traffic",
    title: "Website Traffic",
    description: "Visits from source through to signup.",
    rows: rows([
      ["Search", "Landing", "420"],
      ["Social", "Landing", "180"],
      ["Direct", "Landing", "140"],
      ["Landing", "Product", "480"],
      ["Landing", "Bounce", "260"],
      ["Product", "Signup", "190"],
      ["Product", "Leave", "290"],
    ]),
  },
  {
    id: "budget",
    title: "Budget Breakdown",
    description: "A household budget from income to leftover.",
    rows: rows([
      ["Income", "Housing", "22"],
      ["Income", "Food", "8"],
      ["Income", "Transport", "5"],
      ["Income", "Savings", "6"],
      ["Income", "Other", "4"],
      ["Housing", "Rent", "18"],
      ["Housing", "Utilities", "4"],
    ]),
  },
  {
    id: "journey",
    title: "Customer Journey",
    description: "Awareness through to repeat purchase.",
    rows: rows([
      ["Awareness", "Consider", "1000"],
      ["Awareness", "Ignore", "400"],
      ["Consider", "Trial", "520"],
      ["Consider", "Drop", "480"],
      ["Trial", "Buy", "310"],
      ["Trial", "Churn", "210"],
      ["Buy", "Repeat", "180"],
      ["Buy", "One-off", "130"],
    ]),
  },
]

export const defaultExample = sankeyExamples[0]
