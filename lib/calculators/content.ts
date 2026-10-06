export type PercentageMode = "basic" | "increase" | "decrease" | "discount"

export interface PercentagePageContent {
  slug: string
  mode: PercentageMode
  title: string
  description: string
  lede: string
  keywords: string[]
}

export const percentagePages: Record<PercentageMode, PercentagePageContent> = {
  basic: {
    slug: "percentage-calculator",
    mode: "basic",
    title: "Percentage Calculator",
    description: "Find what percent one number is of another, or take a percentage of a number. Results update as you type.",
    lede: "Calculate percentages quickly and easily.",
    keywords: ["percentage calculator", "what percent of", "percent of a number"],
  },
  increase: {
    slug: "percentage-increase-calculator",
    mode: "increase",
    title: "Percentage Increase Calculator",
    description: "Increase a number by a percent, or find the percentage increase between two numbers.",
    lede: "See the original, the increase, and the new amount.",
    keywords: ["percentage increase", "percent increase calculator", "increase by percent"],
  },
  decrease: {
    slug: "percentage-decrease-calculator",
    mode: "decrease",
    title: "Percentage Decrease Calculator",
    description: "Decrease a number by a percent, or find the percentage decrease between two numbers.",
    lede: "See the original, the amount dropped, and what remains.",
    keywords: ["percentage decrease", "percent decrease calculator", "decrease by percent"],
  },
  discount: {
    slug: "discount-calculator",
    mode: "discount",
    title: "Discount Calculator",
    description: "Work out the sale price and how much you save from a percent off.",
    lede: "Original price, percent off, you save, final price.",
    keywords: ["discount calculator", "percent off", "sale price calculator"],
  },
}
