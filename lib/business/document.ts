import { documentTotals, lineTotal, parseMoney, parseRate, roundCents, type DocTotals } from "./money"

export type DocKind = "invoice" | "quote"

export type Party = {
  name: string
  address: string
  email: string
  phone: string
  abn: string
}

export type LineItem = {
  id: string
  description: string
  qty: string
  rate: string
}

export type BusinessDocument = {
  kind: DocKind
  from: Party
  to: Party
  number: string
  issueDate: string
  dueDate: string
  terms: string
  project: string
  notes: string
  taxRate: string
  taxInclusive: boolean
  lines: LineItem[]
}

export function emptyParty(): Party {
  return { name: "", address: "", email: "", phone: "", abn: "" }
}

export function newLine(partial?: Partial<LineItem>): LineItem {
  return {
    id: `l${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    qty: "1",
    rate: "",
    ...partial,
  }
}

export function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function addDaysIso(iso: string, days: number) {
  const date = parseIsoDate(iso)
  if (!date) return iso
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function formatDateAu(iso: string) {
  const date = parseIsoDate(iso)
  if (!date) return iso || "—"
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
}

export function defaultDocument(kind: DocKind): BusinessDocument {
  const issue = todayIso()
  return {
    kind,
    from: {
      name: "North Studio",
      address: "12 Peel Street\nAdelaide SA 5000",
      email: "hello@northstudio.com.au",
      phone: "0412 000 000",
      abn: "12 345 678 901",
    },
    to: {
      name: "River & Co",
      address: "40 Hindley Street\nAdelaide SA 5000",
      email: "accounts@riverandco.com.au",
      phone: "",
      abn: "",
    },
    number: kind === "invoice" ? "INV-104" : "Q-104",
    issueDate: issue,
    dueDate: addDaysIso(issue, kind === "invoice" ? 14 : 30),
    terms: kind === "invoice" ? "Net 14" : "Valid for 30 days",
    project: kind === "quote" ? "Shopfront refresh" : "",
    notes:
      kind === "invoice"
        ? "Please pay by the due date. EFT to the account on file."
        : "This quote is an offer to carry out the work listed. It is not a request for payment.",
    taxRate: "10",
    taxInclusive: false,
    lines: [
      newLine({ description: "Design and documentation", qty: "1", rate: "1200" }),
      newLine({ description: "On-site workshop", qty: "2", rate: "180" }),
    ],
  }
}

export function blankDocument(kind: DocKind): BusinessDocument {
  const issue = todayIso()
  return {
    kind,
    from: emptyParty(),
    to: emptyParty(),
    number: kind === "invoice" ? "INV-001" : "Q-001",
    issueDate: issue,
    dueDate: addDaysIso(issue, kind === "invoice" ? 14 : 30),
    terms: kind === "invoice" ? "Net 14" : "Valid for 30 days",
    project: "",
    notes: "",
    taxRate: "10",
    taxInclusive: false,
    lines: [newLine()],
  }
}

export function nextNumber(value: string) {
  const match = /^(.*?)(\d+)$/.exec(value.trim())
  if (!match) return value
  return `${match[1]}${String(Number(match[2]) + 1).padStart(match[2].length, "0")}`
}

export function quoteAsInvoice(quote: BusinessDocument): BusinessDocument {
  const issue = todayIso()
  const stripped = quote.number.replace(/^Q-?/i, "")
  const disclaimer = /this quote is an offer[\s\S]*?request for payment\.?/i
  const cleaned = quote.notes.replace(disclaimer, "").trim()
  return {
    ...quote,
    kind: "invoice",
    number: `INV-${stripped || "001"}`,
    issueDate: issue,
    dueDate: addDaysIso(issue, 14),
    terms: "Net 14",
    notes: cleaned
      ? `${cleaned}\n\nConverted from quote ${quote.number}. Please pay by the due date.`
      : `Converted from quote ${quote.number}. Please pay by the due date.`,
  }
}

export function readProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BusinessProfile
    if (!parsed || typeof parsed.name !== "string") return null
    return {
      name: parsed.name ?? "",
      address: parsed.address ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      abn: parsed.abn ?? "",
    }
  } catch {
    return null
  }
}

export function writeProfile(party: Party) {
  window.localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      name: party.name,
      address: party.address,
      email: party.email,
      phone: party.phone,
      abn: party.abn,
    } satisfies BusinessProfile),
  )
}

export function withProfile(doc: BusinessDocument, profile: BusinessProfile | null): BusinessDocument {
  if (!profile) return doc
  return { ...doc, from: { ...doc.from, ...profile } }
}

export function parsedLines(lines: LineItem[]) {
  return lines.map((line) => {
    const qty = parseRate(line.qty)
    const rate = parseMoney(line.rate)
    const qtyOk = qty !== null && qty > 0
    const rateOk = rate !== null && rate >= 0
    return {
      ...line,
      qtyValue: qty,
      rateValue: rate,
      amount: qtyOk && rateOk ? lineTotal(qty, rate) : null,
      error:
        line.qty !== "" && !qtyOk
          ? "Enter a quantity greater than 0."
          : line.rate !== "" && !rateOk
            ? "Enter a price of $0 or more."
            : null,
    }
  })
}

export function totalsFor(doc: BusinessDocument): DocTotals {
  const lines = parsedLines(doc.lines)
    .filter((line) => line.amount !== null)
    .map((line) => ({ qty: line.qtyValue ?? 0, rate: line.rateValue ?? 0 }))
  const tax = parseRate(doc.taxRate)
  return documentTotals(lines, tax ?? 0, doc.taxInclusive)
}

export function documentIssues(doc: BusinessDocument) {
  const issues: string[] = []
  if (!doc.from.name.trim()) issues.push("Add your business name.")
  if (!doc.to.name.trim()) issues.push("Add the customer name.")
  if (!doc.number.trim()) issues.push("Add a number.")
  if (!parseIsoDate(doc.issueDate)) issues.push("Enter a valid issue date.")
  if (doc.dueDate && !parseIsoDate(doc.dueDate)) {
    issues.push(doc.kind === "invoice" ? "Enter a valid due date." : "Enter a valid expiry date.")
  }
  const tax = parseRate(doc.taxRate)
  if (doc.taxRate !== "" && (tax === null || tax < 0)) issues.push("Enter a tax rate of 0% or more.")
  const lines = parsedLines(doc.lines)
  if (!lines.some((line) => line.description.trim() && line.amount !== null && (line.amount ?? 0) >= 0)) {
    issues.push("Add at least one line with a description, quantity, and price.")
  }
  for (const line of lines) {
    if (line.error) issues.push(line.error)
  }
  return [...new Set(issues)]
}

export function documentReady(doc: BusinessDocument) {
  return documentIssues(doc).length === 0
}

export function filenameFor(doc: BusinessDocument) {
  const slug = (doc.number || doc.kind).replace(/[^\w.-]+/g, "-").toLowerCase()
  return `${doc.kind}-${slug}.pdf`
}

export function copySummary(doc: BusinessDocument) {
  const totals = totalsFor(doc)
  const noun = doc.kind === "invoice" ? "Invoice" : "Quote"
  const dueLabel = doc.kind === "invoice" ? "Due" : "Valid until"
  const lines = parsedLines(doc.lines)
    .filter((line) => line.description.trim())
    .map((line) => `${line.description} · ${line.qty} × ${line.rate} = ${line.amount === null ? "—" : formatAud(line.amount)}`)
    .join("\n")
  return [
    `${noun} ${doc.number}`.trim(),
    `From ${doc.from.name}`,
    `To ${doc.to.name}`,
    `Issued ${formatDateAu(doc.issueDate)}`,
    doc.dueDate ? `${dueLabel} ${formatDateAu(doc.dueDate)}` : "",
    lines,
    `Subtotal ${formatAud(totals.subtotal)}`,
    `GST (${doc.taxRate || 0}%) ${formatAud(totals.tax)}`,
    `Total ${formatAud(totals.total)} AUD`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatAud(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(roundCents(value))
}

export type BusinessProfile = Pick<Party, "name" | "address" | "email" | "phone" | "abn">

export const PROFILE_KEY = "nb-business-profile"
export const TRANSFER_KEY = "nb-quote-to-invoice"

export function termsToDays(terms: string) {
  const match = /(\d+)/.exec(terms)
  if (!match) return terms.toLowerCase().includes("receipt") ? 0 : 14
  return Number(match[1])
}
