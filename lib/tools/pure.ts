export function evaluateExpression(input: string) {
  const source = input.replace(/\s+/g, "")
  if (!source) return null
  let index = 0

  function parseExpression(): number {
    let value = parseTerm()
    while (source[index] === "+" || source[index] === "-") {
      const operator = source[index++]
      const right = parseTerm()
      value = operator === "+" ? value + right : value - right
    }
    return value
  }

  function parseTerm(): number {
    let value = parseFactor()
    while (source[index] === "*" || source[index] === "/" || source[index] === "%") {
      const operator = source[index++]
      const right = parseFactor()
      if (operator === "*") value *= right
      else if (operator === "/") value /= right
      else value %= right
    }
    return value
  }

  function parseFactor(): number {
    if (source[index] === "+") {
      index += 1
      return parseFactor()
    }
    if (source[index] === "-") {
      index += 1
      return -parseFactor()
    }
    if (source[index] === "(") {
      index += 1
      const value = parseExpression()
      if (source[index] !== ")") throw new Error("Missing a closing bracket.")
      index += 1
      return value
    }
    const start = index
    if (source[index] === ".") index += 1
    while (index < source.length && /[0-9.]/.test(source[index])) index += 1
    if (start === index) throw new Error("That expression is not valid.")
    const value = Number(source.slice(start, index))
    if (!Number.isFinite(value)) throw new Error("That expression is not valid.")
    return value
  }

  const value = parseExpression()
  if (index !== source.length || !Number.isFinite(value)) throw new Error("That expression is not valid.")
  return value
}

export function loanPayment(principal: number, annualRate: number, years: number) {
  const months = years * 12
  const monthly = annualRate / 100 / 12
  const payment =
    monthly === 0 ? principal / months : (principal * monthly) / (1 - (1 + monthly) ** -months)
  const total = payment * months
  return { payment, total, interest: total - principal }
}

export function futureValue(principal: number, annualRate: number, years: number, compounds: number, deposit: number) {
  const rate = annualRate / 100 / compounds
  const periods = years * compounds
  const grown = principal * (1 + rate) ** periods
  const deposits = rate === 0 ? deposit * periods : deposit * (((1 + rate) ** periods - 1) / rate)
  return grown + deposits
}

export function australianTakeHome(income: number) {
  const bands = [
    { up: 18200, rate: 0 },
    { up: 45000, rate: 0.16 },
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
  const medicare = income > 0 ? income * 0.02 : 0
  return { tax, medicare, takeHome: income - tax - medicare }
}

export function bmi(weightKg: number, heightCm: number) {
  const metres = heightCm / 100
  const value = weightKg / (metres * metres)
  const label =
    value < 18.5 ? "Underweight" : value < 25 ? "Healthy weight" : value < 30 ? "Overweight" : "Obese"
  return { value, label }
}

export function bmr(sex: string, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === "female" ? base - 161 : base + 5
}

export function activityFactor(level: string) {
  const factors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9,
  }
  return factors[level] ?? 1.2
}

const gradePoints: Record<string, number> = {
  "a+": 4,
  a: 4,
  "a-": 3.7,
  "b+": 3.3,
  b: 3,
  "b-": 2.7,
  "c+": 2.3,
  c: 2,
  "c-": 1.7,
  d: 1,
  f: 0,
}

export function gpaFromLines(source: string) {
  const rows = source
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  let points = 0
  let credits = 0
  for (const line of rows) {
    const match = line.match(/^([A-Fa-f][+-]?)\s+(\d+(?:\.\d+)?)$/)
    if (!match) throw new Error(`Could not read “${line}”. Use a letter grade, then credits, such as A- 3.`)
    const grade = gradePoints[match[1].toLowerCase()]
    const credit = Number(match[2])
    if (grade === undefined || credit <= 0) throw new Error(`Could not read “${line}”.`)
    points += grade * credit
    credits += credit
  }
  if (!credits) return null
  return { gpa: points / credits, credits }
}

export function letterGrade(percent: number) {
  if (percent >= 90) return "A"
  if (percent >= 80) return "B"
  if (percent >= 70) return "C"
  if (percent >= 60) return "D"
  return "F"
}

const unitGroups = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
  weight: { mg: 0.000001, g: 0.001, kg: 1, oz: 0.0283495, lb: 0.453592 },
  volume: { ml: 0.001, L: 1, tsp: 0.00492892, tbsp: 0.0147868, cup: 0.236588, "fl oz": 0.0295735 },
  area: { "m²": 1, "ft²": 0.092903, acre: 4046.86 },
} as const

export function convertUnit(value: number, from: string, to: string) {
  if (from === to) return value
  const temps = new Set(["°C", "°F", "K"])
  if (temps.has(from) || temps.has(to)) {
    if (!temps.has(from) || !temps.has(to)) throw new Error("Choose two units of the same kind.")
    let celsius = value
    if (from === "°F") celsius = ((value - 32) * 5) / 9
    if (from === "K") celsius = value - 273.15
    if (to === "°C") return celsius
    if (to === "°F") return (celsius * 9) / 5 + 32
    return celsius + 273.15
  }
  for (const group of Object.values(unitGroups)) {
    const table = group as Record<string, number>
    if (from in table && to in table) return (value * table[from]) / table[to]
  }
  throw new Error("Choose two units of the same kind.")
}

export function clockSeconds(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] ?? 0)
  if (hours > 23 || minutes > 59 || seconds > 59) return null
  return hours * 3600 + minutes * 60 + seconds
}

export function formatDuration(total: number) {
  const sign = total < 0 ? "−" : ""
  const seconds = Math.abs(Math.round(total))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remain = seconds % 60
  return `${sign}${hours}h ${minutes}m ${remain}s`
}

export function dateSpan(start: string, end: string) {
  const from = new Date(`${start}T00:00:00`)
  const to = new Date(`${end}T00:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  const days = Math.round((to.getTime() - from.getTime()) / 86400000)
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  return { days, weeks: days / 7, months }
}

export function salesTax(amount: number, rate: number, mode: string) {
  if (mode === "extract") {
    const net = amount / (1 + rate / 100)
    return { net, tax: amount - net, total: amount }
  }
  const tax = amount * (rate / 100)
  return { net: amount, tax, total: amount + tax }
}

export function feeOn(amount: number, percent: number, fixed: number) {
  const fee = amount * (percent / 100) + fixed
  return { fee, net: amount - fee }
}

export function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else quoted = false
      } else cell += char
    } else if (char === '"') quoted = true
    else if (char === ",") {
      row.push(cell)
      cell = ""
    } else if (char === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (char !== "\r") cell += char
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((item) => item.some((part) => part.trim()))
}

export function csvFromObjects(value: unknown) {
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
    throw new Error("JSON should be an array of objects.")
  }
  const records = value as Record<string, unknown>[]
  const headers = [...new Set(records.flatMap((item) => Object.keys(item)))]
  const escape = (cell: unknown) => {
    const text = cell === null || cell === undefined ? "" : String(cell)
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  return [headers.join(","), ...records.map((item) => headers.map((key) => escape(item[key])).join(","))].join("\n")
}

export function objectsFromCsv(text: string) {
  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error("Add a header row and at least one data row.")
  const [headers, ...body] = rows
  return body.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])))
}

export function formatSql(source: string) {
  const clauses = [
    "order by",
    "group by",
    "insert into",
    "left join",
    "right join",
    "inner join",
    "union all",
    "select",
    "from",
    "where",
    "having",
    "limit",
    "offset",
    "join",
    "union",
    "values",
    "update",
    "set",
  ]
  let text = source.replace(/\s+/g, " ").trim()
  for (const clause of clauses) {
    const pattern = new RegExp(`\\b${clause}\\b`, "gi")
    text = text.replace(pattern, `\n${clause.toUpperCase()}`)
  }
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
}

export function formatCode(source: string) {
  const trimmed = source.trim()
  if (!trimmed) return ""
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2)
  } catch {
    let pad = 0
    let out = ""
    for (const char of trimmed) {
      if (char === "}") pad = Math.max(0, pad - 1)
      if (char === "\n") continue
      if (char === "}" || char === "{") {
        if (char === "}" && out && !out.endsWith("\n")) out += "\n"
        out += `${"  ".repeat(pad)}${char}\n`
        if (char === "{") pad += 1
        continue
      }
      if (out.endsWith("\n")) out += "  ".repeat(pad)
      out += char
    }
    return out.trim()
  }
}

type PathToken =
  | { type: "key"; key: string }
  | { type: "index"; index: number }
  | { type: "wild" }
  | { type: "deep"; key: string }

export function queryJsonPath(data: unknown, path: string) {
  const trimmed = path.trim()
  if (!trimmed.startsWith("$")) throw new Error("A path starts with $.")
  const tokens = tokenizePath(trimmed.slice(1))
  let current = [data]
  for (const token of tokens) {
    const next: unknown[] = []
    for (const item of current) {
      if (token.type === "key") {
        if (item && typeof item === "object" && !Array.isArray(item) && token.key in item) {
          next.push((item as Record<string, unknown>)[token.key])
        }
      } else if (token.type === "index") {
        if (Array.isArray(item)) next.push(item[token.index])
      } else if (token.type === "wild") {
        if (Array.isArray(item)) next.push(...item)
        else if (item && typeof item === "object") next.push(...Object.values(item))
      } else collectDeep(item, token.key, next)
    }
    current = next
  }
  return current
}

function tokenizePath(source: string) {
  const tokens: PathToken[] = []
  let index = 0
  while (index < source.length) {
    if (source.startsWith("..", index)) {
      index += 2
      const key = readIdent(source, index)
      index = key.next
      tokens.push({ type: "deep", key: key.value })
    } else if (source[index] === ".") {
      index += 1
      const key = readIdent(source, index)
      index = key.next
      tokens.push({ type: "key", key: key.value })
    } else if (source[index] === "[") {
      index += 1
      if (source[index] === "*") {
        tokens.push({ type: "wild" })
        index += 1
      } else if (source[index] === "'" || source[index] === '"') {
        const quote = source[index]
        const end = source.indexOf(quote, index + 1)
        if (end < 0) throw new Error("That path is not valid.")
        tokens.push({ type: "key", key: source.slice(index + 1, end) })
        index = end + 1
      } else {
        const end = source.indexOf("]", index)
        const value = Number(source.slice(index, end))
        if (!Number.isInteger(value)) throw new Error("That path is not valid.")
        tokens.push({ type: "index", index: value })
        index = end
      }
      if (source[index] !== "]") throw new Error("That path is not valid.")
      index += 1
    } else throw new Error("That path is not valid.")
  }
  return tokens
}

function readIdent(source: string, start: number) {
  let index = start
  while (index < source.length && /[A-Za-z0-9_-]/.test(source[index])) index += 1
  if (index === start) throw new Error("That path is not valid.")
  return { value: source.slice(start, index), next: index }
}

function collectDeep(value: unknown, key: string, into: unknown[]) {
  if (!value || typeof value !== "object") return
  if (!Array.isArray(value) && key in value) into.push((value as Record<string, unknown>)[key])
  for (const child of Array.isArray(value) ? value : Object.values(value)) collectDeep(child, key, into)
}

export function parseYaml(source: string) {
  const lines: { indent: number; text: string; line: number }[] = []
  source.split(/\r?\n/).forEach((raw, index) => {
    if (raw.includes("\t")) throw new Error(`Line ${index + 1}: use spaces instead of tabs.`)
    if (!raw.trim() || /^\s*#/.test(raw)) return
    lines.push({ indent: raw.match(/^ */)?.[0].length ?? 0, text: raw.trim(), line: index + 1 })
  })
  let index = 0
  const peek = () => lines[index]

  function parseValue(token: string, line: number): unknown {
    if (token === "|" || token === ">") throw new Error(`Line ${line}: multi-line text is not supported.`)
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      return token.slice(1, -1)
    }
    if (token === "true") return true
    if (token === "false") return false
    if (token === "null" || token === "~") return null
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token)
    return token
  }

  function parseBlock(minIndent: number): unknown {
    const current = peek()
    if (!current || current.indent < minIndent) return null
    if (current.text.startsWith("- ")) return parseSeq(current.indent)
    return parseMap(current.indent)
  }

  function parseMap(indent: number) {
    const map: Record<string, unknown> = {}
    while (peek() && peek().indent === indent && !peek().text.startsWith("- ")) {
      const row = lines[index++]
      const match = row.text.match(/^([^:]+):(.*)$/)
      if (!match) throw new Error(`Line ${row.line}: expected a key.`)
      const key = match[1].trim()
      const rest = match[2].trim()
      if (rest) map[key] = parseValue(rest, row.line)
      else if (peek() && peek().indent > indent) map[key] = parseBlock(indent + 1)
      else map[key] = null
    }
    return map
  }

  function parseSeq(indent: number) {
    const seq: unknown[] = []
    while (peek() && peek().indent === indent && peek().text.startsWith("- ")) {
      const row = lines[index++]
      const rest = row.text.slice(2).trim()
      if (/^[^:]+:/.test(rest)) {
        const item: Record<string, unknown> = {}
        const match = rest.match(/^([^:]+):(.*)$/)
        if (!match) throw new Error(`Line ${row.line}: expected a key.`)
        const inline = match[2].trim()
        item[match[1].trim()] = inline ? parseValue(inline, row.line) : null
        while (peek() && peek().indent > indent && !peek().text.startsWith("- ")) {
          const child = lines[index++]
          const childMatch = child.text.match(/^([^:]+):(.*)$/)
          if (!childMatch) throw new Error(`Line ${child.line}: expected a key.`)
          const childRest = childMatch[2].trim()
          item[childMatch[1].trim()] = childRest ? parseValue(childRest, child.line) : null
        }
        seq.push(item)
      } else if (!rest && peek() && peek().indent > indent) seq.push(parseBlock(indent + 1))
      else seq.push(parseValue(rest, row.line))
    }
    return seq
  }

  if (!lines.length) return null
  const value = parseBlock(lines[0].indent)
  if (index < lines.length) throw new Error(`Line ${lines[index].line}: could not read this part.`)
  return value
}

export function ipv4ToInt(input: string) {
  const parts = input.trim().split(".")
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    value = (value << 8) + octet
  }
  return value >>> 0
}

export function intToIpv4(value: number) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".")
}

export function subnetInfo(ip: number, prefix: number) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const network = (ip & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const hosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : 2 ** (32 - prefix) - 2
  const first = prefix >= 31 ? network : (network + 1) >>> 0
  const last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0
  return { mask: intToIpv4(mask), network: intToIpv4(network), broadcast: intToIpv4(broadcast), first: intToIpv4(first), last: intToIpv4(last), hosts }
}

export function chmodMode(flags: boolean[]) {
  const chunks = [0, 1, 2].map((group) => flags.slice(group * 3, group * 3 + 3))
  const octal = chunks.map((chunk) => chunk.reduce((sum, on, index) => sum + (on ? [4, 2, 1][index] : 0), 0)).join("")
  const symbol = flags.map((on, index) => (on ? "rwx"[index % 3] : "-")).join("")
  return { octal, symbol }
}

export function describeCron(minute: string, hour: string, day: string, month: string, weekday: string) {
  const expression = `${minute} ${hour} ${day} ${month} ${weekday}`
  const minuteText = minute === "*" ? "every minute" : minute.startsWith("*/") ? `every ${minute.slice(2)} minutes` : `at minute ${minute}`
  const hourText = hour === "*" ? "" : hour.startsWith("*/") ? `, every ${hour.slice(2)} hours` : `, during hour ${hour}`
  const dayText =
    weekday === "*" ? "" : weekday === "1-5" ? " on weekdays" : ` on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(weekday)] ?? `weekday ${weekday}`}`
  return { expression, sentence: `Runs ${minuteText}${hourText}${dayText}.` }
}

export function htmlEncode(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

export function htmlDecode(text: string) {
  return text.replaceAll("&quot;", '"').replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&")
}

export function encodeBase64(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

export function decodeBase64(text: string) {
  const binary = atob(text.trim())
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function syllables(word: string) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!cleaned) return 0
  const groups = cleaned.match(/[aeiouy]+/g)
  let count = groups?.length ?? 1
  if (cleaned.endsWith("e") && count > 1) count -= 1
  return Math.max(1, count)
}

export function flesch(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const words = trimmed.split(/\s+/).filter(Boolean)
  const sentences = trimmed.split(/[.!?]+/).filter((part) => part.trim()).length || 1
  const syllableCount = words.reduce((sum, word) => sum + syllables(word), 0)
  const score = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllableCount / words.length)
  const label =
    score >= 90 ? "Very easy" : score >= 70 ? "Fairly easy" : score >= 60 ? "Plain" : score >= 50 ? "Fairly hard" : "Hard"
  return { score, label, words: words.length, sentences, syllables: syllableCount }
}

export function numberToWords(value: number): string | null {
  if (!Number.isFinite(value)) return null
  if (!Number.isInteger(value)) {
    const [whole, fraction] = String(Math.abs(value)).split(".")
    const words = `${numberToWords(value < 0 ? -Number(whole) : Number(whole))} point ${fraction
      .split("")
      .map((digit) => ones[Number(digit)])
      .join(" ")}`
    return words
  }
  if (value < 0) return `minus ${numberToWords(-value)}`
  if (value === 0) return "zero"
  if (value > 999_999_999_999) return null
  const scales = ["", "thousand", "million", "billion"]
  const parts: string[] = []
  let rest = value
  let scale = 0
  while (rest > 0) {
    const chunk = rest % 1000
    if (chunk) parts.unshift(`${chunkToWords(chunk)}${scales[scale] ? ` ${scales[scale]}` : ""}`)
    rest = Math.floor(rest / 1000)
    scale += 1
  }
  return parts.join(" ").replace(/\s+/g, " ").trim()
}

const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

function chunkToWords(value: number) {
  const words: string[] = []
  if (value >= 100) {
    words.push(`${ones[Math.floor(value / 100)]} hundred`)
    value %= 100
    if (value) words.push("and")
  }
  if (value >= 20) {
    words.push(tens[Math.floor(value / 10)])
    if (value % 10) words.push(ones[value % 10])
  } else if (value >= 10) words.push(teens[value - 10])
  else if (value > 0) words.push(ones[value])
  return words.join(" ")
}

export function cleanText(text: string, options: { trim: boolean; spaces: boolean; blanks: boolean; quotes: boolean }) {
  let next = text.replaceAll("\u2018", "'").replaceAll("\u2019", "'").replaceAll("\u201c", '"').replaceAll("\u201d", '"')
  if (!options.quotes) next = text
  if (options.quotes) {
    next = text.replaceAll("\u2018", "'").replaceAll("\u2019", "'").replaceAll("\u201c", '"').replaceAll("\u201d", '"')
  }
  let lines = next.split(/\n/)
  if (options.trim) lines = lines.map((line) => line.trim())
  if (options.spaces) lines = lines.map((line) => line.replace(/[ \t]{2,}/g, " "))
  next = lines.join("\n")
  if (options.blanks) next = next.replace(/\n{3,}/g, "\n\n")
  return next.trim()
}

export function scaleRecipe(source: string, from: number, to: number) {
  const factor = to / from
  return source
    .split("\n")
    .map((line) =>
      line.replace(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/, (match) => {
        const amount = match.includes("/")
          ? match.split(/\s+/).reduce((sum, part) => {
              const [a, b] = part.split("/")
              return sum + (b ? Number(a) / Number(b) : Number(a))
            }, 0)
          : Number(match)
        const scaled = amount * factor
        return String(Math.round(scaled * 100) / 100)
      }),
    )
    .join("\n")
}

export function estimateTotal(source: string) {
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  let total = 0
  const rows: { name: string; amount: number }[] = []
  for (const line of lines) {
    const match = line.match(/^(.+?)[,:\s]+(-?\d+(?:\.\d+)?)$/)
    if (!match) throw new Error(`Could not read “${line}”. Use a name, then an amount.`)
    const amount = Number(match[2])
    rows.push({ name: match[1].trim(), amount })
    total += amount
  }
  return { rows, total }
}

export function ppi(width: number, height: number, diagonal: number) {
  return Math.sqrt(width * width + height * height) / diagonal
}

export function cmPer360(dpi: number, sensitivity: number, yaw: number) {
  return (2.54 * 360) / (dpi * sensitivity * yaw)
}

export function liquidationPrice(entry: number, leverage: number, maintenance: number, side: string) {
  const move = 1 / leverage - maintenance / 100
  if (move <= 0) return null
  return side === "short" ? entry * (1 + move) : entry * (1 - move)
}

export function impermanentLoss(ratio: number) {
  return (2 * Math.sqrt(ratio)) / (1 + ratio) - 1
}

export function apyFromApr(apr: number, periods: number) {
  return (1 + apr / 100 / periods) ** periods - 1
}

export function aprFromApy(apy: number, periods: number) {
  return periods * ((1 + apy / 100) ** (1 / periods) - 1)
}

const loremWords = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ")

export function lorem(paragraphs: number) {
  return Array.from({ length: paragraphs }, (_, index) => {
    const count = 18 + (index % 5) * 4
    const words = Array.from({ length: count }, (__, word) => loremWords[(index * 7 + word) % loremWords.length])
    const sentence = words.join(" ")
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + "."
  }).join("\n\n")
}

export function password(length: number, numbers: boolean, symbols: boolean) {
  let alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  if (numbers) alphabet += "23456789"
  if (symbols) alphabet += "!@#$%^&*-_?"
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")
}

export function randomInt(min: number, max: number) {
  const low = Math.ceil(Math.min(min, max))
  const high = Math.floor(Math.max(min, max))
  const span = high - low + 1
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return low + (bytes[0] % span)
}

export const icebreakers = [
  "What is a small thing that made today better?",
  "Which tool or habit has saved you the most time this month?",
  "What is a skill you would like to be comfortably average at?",
  "If the team had one free hour this week, what should it go toward?",
  "What is a piece of advice you ignored, then later wished you had taken?",
  "What is something you recently changed your mind about?",
  "Which meeting on your calendar could be a note instead?",
  "What is a detail in your work that most people never notice?",
  "Who outside this team has taught you something useful lately?",
  "What would you automate first if it took an afternoon?",
  "What is a question you wish people asked you more often?",
  "What is a hill you are happy to stop defending?",
]

export function pitch(rise: number, run: number) {
  const angle = (Math.atan(rise / run) * 180) / Math.PI
  const rafter = Math.sqrt(rise * rise + run * run)
  return { angle, rafter, factor: rafter / run }
}
