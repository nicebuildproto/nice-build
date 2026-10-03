import type { PercentageMode } from "@/lib/calculators/usePercentage"

export interface PercentagePageContent {
  slug: string
  mode: PercentageMode
  title: string
  description: string
  lede: string
}

export const percentagePages: Record<
  "basic" | "increase" | "decrease" | "discount",
  PercentagePageContent
> = {
  basic: {
    slug: "percentage-calculator",
    mode: "basic",
    title: "Percentage Calculator",
    description: "Find what percent one number is of another, or take a percentage of a number.",
    lede: "Two everyday percentage questions, side by side. Results update as you type.",
  },
  increase: {
    slug: "percentage-increase-calculator",
    mode: "increase",
    title: "Percentage Increase Calculator",
    description: "Work out the new amount after a number grows by a percent.",
    lede: "Use this when a price, wage, or metric goes up by a known percent and you need the new total.",
  },
  decrease: {
    slug: "percentage-decrease-calculator",
    mode: "decrease",
    title: "Percentage Decrease Calculator",
    description: "Work out what remains after a number drops by a percent.",
    lede: "Use this for reductions, write-downs, or any total that shrinks by a known percent.",
  },
  discount: {
    slug: "discount-calculator",
    mode: "discount",
    title: "Discount Calculator",
    description: "See the sale price and how much you save from a retail discount.",
    lede: "Enter the sticker price and the off-percent to see the sale price and the amount you save at the register.",
  },
}
