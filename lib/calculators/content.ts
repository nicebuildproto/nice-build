import type { PercentageMode } from "@/lib/calculators/usePercentage"

export interface PercentagePageContent {
  slug: string
  mode: PercentageMode
  title: string
  description: string
  lede: string
  example: string
  faqs: { question: string; answer: string }[]
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
    example:
      "25 is 12.5% of 200. Separately, 15% of 80 is 12. Use the left card for “what share is this?”, and the right card for “how much is this percent?”",
    faqs: [
      {
        question: "How do I work out “X is what percent of Y”?",
        answer:
          "Divide X by Y, then multiply by 100. If Y is 0, there is no percentage to show — a number cannot be a share of nothing.",
      },
      {
        question: "How do I work out “what is X% of Y”?",
        answer:
          "Multiply Y by X, then divide by 100. 15% of 80 is 80 × 0.15, which is 12.",
      },
      {
        question: "Is this the same as a percentage increase?",
        answer:
          "No. This page answers “what share?” and “how much is this percent?”. To grow or shrink a starting amount, use the increase, decrease, or discount calculators.",
      },
    ],
  },
  increase: {
    slug: "percentage-increase-calculator",
    mode: "increase",
    title: "Percentage Increase Calculator",
    description: "Work out the new amount after a number grows by a percent.",
    lede: "Use this when a price, wage, or metric goes up by a known percent and you need the new total.",
    example:
      "A $50 item increases by 20%. The increase is $10, so the new price is $60. The same steps work for a 4% raise on a $90,000 salary: the rise is $3,600 and the new salary is $93,600.",
    faqs: [
      {
        question: "How do you calculate a percentage increase?",
        answer:
          "Multiply the original amount by the percent, divide by 100, then add that to the original. New amount = original × (1 + percent ÷ 100).",
      },
      {
        question: "Is this the same as “what is X% of Y”?",
        answer:
          "That question only gives the increase itself. This calculator also adds it back, so you see both the rise and the new total.",
      },
      {
        question: "What if I increase twice in a row?",
        answer:
          "Apply the second increase to the new amount, not the original. A 10% rise then another 10% is 21% in total, not 20%.",
      },
    ],
  },
  decrease: {
    slug: "percentage-decrease-calculator",
    mode: "decrease",
    title: "Percentage Decrease Calculator",
    description: "Work out what remains after a number drops by a percent.",
    lede: "Use this for reductions, write-downs, or any total that shrinks by a known percent.",
    example:
      "An $80 bill decreases by 15%. The drop is $12, so $68 remains. The same method works for a 30% fall in website traffic: 10,000 visits becomes 7,000.",
    faqs: [
      {
        question: "How is a decrease different from a discount?",
        answer:
          "The maths is the same. This page is framed around any shrinking number — usage, headcount, inventory — not a shop price tag.",
      },
      {
        question: "Can the result go below zero?",
        answer:
          "A 100% decrease reaches zero. More than 100% goes negative, which is valid for some ledgers and not for quantities. Check the context before you use it.",
      },
      {
        question: "How do I reverse a decrease?",
        answer:
          "You cannot just add the same percent back. After a 20% drop, you need a 25% increase to return to the original, because you are growing from a smaller base.",
      },
    ],
  },
  discount: {
    slug: "discount-calculator",
    mode: "discount",
    title: "Discount Calculator",
    description: "See the sale price and how much you save from a retail discount.",
    lede: "Enter the sticker price and the off-percent to see the sale price and the amount you save at the register.",
    example:
      "A $120 jacket at 25% off. You save $30 and pay $90. If a $64 weekly shop has 10% off, you save $6.40 and pay $57.60.",
    faqs: [
      {
        question: "Is a discount the same as a percentage decrease?",
        answer:
          "Same arithmetic, different job. A discount is always “money off a price”. Use the decrease calculator when the number is not a retail price.",
      },
      {
        question: "How do stacked discounts work?",
        answer:
          "Apply them one after another to the already-reduced price. 20% off, then an extra 10% off, is 28% off in total — not 30%.",
      },
      {
        question: "Does this include GST?",
        answer:
          "No. It only applies the percent you enter to the amount you enter. Add or remove tax first if the sticker price is not the figure you want to discount.",
      },
    ],
  },
}
