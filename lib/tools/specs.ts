import { addedSpecs } from "@/lib/tools/added-specs"
import { money, num } from "@/lib/tools/format"
import {
  activityFactor,
  aprFromApy,
  apyFromApr,
  australianTakeHome,
  bmi,
  bmr,
  chmodMode,
  cleanText,
  clockSeconds,
  cmPer360,
  convertUnit,
  csvFromObjects,
  dateSpan,
  decodeBase64,
  describeCron,
  encodeBase64,
  estimateTotal,
  evaluateExpression,
  feeOn,
  flesch,
  formatCode,
  formatDuration,
  formatSql,
  futureValue,
  gpaFromLines,
  htmlDecode,
  htmlEncode,
  icebreakers,
  impermanentLoss,
  ipv4ToInt,
  letterGrade,
  liquidationPrice,
  loanPayment,
  lorem,
  numberToWords,
  objectsFromCsv,
  parseYaml,
  password,
  pitch,
  ppi,
  queryJsonPath,
  randomInt,
  salesTax,
  scaleRecipe,
  slugify,
  subnetInfo,
} from "@/lib/tools/pure"

export type SpecField = {
  key: string
  label: string
  kind: "number" | "text" | "select" | "textarea" | "check" | "color" | "date"
  default: string
  suffix?: string
  min?: number
  step?: string
  options?: { value: string; label: string }[]
  rows?: number
  placeholder?: string
}

export type SpecResult = {
  stats?: { label: string; value: string }[]
  text?: string
  note?: string
  demo?: { background?: string; boxShadow?: string; borderRadius?: string }
}

export type ToolSpec = {
  wide?: boolean
  intro?: string
  action?: string
  random?: boolean
  columns?: 2 | 3
  fields: SpecField[]
  run: (values: Record<string, string>) => SpecResult | null
  runAsync?: (values: Record<string, string>) => Promise<SpecResult | null>
}

const options = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }))

function field(
  key: string,
  label: string,
  kind: SpecField["kind"],
  value: string,
  extra: Partial<SpecField> = {},
): SpecField {
  return { key, label, kind, default: value, ...extra }
}

const number = (key: string, label: string, value: string, suffix?: string, min: number | null = 0) =>
  field(key, label, "number", value, { suffix, ...(min === null ? {} : { min }) })

const select = (key: string, label: string, value: string, pairs: [string, string][]) =>
  field(key, label, "select", value, { options: options(pairs) })

const area = (key: string, label: string, value: string, rows = 8) => field(key, label, "textarea", value, { rows })

const check = (key: string, label: string, on = false) => field(key, label, "check", on ? "yes" : "")

function read(values: Record<string, string>, key: string) {
  const amount = Number(values[key])
  return Number.isFinite(amount) ? amount : null
}

function stats(pairs: [string, string][], extra: Partial<SpecResult> = {}): SpecResult {
  return { stats: pairs.map(([label, value]) => ({ label, value })), ...extra }
}

const feeIntro = "Rates change. These defaults are a starting point, so edit them to match your account."
const bodyIntro = "An estimate for planning, not a diagnosis. Mifflin–St Jeor, in kilograms and centimetres."

function platformFee(percent: string, fixed: string): ToolSpec {
  return {
    intro: feeIntro,
    columns: 3,
    fields: [number("amount", "Amount", "100", "AUD"), number("percent", "Percent", percent, "%"), number("fixed", "Fixed fee", fixed, "AUD")],
    run: (values) => {
      const amount = read(values, "amount")
      const percent = read(values, "percent")
      const fixed = read(values, "fixed")
      if (amount === null || percent === null || fixed === null) return null
      const result = feeOn(amount, percent, fixed)
      return stats([
        ["Fee", money(result.fee)],
        ["You keep", money(result.net)],
      ])
    },
  }
}

const unitOptions: [string, string][] = [
  ["mm", "Millimetres"],
  ["cm", "Centimetres"],
  ["m", "Metres"],
  ["km", "Kilometres"],
  ["in", "Inches"],
  ["ft", "Feet"],
  ["yd", "Yards"],
  ["mi", "Miles"],
  ["mg", "Milligrams"],
  ["g", "Grams"],
  ["kg", "Kilograms"],
  ["oz", "Ounces"],
  ["lb", "Pounds"],
  ["°C", "Celsius"],
  ["°F", "Fahrenheit"],
  ["K", "Kelvin"],
  ["ml", "Millilitres"],
  ["L", "Litres"],
  ["tsp", "Teaspoons"],
  ["tbsp", "Tablespoons"],
  ["cup", "Cups"],
  ["fl oz", "Fluid ounces"],
  ["m²", "Square metres"],
  ["ft²", "Square feet"],
  ["acre", "Acres"],
]

export const toolSpecs: Record<string, ToolSpec> = {
  "general-calculator": {
    fields: [field("expression", "Expression", "text", "12 * (4 + 1)", { placeholder: "12 * (4 + 1)" })],
    run: (values) => stats([["Result", num(evaluateExpression(values.expression) ?? Number.NaN, 6)]]),
  },
  "loan-calculator": {
    intro: "A standard fixed repayment. The rate is nominal, compounded monthly.",
    columns: 3,
    fields: [number("principal", "Amount", "20000", "AUD"), number("rate", "Annual rate", "6.5", "%"), number("years", "Years", "5", "yr", 0)],
    run: (values) => {
      const principal = read(values, "principal")
      const rate = read(values, "rate")
      const years = read(values, "years")
      if (principal === null || rate === null || !years || years <= 0) return null
      const result = loanPayment(principal, rate, years)
      return stats([
        ["Each month", money(result.payment)],
        ["Interest", money(result.interest)],
        ["Total", money(result.total)],
      ])
    },
  },
  "compound-interest-calculator": {
    columns: 3,
    fields: [
      number("principal", "Starting balance", "5000", "AUD"),
      number("rate", "Annual rate", "4.5", "%"),
      number("years", "Years", "10", "yr"),
      select("compounds", "Compounds", "12", [["1", "Yearly"], ["4", "Quarterly"], ["12", "Monthly"], ["365", "Daily"]]),
      number("deposit", "Deposit each period", "200", "AUD"),
    ],
    run: (values) => {
      const principal = read(values, "principal")
      const rate = read(values, "rate")
      const years = read(values, "years")
      const deposit = read(values, "deposit")
      if (principal === null || rate === null || years === null || deposit === null) return null
      const value = futureValue(principal, rate, years, Number(values.compounds), deposit)
      return stats([["Future balance", money(value)]])
    },
  },
  "savings-calculator": {
    columns: 2,
    fields: [
      number("principal", "Starting balance", "1000", "AUD"),
      number("deposit", "Monthly deposit", "400", "AUD"),
      number("rate", "Annual rate", "4", "%"),
      number("years", "Years", "5", "yr"),
    ],
    run: (values) => {
      const principal = read(values, "principal")
      const deposit = read(values, "deposit")
      const rate = read(values, "rate")
      const years = read(values, "years")
      if (principal === null || deposit === null || rate === null || years === null) return null
      const value = futureValue(principal, rate, years, 12, deposit)
      const contributed = principal + deposit * years * 12
      return stats([
        ["Balance", money(value)],
        ["You put in", money(contributed)],
        ["Growth", money(value - contributed)],
      ])
    },
  },
  "roi-calculator": {
    fields: [number("cost", "Invested", "1000", "AUD"), number("returned", "Returned", "1350", "AUD")],
    run: (values) => {
      const cost = read(values, "cost")
      const returned = read(values, "returned")
      if (cost === null || returned === null || cost === 0) return null
      const profit = returned - cost
      return stats([
        ["Profit", money(profit)],
        ["ROI", `${num((profit / cost) * 100)}%`],
      ])
    },
  },
  "sales-tax-calculator": {
    columns: 3,
    fields: [
      number("amount", "Amount", "80", "AUD"),
      number("rate", "Tax rate", "10", "%"),
      select("mode", "Mode", "add", [["add", "Add tax"], ["extract", "Extract tax"]]),
    ],
    run: (values) => {
      const amount = read(values, "amount")
      const rate = read(values, "rate")
      if (amount === null || rate === null) return null
      const result = salesTax(amount, rate, values.mode)
      return stats([
        ["Net", money(result.net)],
        ["Tax", money(result.tax)],
        ["Total", money(result.total)],
      ])
    },
  },
  "time-duration-calculator": {
    fields: [
      field("start", "Start", "text", "09:30", { placeholder: "09:30" }),
      field("end", "End", "text", "17:45", { placeholder: "17:45" }),
    ],
    run: (values) => {
      const start = clockSeconds(values.start)
      const end = clockSeconds(values.end)
      if (start === null || end === null) return { note: "Use 24-hour times, such as 09:30." }
      const span = end >= start ? end - start : end + 86400 - start
      return stats([["Duration", formatDuration(span)]], { note: end < start ? "The end time is on the next day." : undefined })
    },
  },
  "date-difference-calculator": {
    fields: [field("start", "Start", "date", "2026-01-01"), field("end", "End", "date", "2026-10-03")],
    run: (values) => {
      const span = dateSpan(values.start, values.end)
      if (!span) return null
      return stats([
        ["Days", num(span.days, 0)],
        ["Weeks", num(span.weeks, 1)],
        ["Calendar months", num(span.months, 0)],
      ])
    },
  },
  "take-home-salary-calculator": {
    intro: "Resident estimate using the stage 3 brackets (16%, 30%, 37%, 45%) plus a 2% Medicare levy. Offsets and HELP are not included.",
    fields: [number("income", "Annual salary", "95000", "AUD")],
    run: (values) => {
      const income = read(values, "income")
      if (income === null || income < 0) return null
      const result = australianTakeHome(income)
      return stats([
        ["Tax", money(result.tax)],
        ["Medicare", money(result.medicare)],
        ["Take-home", money(result.takeHome)],
        ["Each month", money(result.takeHome / 12)],
      ])
    },
  },
  "salary-to-hourly-calculator": {
    columns: 3,
    fields: [number("salary", "Annual salary", "95000", "AUD"), number("hours", "Hours a week", "38", "h"), number("weeks", "Weeks a year", "52")],
    run: (values) => {
      const salary = read(values, "salary")
      const hours = read(values, "hours")
      const weeks = read(values, "weeks")
      if (!salary || !hours || !weeks) return null
      return stats([["Hourly", money(salary / (hours * weeks))]])
    },
  },
  "overtime-calculator": {
    columns: 2,
    fields: [
      number("rate", "Hourly rate", "42", "AUD"),
      number("ordinary", "Ordinary hours", "38", "h"),
      number("overtime", "Overtime hours", "4", "h"),
      number("multiplier", "Overtime multiplier", "1.5", "×"),
    ],
    run: (values) => {
      const rate = read(values, "rate")
      const ordinary = read(values, "ordinary")
      const overtime = read(values, "overtime")
      const multiplier = read(values, "multiplier")
      if (rate === null || ordinary === null || overtime === null || multiplier === null) return null
      const base = ordinary * rate
      const extra = overtime * rate * multiplier
      return stats([
        ["Ordinary", money(base)],
        ["Overtime", money(extra)],
        ["Total", money(base + extra)],
      ])
    },
  },
  "bmi-calculator": {
    fields: [number("weight", "Weight", "72", "kg"), number("height", "Height", "178", "cm")],
    run: (values) => {
      const weight = read(values, "weight")
      const height = read(values, "height")
      if (!weight || !height) return null
      const result = bmi(weight, height)
      return stats([
        ["BMI", num(result.value, 1)],
        ["Range", result.label],
      ], { note: "World Health Organization ranges for adults. It is a screening figure, not a diagnosis." })
    },
  },
  "bmr-calculator": {
    intro: bodyIntro,
    columns: 2,
    fields: [
      select("sex", "Sex", "female", [["female", "Female"], ["male", "Male"]]),
      number("age", "Age", "34", "yr"),
      number("weight", "Weight", "68", "kg"),
      number("height", "Height", "168", "cm"),
    ],
    run: (values) => {
      const weight = read(values, "weight")
      const height = read(values, "height")
      const age = read(values, "age")
      if (!weight || !height || !age) return null
      return stats([["BMR", `${num(bmr(values.sex, weight, height, age), 0)} kcal`]])
    },
  },
  "tdee-calculator": {
    intro: bodyIntro,
    columns: 2,
    fields: [
      select("sex", "Sex", "female", [["female", "Female"], ["male", "Male"]]),
      number("age", "Age", "34", "yr"),
      number("weight", "Weight", "68", "kg"),
      number("height", "Height", "168", "cm"),
      select("activity", "Activity", "moderate", [
        ["sedentary", "Sedentary"],
        ["light", "Light"],
        ["moderate", "Moderate"],
        ["very", "Very active"],
        ["extra", "Extra active"],
      ]),
    ],
    run: (values) => {
      const weight = read(values, "weight")
      const height = read(values, "height")
      const age = read(values, "age")
      if (!weight || !height || !age) return null
      const base = bmr(values.sex, weight, height, age)
      return stats([
        ["BMR", `${num(base, 0)} kcal`],
        ["TDEE", `${num(base * activityFactor(values.activity), 0)} kcal`],
      ])
    },
  },
  "calorie-calculator": {
    intro: bodyIntro,
    columns: 2,
    fields: [
      select("sex", "Sex", "female", [["female", "Female"], ["male", "Male"]]),
      number("age", "Age", "34", "yr"),
      number("weight", "Weight", "68", "kg"),
      number("height", "Height", "168", "cm"),
      select("activity", "Activity", "moderate", [
        ["sedentary", "Sedentary"],
        ["light", "Light"],
        ["moderate", "Moderate"],
        ["very", "Very active"],
        ["extra", "Extra active"],
      ]),
      select("goal", "Goal", "lose", [["lose", "Lose"], ["maintain", "Maintain"], ["gain", "Gain"]]),
    ],
    run: (values) => {
      const weight = read(values, "weight")
      const height = read(values, "height")
      const age = read(values, "age")
      if (!weight || !height || !age) return null
      const tdee = bmr(values.sex, weight, height, age) * activityFactor(values.activity)
      const target = values.goal === "lose" ? tdee - 500 : values.goal === "gain" ? tdee + 300 : tdee
      return stats([
        ["Maintenance", `${num(tdee, 0)} kcal`],
        ["Target", `${num(target, 0)} kcal`],
      ], { note: "Lose uses a 500 kcal deficit. Gain uses a 300 kcal surplus." })
    },
  },
  "gpa-calculator": {
    wide: true,
    intro: "One course a line: letter grade, then credits. Example: A- 3",
    fields: [area("courses", "Courses", "A 3\nB+ 4\nA- 3")],
    run: (values) => {
      const result = gpaFromLines(values.courses)
      if (!result) return null
      return stats([
        ["GPA", num(result.gpa, 2)],
        ["Credits", num(result.credits, 0)],
      ], { note: "4.0 scale. A and A+ are both 4.0." })
    },
  },
  "grade-calculator": {
    fields: [number("earned", "Points earned", "86"), number("possible", "Points possible", "100")],
    run: (values) => {
      const earned = read(values, "earned")
      const possible = read(values, "possible")
      if (earned === null || !possible) return null
      const percent = (earned / possible) * 100
      return stats([
        ["Percent", `${num(percent, 1)}%`],
        ["Letter", letterGrade(percent)],
      ], { note: "A common scale: A from 90, B from 80, C from 70, D from 60." })
    },
  },
  "unit-converter": {
    columns: 3,
    fields: [
      number("value", "Value", "1", undefined, null),
      select("from", "From", "m", unitOptions),
      select("to", "To", "ft", unitOptions),
    ],
    run: (values) => {
      const value = read(values, "value")
      if (value === null) return null
      return stats([["Result", num(convertUnit(value, values.from, values.to), 4)]])
    },
  },
  "password-generator": {
    random: true,
    action: "Generate",
    columns: 3,
    fields: [number("length", "Length", "16", undefined, 4), check("numbers", "Numbers", true), check("symbols", "Symbols", true)],
    run: (values) => {
      const length = Math.min(64, Math.max(4, Math.round(read(values, "length") ?? 16)))
      const text = password(length, values.numbers === "yes", values.symbols === "yes")
      return { text, stats: [{ label: "Password", value: text }] }
    },
  },
  "base64-encoder": {
    wide: true,
    fields: [select("mode", "Mode", "encode", [["encode", "Encode"], ["decode", "Decode"]]), area("text", "Text", "Nice Build")],
    run: (values) => ({ text: values.mode === "decode" ? decodeBase64(values.text) : encodeBase64(values.text) }),
  },
  "url-encoder": {
    wide: true,
    fields: [select("mode", "Mode", "encode", [["encode", "Encode"], ["decode", "Decode"]]), area("text", "Text", "a b&c=d")],
    run: (values) => ({ text: values.mode === "decode" ? decodeURIComponent(values.text) : encodeURIComponent(values.text) }),
  },
  "timestamp-converter": {
    fields: [
      field("unix", "Unix timestamp", "text", "1760000000", { placeholder: "Seconds or milliseconds" }),
      field("date", "Or a date", "text", "", { placeholder: "2026-10-03T09:00" }),
    ],
    run: (values) => {
      if (values.unix.trim()) {
        const raw = Number(values.unix)
        if (!Number.isFinite(raw)) return { note: "That timestamp is not a number." }
        const ms = Math.abs(raw) > 10_000_000_000 ? raw : raw * 1000
        const date = new Date(ms)
        if (Number.isNaN(date.getTime())) return { note: "That timestamp is out of range." }
        return stats([
          ["Local", date.toLocaleString("en-AU")],
          ["UTC", date.toISOString()],
        ])
      }
      if (!values.date.trim()) return null
      const date = new Date(values.date)
      if (Number.isNaN(date.getTime())) return { note: "Use a date such as 2026-10-03T09:00." }
      return stats([
        ["Unix seconds", String(Math.floor(date.getTime() / 1000))],
        ["Unix milliseconds", String(date.getTime())],
      ])
    },
  },
  "hash-generator": {
    wide: true,
    fields: [
      select("algo", "Algorithm", "SHA-256", [["SHA-1", "SHA-1"], ["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"]]),
      area("text", "Text", "Nice Build"),
    ],
    run: () => null,
    runAsync: async (values) => {
      const digest = await crypto.subtle.digest(values.algo, new TextEncoder().encode(values.text))
      const text = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
      return { text, stats: [{ label: values.algo, value: text }] }
    },
  },
  "jwt-decoder": {
    wide: true,
    intro: "This only reads the header and payload. It does not check the signature.",
    fields: [area("token", "Token", "eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZW1vIn0.")],
    run: (values) => {
      const parts = values.token.trim().split(".")
      if (parts.length < 2) return { note: "A JWT has three parts, separated by dots." }
      const header = prettyJson(decodeBase64Url(parts[0]))
      const payload = prettyJson(decodeBase64Url(parts[1]))
      return { text: `Header\n${header}\n\nPayload\n${payload}` }
    },
  },
  "json-validator": {
    wide: true,
    fields: [area("text", "JSON", '{\n  "ok": true\n}')],
    run: (values) => {
      JSON.parse(values.text)
      return { note: "Valid JSON." }
    },
  },
  "sql-formatter": {
    wide: true,
    fields: [area("text", "SQL", "select id, name from tools where status = 'live' order by name")],
    run: (values) => ({ text: formatSql(values.text) }),
  },
  "xml-formatter": {
    wide: true,
    fields: [area("text", "XML", "<tools><tool id=\"1\">Nice</tool></tools>")],
    run: (values) => ({ text: formatXml(values.text) }),
  },
  "cron-expression-generator": {
    columns: 3,
    fields: [
      select("minute", "Minute", "0", [["*", "Every"], ["*/5", "Every 5"], ["*/15", "Every 15"], ["0", "0"], ["15", "15"], ["30", "30"]]),
      select("hour", "Hour", "9", [["*", "Every"], ["0", "0"], ["9", "9"], ["12", "12"], ["18", "18"]]),
      select("weekday", "Weekday", "1-5", [["*", "Every day"], ["1-5", "Weekdays"], ["1", "Monday"], ["5", "Friday"], ["0", "Sunday"]]),
    ],
    run: (values) => {
      const result = describeCron(values.minute, values.hour, "*", "*", values.weekday)
      return { text: result.expression, note: result.sentence, stats: [{ label: "Expression", value: result.expression }] }
    },
  },
  "html-encoder": {
    wide: true,
    fields: [select("mode", "Mode", "encode", [["encode", "Encode"], ["decode", "Decode"]]), area("text", "Text", "<p class=\"hi\">Hello</p>")],
    run: (values) => ({ text: values.mode === "decode" ? htmlDecode(values.text) : htmlEncode(values.text) }),
  },
  "code-beautifier": {
    wide: true,
    fields: [area("text", "Code", '{"name":"Nice","tools":[1,2]}')],
    run: (values) => ({ text: formatCode(values.text) }),
  },
  "json-to-csv": {
    wide: true,
    fields: [area("text", "JSON", '[{"name":"Ada","role":"Design"},{"name":"Lin","role":"Build"}]')],
    run: (values) => ({ text: csvFromObjects(JSON.parse(values.text)) }),
  },
  "csv-to-json": {
    wide: true,
    fields: [area("text", "CSV", "name,role\nAda,Design\nLin,Build")],
    run: (values) => ({ text: JSON.stringify(objectsFromCsv(values.text), null, 2) }),
  },
  "yaml-validator": {
    wide: true,
    intro: "Straightforward YAML: maps, lists, and plain values. Tabs and multi-line blocks are rejected.",
    fields: [area("text", "YAML", "name: Ada\nrole: Design\ntags:\n  - a\n  - b")],
    run: (values) => {
      parseYaml(values.text)
      return { note: "Valid YAML." }
    },
  },
  "yaml-to-json": {
    wide: true,
    fields: [area("text", "YAML", "name: Ada\nrole: Design\ntags:\n  - a\n  - b")],
    run: (values) => ({ text: JSON.stringify(parseYaml(values.text), null, 2) }),
  },
  "robots-txt-generator": {
    wide: true,
    fields: [
      field("agent", "User agent", "text", "*"),
      area("allow", "Allow", "/"),
      area("disallow", "Disallow", "/private"),
      field("sitemap", "Sitemap", "text", "https://example.com/sitemap.xml"),
    ],
    run: (values) => {
      const lines = [`User-agent: ${values.agent || "*"}`]
      for (const path of splitLines(values.allow)) lines.push(`Allow: ${path}`)
      for (const path of splitLines(values.disallow)) lines.push(`Disallow: ${path}`)
      if (values.sitemap.trim()) lines.push("", `Sitemap: ${values.sitemap.trim()}`)
      return { text: lines.join("\n") }
    },
  },
  "chmod-calculator": {
    intro: "Owner, group, then everyone else.",
    columns: 3,
    fields: [
      check("or", "Owner read", true), check("ow", "Owner write", true), check("ox", "Owner execute", true),
      check("gr", "Group read", true), check("gw", "Group write"), check("gx", "Group execute", true),
      check("pr", "Public read", true), check("pw", "Public write"), check("px", "Public execute", true),
    ],
    run: (values) => {
      const flags = ["or", "ow", "ox", "gr", "gw", "gx", "pr", "pw", "px"].map((key) => values[key] === "yes")
      const result = chmodMode(flags)
      return stats([
        ["Octal", result.octal],
        ["Symbol", result.symbol],
      ])
    },
  },
  "subnet-calculator": {
    fields: [field("ip", "IPv4 address", "text", "192.168.1.40"), number("prefix", "Prefix", "24", "/", 0)],
    run: (values) => networkStats(values.ip, read(values, "prefix")),
  },
  "cidr-calculator": {
    fields: [field("cidr", "CIDR", "text", "10.0.0.8/22", { placeholder: "10.0.0.8/22" })],
    run: (values) => {
      const [ip, prefix] = values.cidr.split("/")
      return networkStats(ip ?? "", Number(prefix))
    },
  },
  "jsonpath-tester": {
    wide: true,
    intro: "Supports $.key, [index], [*], and ..key.",
    fields: [
      field("path", "Path", "text", "$.tools[*].name"),
      area("text", "JSON", '{\n  "tools": [{ "name": "Tip" }, { "name": "Dice" }]\n}'),
    ],
    run: (values) => ({ text: JSON.stringify(queryJsonPath(JSON.parse(values.text), values.path), null, 2) }),
  },
  "csp-header-generator": {
    wide: true,
    fields: [
      field("default", "default-src", "text", "'self'"),
      field("script", "script-src", "text", "'self'"),
      field("style", "style-src", "text", "'self'"),
      field("img", "img-src", "text", "'self' data:"),
      field("connect", "connect-src", "text", "'self'"),
    ],
    run: (values) => {
      const text = [
        `default-src ${values.default}`,
        `script-src ${values.script}`,
        `style-src ${values.style}`,
        `img-src ${values.img}`,
        `connect-src ${values.connect}`,
      ].join("; ")
      return { text, stats: [{ label: "Header", value: text }] }
    },
  },
  "utm-link-builder": {
    wide: true,
    fields: [
      field("url", "URL", "text", "https://example.com/tools"),
      field("source", "Source", "text", "newsletter"),
      field("medium", "Medium", "text", "email"),
      field("campaign", "Campaign", "text", "spring"),
      field("term", "Term", "text", ""),
      field("content", "Content", "text", ""),
    ],
    run: (values) => {
      const url = new URL(values.url)
      const pairs: [string, string][] = [
        ["utm_source", values.source],
        ["utm_medium", values.medium],
        ["utm_campaign", values.campaign],
        ["utm_term", values.term],
        ["utm_content", values.content],
      ]
      for (const [key, value] of pairs) if (value.trim()) url.searchParams.set(key, value.trim())
      return { text: url.toString() }
    },
  },
  "colour-picker": {
    fields: [field("colour", "Colour", "color", "#111111")],
    run: (values) => colourStats(values.colour),
  },
  "hex-to-rgb": {
    fields: [field("hex", "Hex", "text", "#ff0101")],
    run: (values) => colourStats(values.hex),
  },
  "rgb-to-hex": {
    columns: 3,
    fields: [number("r", "Red", "255", undefined, 0), number("g", "Green", "1", undefined, 0), number("b", "Blue", "1", undefined, 0)],
    run: (values) => {
      const channels = ["r", "g", "b"].map((key) => read(values, key))
      if (channels.some((channel) => channel === null)) return null
      const [r, g, b] = channels as number[]
      const hex = `#${[r, g, b].map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, "0")).join("")}`
      return colourStats(hex)
    },
  },
  "aspect-ratio-calculator": {
    intro: "Leave one side blank to solve it from the ratio. Fill both to simplify the ratio.",
    columns: 2,
    fields: [
      number("width", "Width", "1920", "px"),
      number("height", "Height", "", "px"),
      number("ratioW", "Ratio width", "16"),
      number("ratioH", "Ratio height", "9"),
    ],
    run: (values) => {
      const width = values.width === "" ? null : read(values, "width")
      const height = values.height === "" ? null : read(values, "height")
      const ratioW = read(values, "ratioW")
      const ratioH = read(values, "ratioH")
      if (width && height) {
        const divisor = gcd(Math.round(width), Math.round(height))
        return stats([["Ratio", `${Math.round(width) / divisor}:${Math.round(height) / divisor}`]])
      }
      if (!ratioW || !ratioH) return null
      if (width && !height) return stats([["Height", num((width / ratioW) * ratioH, 1)]])
      if (height && !width) return stats([["Width", num((height / ratioH) * ratioW, 1)]])
      return null
    },
  },
  "px-to-rem": {
    fields: [number("px", "Pixels", "16", "px"), number("root", "Root size", "16", "px")],
    run: (values) => {
      const px = read(values, "px")
      const root = read(values, "root")
      if (px === null || !root) return null
      return stats([["rem", num(px / root, 4)]])
    },
  },
  "box-shadow-generator": {
    columns: 3,
    fields: [
      number("x", "X", "0", "px", null),
      number("y", "Y", "8", "px", null),
      number("blur", "Blur", "24", "px"),
      number("spread", "Spread", "0", "px", null),
      field("colour", "Colour", "color", "#111111"),
      number("opacity", "Opacity", "12", "%"),
    ],
    run: (values) => {
      const x = read(values, "x")
      const y = read(values, "y")
      const blur = read(values, "blur")
      const spread = read(values, "spread")
      const opacity = read(values, "opacity")
      if ([x, y, blur, spread, opacity].some((item) => item === null)) return null
      const rgb = hexChannels(values.colour)
      if (!rgb) return null
      const css = `${x}px ${y}px ${blur}px ${spread}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(opacity ?? 0) / 100})`
      return { text: `box-shadow: ${css};`, demo: { boxShadow: css } }
    },
  },
  "border-radius-generator": {
    fields: [number("radius", "Radius", "16", "px")],
    run: (values) => {
      const radius = read(values, "radius")
      if (radius === null) return null
      const css = `${radius}px`
      return { text: `border-radius: ${css};`, demo: { borderRadius: css, background: "#111111" } }
    },
  },
  "break-even-calculator": {
    columns: 3,
    fields: [number("fixed", "Fixed costs", "8000", "AUD"), number("price", "Price", "120", "AUD"), number("variable", "Variable cost", "45", "AUD")],
    run: (values) => {
      const fixed = read(values, "fixed")
      const price = read(values, "price")
      const variable = read(values, "variable")
      if (fixed === null || price === null || variable === null) return null
      const margin = price - variable
      if (margin <= 0) return { note: "The price needs to be higher than the variable cost." }
      return stats([
        ["Units", num(Math.ceil(fixed / margin), 0)],
        ["Revenue", money(Math.ceil(fixed / margin) * price)],
      ])
    },
  },
  "commission-calculator": {
    fields: [number("sales", "Sales", "4800", "AUD"), number("rate", "Rate", "8", "%")],
    run: (values) => {
      const sales = read(values, "sales")
      const rate = read(values, "rate")
      if (sales === null || rate === null) return null
      return stats([["Commission", money(sales * (rate / 100))]])
    },
  },
  "youtube-rpm-calculator": rpmSpec("3.5"),
  "tiktok-earnings-calculator": rpmSpec("0.4"),
  "creator-rate-calculator": {
    intro: "A starting point, not a quote. Rate = followers ÷ 1,000 × engagement × the base you set.",
    columns: 3,
    fields: [number("followers", "Followers", "20000"), number("engagement", "Engagement", "3", "%"), number("base", "Base per 1,000", "10", "AUD")],
    run: (values) => {
      const followers = read(values, "followers")
      const engagement = read(values, "engagement")
      const base = read(values, "base")
      if (followers === null || engagement === null || base === null) return null
      return stats([["Suggested", money((followers / 1000) * engagement * base)]])
    },
  },
  "paypal-fee-calculator": platformFee("2.6", "0.30"),
  "stripe-fee-calculator": platformFee("1.7", "0.30"),
  "etsy-fee-calculator": {
    intro: feeIntro,
    columns: 3,
    fields: [
      number("price", "Sale price", "48", "AUD"),
      number("cost", "Your cost", "16", "AUD"),
      number("listing", "Listing fee", "0.20", "AUD"),
      number("transaction", "Transaction", "6.5", "%"),
      number("payment", "Payment", "3", "%"),
      number("fixed", "Payment fixed", "0.25", "AUD"),
      check("offsite", "Offsite ads, 12%"),
    ],
    run: (values) => {
      const price = read(values, "price")
      const cost = read(values, "cost")
      const listing = read(values, "listing")
      const transaction = read(values, "transaction")
      const payment = read(values, "payment")
      const fixed = read(values, "fixed")
      if ([price, cost, listing, transaction, payment, fixed].some((item) => item === null)) return null
      const fees = (listing ?? 0) + (price ?? 0) * ((transaction ?? 0) / 100) + (price ?? 0) * ((payment ?? 0) / 100) + (fixed ?? 0) + (values.offsite === "yes" ? (price ?? 0) * 0.12 : 0)
      return profitStats(price ?? 0, cost ?? 0, fees)
    },
  },
  "ebay-fee-calculator": {
    intro: feeIntro,
    columns: 3,
    fields: [
      number("price", "Sale price", "80", "AUD"),
      number("cost", "Your cost", "30", "AUD"),
      number("final", "Final value fee", "13.6", "%"),
      number("payment", "Payment", "2.6", "%"),
      number("fixed", "Fixed fee", "0.30", "AUD"),
    ],
    run: (values) => pricedFees(values, ["final", "payment"], "fixed"),
  },
  "amazon-fba-calculator": {
    intro: feeIntro,
    columns: 2,
    fields: [
      number("price", "Sale price", "39", "AUD"),
      number("cost", "Product cost", "12", "AUD"),
      number("referral", "Referral fee", "15", "%"),
      number("fba", "Fulfilment fee", "6.50", "AUD"),
    ],
    run: (values) => {
      const price = read(values, "price")
      const cost = read(values, "cost")
      const referral = read(values, "referral")
      const fba = read(values, "fba")
      if (price === null || cost === null || referral === null || fba === null) return null
      return profitStats(price, cost, price * (referral / 100) + fba)
    },
  },
  "shopify-margin-calculator": {
    intro: feeIntro,
    columns: 2,
    fields: [
      number("price", "Sale price", "64", "AUD"),
      number("cost", "Product cost", "22", "AUD"),
      number("payment", "Payment fee", "1.6", "%"),
      number("fixed", "Fixed fee", "0.30", "AUD"),
    ],
    run: (values) => pricedFees(values, ["payment"], "fixed"),
  },
  "upwork-fee-calculator": platformFee("10", "0"),
  "fiverr-fee-calculator": platformFee("20", "0"),
  "gumroad-fee-calculator": platformFee("10", "0.50"),
  "kickstarter-fee-calculator": {
    intro: feeIntro,
    columns: 3,
    fields: [
      number("pledge", "Pledge", "40", "AUD"),
      number("platform", "Platform fee", "5", "%"),
      number("payment", "Payment fee", "3", "%"),
      number("fixed", "Fixed fee", "0.30", "AUD"),
    ],
    run: (values) => {
      const pledge = read(values, "pledge")
      const platform = read(values, "platform")
      const payment = read(values, "payment")
      const fixed = read(values, "fixed")
      if (pledge === null || platform === null || payment === null || fixed === null) return null
      const result = feeOn(pledge, platform + payment, fixed)
      return stats([
        ["Fees", money(result.fee)],
        ["You keep", money(result.net)],
      ])
    },
  },
  "concrete-calculator": {
    intro: "A 20 kg bag of pre-mix concrete is taken as about 0.01 m³.",
    columns: 3,
    fields: [number("length", "Length", "4", "m"), number("width", "Width", "3", "m"), number("depth", "Depth", "0.1", "m")],
    run: (values) => {
      const volume = volumeOf(values)
      if (volume === null) return null
      return stats([
        ["Volume", `${num(volume, 3)} m³`],
        ["20 kg bags", num(Math.ceil(volume / 0.01), 0)],
      ])
    },
  },
  "gravel-calculator": {
    intro: "Uses 1.5 tonnes per cubic metre, a typical loose-gravel density.",
    columns: 3,
    fields: [number("length", "Length", "6", "m"), number("width", "Width", "2", "m"), number("depth", "Depth", "0.05", "m")],
    run: (values) => {
      const volume = volumeOf(values)
      if (volume === null) return null
      return stats([
        ["Volume", `${num(volume, 2)} m³`],
        ["Weight", `${num(volume * 1.5, 2)} t`],
      ])
    },
  },
  "mulch-calculator": {
    columns: 3,
    fields: [number("length", "Length", "5", "m"), number("width", "Width", "1.2", "m"), number("depth", "Depth", "0.07", "m")],
    run: (values) => {
      const volume = volumeOf(values)
      if (volume === null) return null
      return stats([
        ["Volume", `${num(volume, 2)} m³`],
        ["Litres", num(volume * 1000, 0)],
      ])
    },
  },
  "roof-pitch-calculator": {
    fields: [number("rise", "Rise", "300", "mm"), number("run", "Run", "1000", "mm")],
    run: (values) => {
      const rise = read(values, "rise")
      const run = read(values, "run")
      if (!rise || !run) return null
      const result = pitch(rise, run)
      return stats([
        ["Pitch", `${num(result.angle, 1)}°`],
        ["Rafter", `${num(result.rafter, 0)} mm`],
        ["Slope factor", num(result.factor, 3)],
      ])
    },
  },
  "tile-calculator": {
    columns: 3,
    fields: [
      number("length", "Room length", "4.2", "m"),
      number("width", "Room width", "3.1", "m"),
      number("tile", "Tile size", "600", "mm"),
      number("waste", "Waste", "10", "%"),
    ],
    run: (values) => {
      const length = read(values, "length")
      const width = read(values, "width")
      const tile = read(values, "tile")
      const waste = read(values, "waste")
      if (!length || !width || !tile || waste === null) return null
      const tileArea = (tile / 1000) * (tile / 1000)
      const count = Math.ceil((length * width * (1 + waste / 100)) / tileArea)
      return stats([["Tiles", num(count, 0)]], { note: "Square tiles. Measure the actual tile if the pack size differs." })
    },
  },
  "drywall-calculator": {
    intro: "Sheets are 2400 × 1200 mm.",
    fields: [number("length", "Length", "6", "m"), number("height", "Height", "2.7", "m")],
    run: (values) => {
      const length = read(values, "length")
      const height = read(values, "height")
      if (!length || !height) return null
      return stats([["Sheets", num(Math.ceil((length * height) / (2.4 * 1.2)), 0)]])
    },
  },
  "fence-calculator": {
    columns: 3,
    fields: [number("length", "Length", "18", "m"), number("spacing", "Post spacing", "2.4", "m"), number("rails", "Rail rows", "2")],
    run: (values) => {
      const length = read(values, "length")
      const spacing = read(values, "spacing")
      const rails = read(values, "rails")
      if (!length || !spacing || rails === null) return null
      const posts = Math.floor(length / spacing) + 1
      return stats([
        ["Posts", num(posts, 0)],
        ["Rails", num((posts - 1) * rails, 0)],
      ])
    },
  },
  "deck-calculator": {
    columns: 2,
    fields: [
      number("length", "Length", "4.8", "m"),
      number("width", "Width", "3.6", "m"),
      number("board", "Board width", "90", "mm"),
      number("gap", "Gap", "5", "mm"),
    ],
    run: (values) => {
      const length = read(values, "length")
      const width = read(values, "width")
      const board = read(values, "board")
      const gap = read(values, "gap")
      if (!length || !width || !board || gap === null) return null
      const across = Math.ceil((width * 1000) / (board + gap))
      return stats([
        ["Boards", num(across, 0)],
        ["Each board", `${num(length, 2)} m`],
      ])
    },
  },
  "paver-calculator": {
    columns: 2,
    fields: [
      number("area", "Area", "24", "m²"),
      number("length", "Paver length", "200", "mm"),
      number("width", "Paver width", "100", "mm"),
      number("waste", "Waste", "10", "%"),
    ],
    run: (values) => {
      const area = read(values, "area")
      const length = read(values, "length")
      const width = read(values, "width")
      const waste = read(values, "waste")
      if (!area || !length || !width || waste === null) return null
      const count = Math.ceil((area / ((length / 1000) * (width / 1000))) * (1 + waste / 100))
      return stats([["Pavers", num(count, 0)]])
    },
  },
  "roofing-calculator": {
    fields: [number("area", "Plan area", "80", "m²"), number("rise", "Rise", "300", "mm"), number("run", "Run", "1000", "mm")],
    run: (values) => {
      const area = read(values, "area")
      const rise = read(values, "rise")
      const run = read(values, "run")
      if (!area || !rise || !run) return null
      return stats([["Roof area", `${num(area * pitch(rise, run).factor, 1)} m²`]])
    },
  },
  "roofing-shingle-calculator": {
    fields: [number("area", "Roof area", "90", "m²"), number("cover", "Cover per bundle", "3", "m²")],
    run: (values) => {
      const area = read(values, "area")
      const cover = read(values, "cover")
      if (!area || !cover) return null
      return stats([["Bundles", num(Math.ceil(area / cover), 0)]])
    },
  },
  "gutter-calculator": {
    intro: "One downpipe is allowed for every 8 metres of gutter.",
    fields: [number("length", "Gutter length", "22", "m")],
    run: (values) => {
      const length = read(values, "length")
      if (!length) return null
      return stats([
        ["Gutter", `${num(length, 1)} m`],
        ["Downpipes", num(Math.max(1, Math.ceil(length / 8)), 0)],
      ])
    },
  },
  "hvac-btu-calculator": {
    intro: "A rough guide of about 430 BTU per square metre. Have a technician size the real system.",
    fields: [number("area", "Floor area", "40", "m²")],
    run: (values) => {
      const area = read(values, "area")
      if (!area) return null
      const btu = area * 430
      return stats([
        ["BTU/h", num(btu, 0)],
        ["kW", num(btu / 3412, 2)],
      ])
    },
  },
  "board-foot-calculator": {
    columns: 2,
    fields: [
      number("thickness", "Thickness", "25", "mm"),
      number("width", "Width", "150", "mm"),
      number("length", "Length", "2.4", "m"),
      number("count", "Pieces", "8"),
    ],
    run: (values) => {
      const thickness = read(values, "thickness")
      const width = read(values, "width")
      const length = read(values, "length")
      const count = read(values, "count")
      if (!thickness || !width || !length || !count) return null
      const each = ((thickness / 25.4) * (width / 25.4) * (length * 3.28084)) / 12
      return stats([["Board feet", num(each * count, 1)]])
    },
  },
  "stair-stringer-calculator": {
    columns: 3,
    fields: [number("rise", "Total rise", "2700", "mm"), number("riser", "Target riser", "175", "mm"), number("going", "Going", "250", "mm")],
    run: (values) => {
      const rise = read(values, "rise")
      const riser = read(values, "riser")
      const going = read(values, "going")
      if (!rise || !riser || !going) return null
      const steps = Math.max(1, Math.round(rise / riser))
      const actual = rise / steps
      return stats([
        ["Risers", num(steps, 0)],
        ["Each riser", `${num(actual, 0)} mm`],
        ["Stringer", `${num((steps * Math.hypot(actual, going)) / 1000, 2)} m`],
      ])
    },
  },
  "stud-wall-calculator": {
    fields: [number("length", "Wall length", "4.8", "m"), number("spacing", "Centres", "450", "mm")],
    run: (values) => {
      const length = read(values, "length")
      const spacing = read(values, "spacing")
      if (!length || !spacing) return null
      return stats([["Studs", num(Math.floor((length * 1000) / spacing) + 1, 0)]])
    },
  },
  "construction-estimate-generator": {
    wide: true,
    intro: "One line each: a name, then the amount. Example: Framing, 2400",
    fields: [area("lines", "Lines", "Demolition, 800\nFraming, 2400\nFixing, 1600"), number("margin", "Margin", "15", "%")],
    run: (values) => {
      const estimate = estimateTotal(values.lines)
      const margin = read(values, "margin")
      if (margin === null) return null
      const markup = estimate.total * (margin / 100)
      return stats([
        ["Cost", money(estimate.total)],
        ["Margin", money(markup)],
        ["Price", money(estimate.total + markup)],
      ])
    },
  },
  "team-working-agreement": {
    wide: true,
    fields: [
      field("team", "Team", "text", "Studio"),
      field("hours", "Hours", "text", "We overlap 10:00–15:00 local."),
      field("response", "Response", "text", "Same day for a blocker, next day otherwise."),
      area("decisions", "How we decide", "The person doing the work proposes. We disagree in the open, then commit."),
    ],
    run: (values) => ({
      text: `${values.team} working agreement\n\nHours\n${values.hours}\n\nResponse\n${values.response}\n\nDecisions\n${values.decisions}`,
    }),
  },
  "meeting-agenda": {
    wide: true,
    fields: [
      field("title", "Meeting", "text", "Weekly studio"),
      field("date", "When", "text", "Monday 10:00"),
      area("items", "Items", "What shipped\nWhat is stuck\nWhat we will decide"),
    ],
    run: (values) => ({
      text: `${values.title}\n${values.date}\n\n${splitLines(values.items).map((item, index) => `${index + 1}. ${item}`).join("\n")}`,
    }),
  },
  "one-on-one-agenda": {
    wide: true,
    fields: [
      field("person", "With", "text", ""),
      area("wins", "Since last time", ""),
      area("blockers", "Blockers", ""),
      area("actions", "Actions", ""),
    ],
    run: (values) => ({
      text: `1:1${values.person.trim() ? ` with ${values.person.trim()}` : ""}\n\nSince last time\n${values.wins || "—"}\n\nBlockers\n${values.blockers || "—"}\n\nActions\n${values.actions || "—"}`,
    }),
  },
  "team-icebreaker": {
    random: true,
    action: "Another prompt",
    fields: [],
    run: () => ({ text: icebreakers[randomInt(0, icebreakers.length - 1)] }),
  },
  "character-counter": {
    wide: true,
    fields: [area("text", "Text", "Nice Build")],
    run: (values) =>
      stats([
        ["Characters", num(values.text.length, 0)],
        ["Without spaces", num(values.text.replace(/\s/g, "").length, 0)],
        ["Lines", num(values.text.split("\n").length, 0)],
      ]),
  },
  "readability-checker": {
    wide: true,
    fields: [area("text", "Text", "Nice Build is a quiet place for useful tools. Short sentences are easier to read.")],
    run: (values) => {
      const result = flesch(values.text)
      if (!result) return null
      return stats([
        ["Reading ease", num(result.score, 0)],
        ["Level", result.label],
      ], { note: "Flesch reading ease. Higher is easier. English only, and it is a guide." })
    },
  },
  "reading-time": {
    wide: true,
    fields: [area("text", "Text", "Nice Build is a quiet place for useful tools."), number("pace", "Words a minute", "220", "wpm")],
    run: (values) => {
      const pace = read(values, "pace")
      const words = values.text.trim() ? values.text.trim().split(/\s+/).length : 0
      if (!pace) return null
      const minutes = words / pace
      return stats([
        ["Words", num(words, 0)],
        ["Time", `${num(Math.floor(minutes), 0)}m ${num(Math.round((minutes % 1) * 60), 0)}s`],
      ])
    },
  },
  "lorem-ipsum": {
    fields: [number("count", "Paragraphs", "3", undefined, 1)],
    run: (values) => ({ text: lorem(Math.min(12, Math.max(1, Math.round(read(values, "count") ?? 1)))) }),
  },
  "remove-duplicate-lines": {
    wide: true,
    fields: [area("text", "Text", "oak\nash\noak\npine")],
    run: (values) => {
      const seen = new Set<string>()
      const lines = values.text.split("\n").filter((line) => {
        if (seen.has(line)) return false
        seen.add(line)
        return true
      })
      return { text: lines.join("\n") }
    },
  },
  "slug-generator": {
    fields: [field("title", "Title", "text", "Roof Pitch & Rafter Calculator")],
    run: (values) => ({ text: slugify(values.title) }),
  },
  "markdown-table": {
    wide: true,
    fields: [field("headers", "Headers", "text", "Name, Role, Note"), area("rows", "Rows", "Ada, Design, Colour\nLin, Build, Structure")],
    run: (values) => {
      const headers = values.headers.split(",").map((item) => item.trim())
      const rows = splitLines(values.rows).map((line) => line.split(",").map((item) => item.trim()))
      const render = (cells: string[]) => `| ${cells.join(" | ")} |`
      return { text: [render(headers), render(headers.map(() => "---")), ...rows.map(render)].join("\n") }
    },
  },
  "number-to-words": {
    fields: [number("value", "Number", "142", undefined, null)],
    run: (values) => {
      const value = read(values, "value")
      if (value === null) return null
      const words = numberToWords(value)
      return words ? { text: words } : { note: "Use a number up to 999 billion." }
    },
  },
  "text-cleaner": {
    wide: true,
    columns: 2,
    fields: [
      area("text", "Text", "  Hello   there  \n\n\nNext line  "),
      check("trim", "Trim lines", true),
      check("spaces", "Collapse spaces", true),
      check("blanks", "Collapse blank lines", true),
      check("quotes", "Straighten quotes", true),
    ],
    run: (values) => ({
      text: cleanText(values.text, {
        trim: values.trim === "yes",
        spaces: values.spaces === "yes",
        blanks: values.blanks === "yes",
        quotes: values.quotes === "yes",
      }),
    }),
  },
  "coin-flip": {
    random: true,
    action: "Flip",
    fields: [],
    run: () => ({ stats: [{ label: "Result", value: randomInt(0, 1) === 0 ? "Heads" : "Tails" }] }),
  },
  "random-number": {
    random: true,
    action: "Draw",
    fields: [number("min", "Minimum", "1", undefined, undefined), number("max", "Maximum", "100", undefined, undefined)],
    run: (values) => {
      const min = read(values, "min")
      const max = read(values, "max")
      if (min === null || max === null) return null
      return stats([["Number", String(randomInt(min, max))]])
    },
  },
  "random-choice": {
    wide: true,
    random: true,
    action: "Pick",
    fields: [area("list", "Options", "Ada\nLin\nNoor\nSam")],
    run: (values) => {
      const lines = splitLines(values.list)
      if (!lines.length) return null
      return { text: lines[randomInt(0, lines.length - 1)] }
    },
  },
  "recipe-scaler": {
    wide: true,
    intro: "A quantity at the start of a line is scaled. Fractions such as 1/2 or 1 1/2 are read.",
    fields: [number("from", "Current serves", "4"), number("to", "New serves", "6"), area("recipe", "Recipe", "2 cups flour\n1/2 tsp salt\n1 1/2 tbsp oil")],
    run: (values) => {
      const from = read(values, "from")
      const to = read(values, "to")
      if (!from || to === null) return null
      return { text: scaleRecipe(values.recipe, from, to) }
    },
  },
  "sensitivity-converter": {
    intro: "Source-style games often use a yaw of 0.022. Change it if your game uses another value.",
    columns: 3,
    fields: [number("dpi", "DPI", "800"), number("sensitivity", "Sensitivity", "1.2"), number("yaw", "Yaw", "0.022")],
    run: (values) => {
      const dpi = read(values, "dpi")
      const sensitivity = read(values, "sensitivity")
      const yaw = read(values, "yaw")
      if (!dpi || !sensitivity || !yaw) return null
      return stats([["cm / 360", num(cmPer360(dpi, sensitivity, yaw), 2)]])
    },
  },
  "edpi-calculator": {
    fields: [number("dpi", "DPI", "800"), number("sensitivity", "Sensitivity", "0.4")],
    run: (values) => {
      const dpi = read(values, "dpi")
      const sensitivity = read(values, "sensitivity")
      if (!dpi || sensitivity === null) return null
      return stats([["eDPI", num(dpi * sensitivity, 1)]])
    },
  },
  "monitor-ppi-calculator": {
    columns: 3,
    fields: [number("width", "Width", "2560", "px"), number("height", "Height", "1440", "px"), number("diagonal", "Diagonal", "27", "in")],
    run: (values) => {
      const width = read(values, "width")
      const height = read(values, "height")
      const diagonal = read(values, "diagonal")
      if (!width || !height || !diagonal) return null
      return stats([["PPI", num(ppi(width, height, diagonal), 1)]])
    },
  },
  "battery-runtime-calculator": {
    fields: [number("capacity", "Capacity", "3000", "mAh"), number("load", "Load", "250", "mA")],
    run: (values) => {
      const capacity = read(values, "capacity")
      const load = read(values, "load")
      if (!capacity || !load) return null
      return stats([["Runtime", formatDuration((capacity / load) * 3600)]])
    },
  },
  "crypto-profit-calculator": {
    columns: 2,
    fields: [
      number("quantity", "Quantity", "0.4"),
      number("entry", "Entry price", "90000", "AUD"),
      number("exit", "Exit price", "104000", "AUD"),
      number("fee", "Fee each side", "0.1", "%"),
    ],
    run: (values) => {
      const quantity = read(values, "quantity")
      const entry = read(values, "entry")
      const exit = read(values, "exit")
      const fee = read(values, "fee")
      if (quantity === null || entry === null || exit === null || fee === null) return null
      const cost = quantity * entry
      const proceeds = quantity * exit
      const fees = (cost + proceeds) * (fee / 100)
      const profit = proceeds - cost - fees
      return stats([
        ["Profit", money(profit)],
        ["Return", cost ? `${num((profit / cost) * 100)}%` : "—"],
      ])
    },
  },
  "crypto-dca-calculator": {
    columns: 2,
    fields: [
      number("each", "Each buy", "100", "AUD"),
      number("buys", "Buys", "12"),
      number("average", "Average price", "80", "AUD"),
      number("current", "Current price", "110", "AUD"),
    ],
    run: (values) => {
      const each = read(values, "each")
      const buys = read(values, "buys")
      const average = read(values, "average")
      const current = read(values, "current")
      if (!each || !buys || !average || current === null) return null
      const invested = each * buys
      const coins = invested / average
      const value = coins * current
      return stats([
        ["Invested", money(invested)],
        ["Value", money(value)],
        ["Profit", money(value - invested)],
      ])
    },
  },
  "crypto-staking-calculator": {
    columns: 2,
    fields: [number("amount", "Amount", "1000", "AUD"), number("apy", "APY", "5", "%"), number("days", "Days", "365"), check("compound", "Compound monthly")],
    run: (values) => {
      const amount = read(values, "amount")
      const apy = read(values, "apy")
      const days = read(values, "days")
      if (amount === null || apy === null || days === null) return null
      const earned = values.compound === "yes" ? amount * (1 + apy / 100 / 12) ** (days / 30.437) - amount : amount * (apy / 100) * (days / 365)
      return stats([
        ["Earned", money(earned)],
        ["Balance", money(amount + earned)],
      ])
    },
  },
  "crypto-position-size-calculator": {
    columns: 2,
    fields: [
      number("account", "Account", "10000", "AUD"),
      number("risk", "Risk", "1", "%"),
      number("entry", "Entry", "100", "AUD"),
      number("stop", "Stop", "95", "AUD"),
    ],
    run: (values) => {
      const account = read(values, "account")
      const risk = read(values, "risk")
      const entry = read(values, "entry")
      const stop = read(values, "stop")
      if (account === null || risk === null || !entry || stop === null || entry === stop) return null
      const riskAmount = account * (risk / 100)
      const units = riskAmount / Math.abs(entry - stop)
      return stats([
        ["Risk", money(riskAmount)],
        ["Size", num(units, 4)],
        ["Notional", money(units * entry)],
      ])
    },
  },
  "crypto-liquidation-calculator": {
    intro: "A simplified isolated-margin estimate. Exchanges add fees and their own maintenance schedule.",
    columns: 2,
    fields: [
      number("entry", "Entry", "100", "AUD"),
      number("leverage", "Leverage", "10", "×"),
      number("maintenance", "Maintenance", "0.5", "%"),
      select("side", "Side", "long", [["long", "Long"], ["short", "Short"]]),
    ],
    run: (values) => {
      const entry = read(values, "entry")
      const leverage = read(values, "leverage")
      const maintenance = read(values, "maintenance")
      if (!entry || !leverage || maintenance === null) return null
      const price = liquidationPrice(entry, leverage, maintenance, values.side)
      if (price === null) return { note: "Maintenance is higher than the margin, so this leverage does not hold." }
      return stats([["Liquidation", money(price)]])
    },
  },
  "crypto-gas-calculator": {
    columns: 3,
    fields: [number("gas", "Gas units", "21000"), number("gwei", "Gas price", "20", "gwei"), number("price", "Coin price", "4000", "AUD")],
    run: (values) => {
      const gas = read(values, "gas")
      const gwei = read(values, "gwei")
      const price = read(values, "price")
      if (gas === null || gwei === null || price === null) return null
      const coins = gas * gwei * 1e-9
      return stats([
        ["Fee", `${num(coins, 6)} coin`],
        ["In money", money(coins * price)],
      ])
    },
  },
  "crypto-apy-calculator": {
    columns: 3,
    fields: [
      select("direction", "Convert", "apr", [["apr", "APR to APY"], ["apy", "APY to APR"]]),
      number("rate", "Rate", "8", "%"),
      select("periods", "Compounds a year", "365", [["12", "12"], ["365", "365"]]),
    ],
    run: (values) => {
      const rate = read(values, "rate")
      const periods = Number(values.periods)
      if (rate === null) return null
      const result = values.direction === "apr" ? apyFromApr(rate, periods) * 100 : aprFromApy(rate, periods) * 100
      return stats([[values.direction === "apr" ? "APY" : "APR", `${num(result, 2)}%`]])
    },
  },
  "crypto-converter": {
    intro: "Uses the rate you type. There is no live market feed.",
    columns: 2,
    fields: [
      number("amount", "Amount", "1.5"),
      field("from", "From", "text", "ETH"),
      number("rate", "Price of 1", "4000", "AUD"),
      field("to", "To", "text", "AUD"),
    ],
    run: (values) => {
      const amount = read(values, "amount")
      const rate = read(values, "rate")
      if (amount === null || rate === null) return null
      return stats([[`${values.from || "From"} in ${values.to || "to"}`, num(amount * rate, 4)]])
    },
  },
  "impermanent-loss-calculator": {
    intro: "Compares a liquidity position with simply holding, after the price moves by this percent. Fees are not included.",
    fields: [number("change", "Price change", "100", "%", null)],
    run: (values) => {
      const change = read(values, "change")
      if (change === null || change <= -100) return null
      const loss = impermanentLoss(1 + change / 100) * 100
      return stats([["Versus holding", `${num(loss, 2)}%`]])
    },
  },
  ...addedSpecs,
}

function rpmSpec(rpm: string): ToolSpec {
  return {
    fields: [number("views", "Views", "100000"), number("rpm", "RPM", rpm, "AUD")],
    run: (values) => {
      const views = read(values, "views")
      const rate = read(values, "rpm")
      if (views === null || rate === null) return null
      return stats([["Earnings", money((views / 1000) * rate)]])
    },
  }
}

function pricedFees(values: Record<string, string>, percents: string[], fixedKey: string) {
  const price = read(values, "price")
  const cost = read(values, "cost")
  const fixed = read(values, fixedKey)
  const rates = percents.map((key) => read(values, key))
  if (price === null || cost === null || fixed === null || rates.some((rate) => rate === null)) return null
  let feeRate = 0
  for (const rate of rates) feeRate += rate ?? 0
  const fees = price * (feeRate / 100) + fixed
  return profitStats(price, cost, fees)
}

function profitStats(price: number, cost: number, fees: number) {
  const profit = price - cost - fees
  return stats([
    ["Fees", money(fees)],
    ["Profit", money(profit)],
    ["Margin", price ? `${num((profit / price) * 100)}%` : "—"],
  ])
}

function volumeOf(values: Record<string, string>) {
  const length = read(values, "length")
  const width = read(values, "width")
  const depth = read(values, "depth")
  if (!length || !width || !depth) return null
  return length * width * depth
}

function networkStats(ipText: string, prefix: number | null) {
  const ip = ipv4ToInt(ipText)
  if (ip === null || prefix === null) return { note: "Use an IPv4 address and a prefix from 0 to 32." }
  const info = subnetInfo(ip, prefix)
  if (!info) return { note: "Use a prefix from 0 to 32." }
  return stats([
    ["Network", info.network],
    ["Broadcast", info.broadcast],
    ["First host", info.first],
    ["Last host", info.last],
    ["Usable hosts", num(info.hosts, 0)],
    ["Mask", info.mask],
  ])
}

function splitLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean)
}

function decodeBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/")
  return decodeBase64(padded + "=".repeat((4 - (padded.length % 4)) % 4))
}

function prettyJson(value: string) {
  return JSON.stringify(JSON.parse(value), null, 2)
}

function hexChannels(value: string) {
  const hex = value.trim().replace(/^#/, "")
  const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return { r: Number.parseInt(full.slice(0, 2), 16), g: Number.parseInt(full.slice(2, 4), 16), b: Number.parseInt(full.slice(4, 6), 16) }
}

function colourStats(value: string): SpecResult | null {
  const rgb = hexChannels(value)
  if (!rgb) return { note: "Use a hex colour such as #ff0101." }
  const hex = `#${[rgb.r, rgb.g, rgb.b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }
  return stats(
    [
      ["Hex", hex],
      ["RGB", `${rgb.r}, ${rgb.g}, ${rgb.b}`],
      ["HSL", `${num(hue, 0)} ${num(saturation * 100, 0)}% ${num(lightness * 100, 0)}%`],
    ],
    { demo: { background: hex } },
  )
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a)
}

function formatXml(source: string) {
  if (typeof DOMParser === "undefined") return ""
  const doc = new DOMParser().parseFromString(source, "application/xml")
  if (doc.querySelector("parsererror")) throw new Error("That XML could not be parsed.")
  return serializeXml(doc.documentElement, 0)
}

function serializeXml(node: Element, depth: number): string {
  const pad = "  ".repeat(depth)
  const attrs = [...node.attributes].map((attr) => ` ${attr.name}="${attr.value}"`).join("")
  const children = [...node.children]
  if (!children.length) {
    const text = node.textContent?.trim() ?? ""
    return text ? `${pad}<${node.tagName}${attrs}>${htmlEncode(text)}</${node.tagName}>` : `${pad}<${node.tagName}${attrs} />`
  }
  return `${pad}<${node.tagName}${attrs}>\n${children.map((child) => serializeXml(child, depth + 1)).join("\n")}\n${pad}</${node.tagName}>`
}
