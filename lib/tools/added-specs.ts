import { money, num, percent } from "@/lib/tools/format"
import { modelPriceMap as apiModels, PRICES_CHECKED } from "@/lib/ai/pricing"
import type { SpecField, SpecResult, ToolSpec } from "@/lib/tools/specs"

const options = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }))

function field(key: string, label: string, kind: SpecField["kind"], value: string, extra: Partial<SpecField> = {}): SpecField {
  return { key, label, kind, default: value, ...extra }
}

const number = (key: string, label: string, value: string, suffix?: string, min: number | null = 0) =>
  field(key, label, "number", value, { suffix, ...(min === null ? {} : { min }) })

const select = (key: string, label: string, value: string, pairs: [string, string][]) =>
  field(key, label, "select", value, { options: options(pairs) })

function read(values: Record<string, string>, key: string) {
  const amount = Number(values[key])
  return Number.isFinite(amount) ? amount : null
}

function sumKeys(values: Record<string, string>, keys: string[]) {
  let total = 0
  for (const key of keys) {
    const amount = read(values, key)
    if (amount === null) return null
    total += amount
  }
  return total
}

type StatPair = [string, string] | [string, string, boolean]

function stats(pairs: StatPair[], extra: Partial<SpecResult> = {}): SpecResult {
  return {
    stats: pairs.map(([label, value, primary]) => ({
      label,
      value,
      ...(primary ? { primary: true } : {}),
    })),
    ...extra,
  }
}

function usd(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "USD" }).format(value)
}

const rateBases: Record<string, number> = {
  "instagram|post": 10,
  "instagram|reel": 20,
  "instagram|video": 25,
  "tiktok|post": 8,
  "tiktok|reel": 15,
  "tiktok|video": 15,
  "youtube|post": 20,
  "youtube|reel": 25,
  "youtube|video": 40,
  "x|post": 5,
  "x|reel": 8,
  "x|video": 12,
  "linkedin|post": 15,
  "linkedin|reel": 20,
  "linkedin|video": 25,
}

const typicalEngagement: Record<string, number> = {
  instagram: 1.5,
  tiktok: 4,
  youtube: 2,
  x: 0.5,
  linkedin: 2,
}

const postWindows: Record<string, string> = {
  instagram: "late morning to early afternoon on a weekday, about 10:00–13:00",
  tiktok: "early evening, about 18:00–21:00, especially mid-week",
  youtube: "early afternoon or early evening, about 14:00–16:00 or 18:00–20:00",
  x: "late morning on a weekday, about 09:00–12:00",
  linkedin: "mid-morning on Tuesday, Wednesday, or Thursday, about 09:00–11:00",
  threads: "late morning, about 10:00–13:00, close to typical Instagram windows",
}

function residentTax2027(income: number) {
  const bands = [
    { up: 18200, rate: 0 },
    { up: 45000, rate: 0.15 },
    { up: 135000, rate: 0.3 },
    { up: 190000, rate: 0.37 },
    { up: Number.POSITIVE_INFINITY, rate: 0.45 },
  ]
  let tax = 0
  let previous = 0
  for (const band of bands) {
    if (income <= previous) break
    const slice = Math.min(income, band.up) - previous
    tax += slice * band.rate
    previous = band.up
  }
  return tax
}

export const addedSpecs: Record<string, ToolSpec> = {
  "pc-build-cost-estimator": {
    intro:
      "Type the price you would actually pay for each part. There is no live price list. The total is the sum of the lines, so leave a part at 0 if you already own it.",
    columns: 2,
    fields: [
      number("gpu", "GPU", "700", "AUD"),
      number("cpu", "CPU", "400", "AUD"),
      number("ram", "RAM", "150", "AUD"),
      number("storage", "Storage", "120", "AUD"),
      number("case", "Case", "110", "AUD"),
      number("psu", "PSU", "130", "AUD"),
      number("monitor", "Monitor", "280", "AUD"),
    ],
    run: (values) => {
      const total = sumKeys(values, ["gpu", "cpu", "ram", "storage", "case", "psu", "monitor"])
      if (total === null) return null
      return stats([["Build total", money(total)]])
    },
  },
  "engagement-rate-calculator": {
    intro:
      "Engagement here is average likes plus average comments, divided by followers. A rough Instagram guide is under 1% quiet, 1–3% ordinary for a larger account, and above 3% strong. Smaller accounts often sit higher, and other platforms use different norms.",
    columns: 3,
    fields: [
      number("followers", "Followers", "12000"),
      number("likes", "Average likes", "240"),
      number("comments", "Average comments", "18"),
    ],
    run: (values) => {
      const followers = read(values, "followers")
      const likes = read(values, "likes")
      const comments = read(values, "comments")
      if (!followers || likes === null || comments === null) return null
      const rate = ((likes + comments) / followers) * 100
      const readAs = rate < 1 ? "Quiet for a large Instagram account." : rate < 3 ? "An ordinary mid range for a larger Instagram account." : "Strong for a larger Instagram account."
      return stats([["Engagement", `${num(rate)}%`]], { note: readAs })
    },
  },
  "best-time-to-post": {
    intro:
      "These windows are general guidance compiled from published industry timing reports, not a reading of your own audience. Pick the platform, the clock you will use, and where the audience is. Test against your own analytics before you treat a window as a rule.",
    columns: 3,
    fields: [
      select("platform", "Platform", "instagram", [
        ["instagram", "Instagram"],
        ["tiktok", "TikTok"],
        ["youtube", "YouTube"],
        ["x", "X"],
        ["linkedin", "LinkedIn"],
        ["threads", "Threads"],
      ]),
      select("timezone", "Timezone", "Australia/Adelaide", [
        ["Australia/Adelaide", "Adelaide"],
        ["Australia/Sydney", "Sydney"],
        ["Australia/Perth", "Perth"],
        ["Pacific/Auckland", "Auckland"],
        ["Europe/London", "London"],
        ["America/New_York", "New York"],
      ]),
      select("region", "Audience region", "Australia", [
        ["Australia", "Australia"],
        ["New Zealand", "New Zealand"],
        ["United Kingdom", "United Kingdom"],
        ["United States", "United States"],
        ["Global", "A mixed global audience"],
      ]),
    ],
    run: (values) => {
      const window = postWindows[values.platform] ?? postWindows.instagram
      const names: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X", linkedin: "LinkedIn", threads: "Threads" }
      const platform = names[values.platform] ?? values.platform
      return {
        text: `${platform}, audience in ${values.region}, clock set to ${values.timezone}: ${window} local time.`,
        note: "General guidance only. It is not personalised to your followers.",
      }
    },
  },
  "rate-card-calculator": {
    intro:
      "This is a starting-point estimate, not a guaranteed rate. It uses a rough dollar amount per 1,000 followers, then nudges that with how your engagement compares with a typical rate for the platform. Quote a range, and change it for usage rights, exclusivity, and production time.",
    columns: 2,
    fields: [
      number("followers", "Followers", "25000"),
      number("engagement", "Engagement rate", "2.4", "%"),
      select("platform", "Platform", "instagram", [
        ["instagram", "Instagram"],
        ["tiktok", "TikTok"],
        ["youtube", "YouTube"],
        ["x", "X"],
        ["linkedin", "LinkedIn"],
      ]),
      select("content", "Content type", "reel", [
        ["post", "Post"],
        ["reel", "Reel"],
        ["video", "Video"],
      ]),
    ],
    run: (values) => {
      const followers = read(values, "followers")
      const engagement = read(values, "engagement")
      if (followers === null || engagement === null) return null
      const base = rateBases[`${values.platform}|${values.content}`] ?? 10
      const typical = typicalEngagement[values.platform] ?? 1.5
      const adjust = Math.min(1.8, Math.max(0.6, typical ? engagement / typical : 1))
      const mid = (followers / 1000) * base * adjust
      return stats(
        [
          ["Low", usd(mid * 0.7)],
          ["High", usd(mid * 1.3)],
        ],
        { note: `Built from USD ${base} per 1,000 followers for this platform and content type, adjusted for engagement. A starting point, not a fee you can invoice as-is.` },
      )
    },
  },
  "api-cost-calculator": {
    intro:
      `Prices were copied from provider pages on ${PRICES_CHECKED} and are maintained by hand, so they may lag. Standard input and output rates only: no cache, batch, or long-context uplift. The provider page is the source of truth.`,
    columns: 2,
    fields: [
      select(
        "model",
        "Model",
        "claude-sonnet-5",
        Object.entries(apiModels).map(([value, model]) => [value, model.label]),
      ),
      number("requests", "Requests", "1000"),
      number("input", "Input tokens each", "800"),
      number("output", "Output tokens each", "300"),
    ],
    run: (values) => {
      const model = apiModels[values.model]
      const requests = read(values, "requests")
      const input = read(values, "input")
      const output = read(values, "output")
      if (!model || requests === null || input === null || output === null) return null
      const cost = (requests * input * model.input + requests * output * model.output) / 1_000_000
      return stats(
        [
          ["Estimated cost", usd(cost)],
          ["Input / 1M", usd(model.input)],
          ["Output / 1M", usd(model.output)],
        ],
        { note: `Checked ${PRICES_CHECKED}. Confirm on the provider page: ${model.href}` },
      )
    },
  },
  "coding-tool-cost-calculator": {
    intro:
      "A rough comparison of published individual list prices, checked 5 October 2026. Hours per week only pick a tier so you can compare seats. Vendors meter usage differently, and heavy use can cost more than the seat. Cursor: Pro USD 20, Pro+ USD 60, Ultra USD 200. Claude Code sits on Claude Pro USD 20 or Max USD 100 / USD 200. GitHub Copilot: Pro USD 10, Pro+ USD 39, Max USD 100.",
    fields: [number("hours", "Hours per week", "8", "h")],
    run: (values) => {
      const hours = read(values, "hours")
      if (hours === null) return null
      const band = hours < 5 ? "light" : hours <= 15 ? "steady" : "heavy"
      const rows: Record<string, [string, string, string]> = {
        light: ["Cursor Pro · USD 20", "Claude Pro · USD 20", "Copilot Pro · USD 10"],
        steady: ["Cursor Pro+ · USD 60", "Claude Max 5× · USD 100", "Copilot Pro+ · USD 39"],
        heavy: ["Cursor Ultra · USD 200", "Claude Max 20× · USD 200", "Copilot Max · USD 100"],
      }
      const [cursor, claude, copilot] = rows[band]
      return stats(
        [
          ["Cursor", cursor],
          ["Claude Code", claude],
          ["Copilot", copilot],
        ],
        { note: "List prices only. This hour split is a rough comparison, not how any vendor bills you." },
      )
    },
  },
  "bnpl-cost-calculator": {
    intro:
      "Interest-free is not the same as free. Add the purchase price, how many instalments, and every fee the plan charges. The gap between the cash price and what you pay is the true extra cost, even when the advertised rate is 0%.",
    privacy: true,
    columns: 3,
    example: { label: "$240 in 4 payments with $12 fees", values: { price: "240", instalments: "4", fees: "12" } },
    fields: [
      number("price", "Purchase price", "240", "AUD"),
      number("instalments", "Instalments", "4"),
      number("fees", "Fees in total", "12", "AUD"),
    ],
    run: (values) => {
      const price = read(values, "price")
      const instalments = read(values, "instalments")
      const fees = read(values, "fees")
      if (price === null || instalments === null || fees === null) return null
      if (instalments <= 0) return { note: "Enter at least 1 instalment." }
      const total = price + fees
      return stats(
        [
          ["You pay", money(total), true],
          ["Each instalment", money(total / instalments)],
          ["Extra over the price", money(fees)],
          ["Extra as a share of price", price ? percent((fees / price) * 100) : "—"],
        ],
        {
          copy: `A ${money(price)} purchase with ${money(fees)} in fees costs ${money(total)}, or ${money(total / instalments)} across ${num(instalments, 0)} instalments.`,
          note: fees > 0 ? "The plan can still say interest-free. The fee is the cost." : "With no fees, you pay the purchase price split across the instalments.",
        },
      )
    },
  },
  "fire-calculator": {
    intro:
      "Financial independence here means a portfolio of 25 times annual expenses, the 4% rule. Savings rate is the share of income you keep, so income is inferred from expenses and that rate. The balance grows once a year at the return you enter, then the year’s savings are added. It is a planning sketch, not a forecast.",
    privacy: true,
    columns: 2,
    example: { label: "$80k saved, $50k expenses, 30% savings", values: { savings: "80000", expenses: "50000", return: "7", rate: "30" } },
    fields: [
      number("savings", "Current savings", "80000", "AUD"),
      number("expenses", "Annual expenses", "50000", "AUD"),
      number("return", "Expected return", "7", "%"),
      number("rate", "Savings rate", "30", "%"),
    ],
    run: (values) => {
      const savings = read(values, "savings")
      const expenses = read(values, "expenses")
      const expected = read(values, "return")
      const rate = read(values, "rate")
      if (savings === null || expenses === null || expected === null || rate === null) return null
      if (!(expenses > 0)) return { note: "Enter annual expenses greater than 0." }
      if (rate < 0 || rate >= 100) return { note: "Use a savings rate from 0 up to, but not including, 100%." }
      const target = expenses / 0.04
      const contribution = (expenses * (rate / 100)) / (1 - rate / 100)
      let balance = savings
      let years = 0
      if (balance < target) {
        for (let year = 1; year <= 80; year += 1) {
          balance = balance * (1 + expected / 100) + contribution
          if (balance >= target) {
            years = year
            break
          }
        }
      }
      if (balance < target) {
        return stats([["FI number", money(target), true]], { note: "Still short after 80 years at these figures." })
      }
      return stats(
        [
          ["Years to FI", years === 0 ? "Already there" : String(years), true],
          ["FI number", money(target)],
          ["Saved each year", money(contribution)],
        ],
        {
          copy:
            years === 0
              ? `Already at the FI number of ${money(target)}.`
              : `${years} years to a ${money(target)} FI number, saving ${money(contribution)} a year at ${percent(expected)} expected return.`,
        },
      )
    },
  },
  "gig-tax-estimator": {
    intro:
      "An estimate for the 2026–27 income year, not tax advice. Resident brackets from the ATO: nil to $18,200, then 15% to $45,000, 30% to $135,000, 37% to $190,000, and 45% above that. Medicare levy is a flat 2% here, with no low-income reduction. Offsets, deductions, and GST are not included.",
    privacy: true,
    columns: 2,
    example: { label: "$65k wage plus $18k gig", values: { wage: "65000", gig: "18000" } },
    fields: [
      number("wage", "Employment income", "65000", "AUD"),
      number("gig", "Freelance or rideshare", "18000", "AUD"),
    ],
    run: (values) => {
      const wage = read(values, "wage")
      const gig = read(values, "gig")
      if (wage === null || gig === null) return null
      const combined = Math.max(0, wage) + Math.max(0, gig)
      const taxOnWage = residentTax2027(Math.max(0, wage))
      const taxOnAll = residentTax2027(combined)
      const medicareOnWage = Math.max(0, wage) * 0.02
      const medicareOnAll = combined * 0.02
      const extra = taxOnAll - taxOnWage + (medicareOnAll - medicareOnWage)
      return stats(
        [
          ["Tax on the gig income", money(extra), true],
          ["Tax and levy on all income", money(taxOnAll + medicareOnAll)],
        ],
        {
          copy: `The extra tax and Medicare on ${money(Math.max(0, gig))} of gig income is about ${money(extra)}. Combined tax and levy on ${money(combined)} is ${money(taxOnAll + medicareOnAll)}.`,
          note: "2026–27 resident rates. Confirm on the ATO page: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents",
        },
      )
    },
  },
  "round-up-investing-estimator": {
    intro:
      "Enter a typical week: how much you spend, how many transactions get rounded up, and the average round-up on each one. The monthly and annual figures are that weekly spare change, stretched across the year. Nothing is invested for you.",
    columns: 3,
    example: { label: "14 round-ups of 45c", values: { spend: "280", transactions: "14", roundup: "0.45" } },
    fields: [
      number("spend", "Average weekly spend", "280", "AUD"),
      number("transactions", "Transactions a week", "14"),
      number("roundup", "Average round-up", "0.45", "AUD"),
    ],
    run: (values) => {
      const spend = read(values, "spend")
      const transactions = read(values, "transactions")
      const roundup = read(values, "roundup")
      if (spend === null || transactions === null || roundup === null) return null
      if (transactions < 0 || roundup < 0) return { note: "Transactions and round-ups can’t be negative." }
      const weekly = transactions * roundup
      const yearly = weekly * 52
      return stats(
        [
          ["Each year", money(yearly), true],
          ["Each month", money(yearly / 12)],
          ["Share of weekly spend", spend ? percent((weekly / spend) * 100) : "—"],
        ],
        {
          copy: `${num(transactions, 0)} round-ups of ${money(roundup)} is ${money(weekly)} a week, about ${money(yearly)} a year.`,
        },
      )
    },
  },
  "rate-limit-calculator": {
    privacy: true,
    intro:
      "Compare the cap in one window with the calls you expect from every concurrent user. If demand is under the cap, the limit holds for that window. Reset is the length of the window itself: when it elapses, the count starts again.",
    columns: 2,
    fields: [
      number("limit", "Requests per window", "1000"),
      number("window", "Window", "60", "sec"),
      number("users", "Concurrent users", "40"),
      number("each", "Requests per user", "20"),
    ],
    run: (values) => {
      const limit = read(values, "limit")
      const window = read(values, "window")
      const users = read(values, "users")
      const each = read(values, "each")
      if (limit === null || window === null || users === null || each === null) return null
      const demand = users * each
      const room = limit - demand
      const capacity = each > 0 ? Math.floor(limit / each) : 0
      return stats(
        [
          ["Demand", num(demand, 0)],
          ["Verdict", room >= 0 ? "Enough" : "Short"],
          ["Until reset", `${num(window, 0)} sec`],
          ["Users the cap holds", num(capacity, 0)],
        ],
        {
          note: room >= 0 ? `${num(room, 0)} requests of headroom in this window.` : `Short by ${num(-room, 0)} requests. Raise the cap or lower calls per user.`,
          copy: room >= 0 ? `Enough — demand ${num(demand, 0)} of ${num(limit, 0)}.` : `Short — demand ${num(demand, 0)} of ${num(limit, 0)}.`,
        },
      )
    },
  },
  "screen-time-audit": {
    intro:
      "Enter hours per day for each kind of screen use. Weekly is that day times 7, and yearly is the day times 365. It is a manual tally, so it only knows what you type.",
    columns: 2,
    fields: [
      number("social", "Social", "1.5", "h"),
      number("video", "Video", "1", "h"),
      number("games", "Games", "0.5", "h"),
      number("work", "Work", "6", "h"),
      number("other", "Other", "0.5", "h"),
    ],
    run: (values) => {
      const day = sumKeys(values, ["social", "video", "games", "work", "other"])
      if (day === null) return null
      return stats([
        ["A week", `${num(day * 7)} h`],
        ["A year", `${num(day * 365, 0)} h`],
        ["A day", `${num(day)} h`],
      ])
    },
  },
  "carbon-footprint-estimator": {
    intro:
      "Rough estimates from published third-party research, not a measurement of your devices or your grid. Streaming uses the IEA’s updated 2019 figure of 36 g CO2 per hour of video on a global average grid (commentary, December 2020). Each AI text prompt uses 0.03 g CO2e, Google’s median Gemini Apps text prompt from May 2025. Other models, resolutions, and grids differ, often by a lot.",
    columns: 2,
    fields: [
      number("streaming", "Streaming hours a week", "7", "h"),
      number("prompts", "AI prompts a day", "20"),
    ],
    run: (values) => {
      const streaming = read(values, "streaming")
      const prompts = read(values, "prompts")
      if (streaming === null || prompts === null) return null
      const streamYear = streaming * 52 * 36
      const aiYear = prompts * 365 * 0.03
      return stats(
        [
          ["Streaming, a year", `${num(streamYear, 0)} g`],
          ["AI prompts, a year", `${num(aiYear, 0)} g`],
          ["Combined, a year", `${num((streamYear + aiYear) / 1000)} kg`],
        ],
        { note: "Illustrative factors only. IEA streaming commentary (2020) and Google’s Gemini Apps paper (2025). Not a precise footprint." },
      )
    },
  },
  "commit-message-generator": {
    privacy: true,
    download: "commit.txt",
    intro:
      "Describe the change and pick a conventional type. The page formats `type(scope): subject` and an optional body. It does not call a model and it does not look at your git history.",
    columns: 2,
    fields: [
      select("type", "Type", "feat", [
        ["feat", "feat"],
        ["fix", "fix"],
        ["chore", "chore"],
        ["docs", "docs"],
        ["refactor", "refactor"],
        ["test", "test"],
        ["style", "style"],
      ]),
      field("scope", "Scope", "text", "tools", { placeholder: "optional" }),
      field("subject", "Subject", "text", "add a FIFO crypto tax calculator", { placeholder: "what changed" }),
      field("body", "Body", "textarea", "", { rows: 4, placeholder: "Optional longer note" }),
    ],
    run: (values) => {
      const subject = values.subject.trim()
      if (!subject) return { note: "Add a subject." }
      const scope = values.scope.trim()
      const header = `${values.type}${scope ? `(${scope})` : ""}: ${subject}`
      const body = values.body.trim()
      const text = body ? `${header}\n\n${body}` : header
      return { text, copy: text }
    },
  },
}
