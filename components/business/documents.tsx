"use client"

import {
  ActionBar,
  AreaField,
  BusinessShell,
  CopyButton,
  DateField,
  IssueList,
  PercentField,
  PrivacyNote,
  ResetButton,
  Section,
  TextField,
  TotalsPanel,
  escapeHtml,
  printHtml,
  useLocalItem,
  useSessionItem,
} from "@/components/business/kit"
import { selectClass } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  addDaysIso,
  blankDocument,
  copySummary,
  defaultDocument,
  documentIssues,
  documentReady,
  formatAud,
  formatDateAu,
  newLine,
  nextNumber,
  parsedLines,
  quoteAsInvoice,
  readProfile,
  termsToDays,
  totalsFor,
  PROFILE_KEY,
  TRANSFER_KEY,
  withProfile,
  writeProfile,
  type BusinessDocument,
  type DocKind,
  type LineItem,
  type Party,
} from "@/lib/business/document"
import { documentPdf } from "@/lib/business/pdf"
import { downloadBytes } from "@/lib/tools/download"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

const INVOICE_TERMS = ["Due on receipt", "Net 7", "Net 14", "Net 30"]
const QUOTE_TERMS = ["Valid for 14 days", "Valid for 30 days", "Valid for 60 days"]

function parseTransfer(raw: string | null): BusinessDocument | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as BusinessDocument
    if (!parsed || parsed.kind !== "invoice") return null
    return parsed
  } catch {
    return null
  }
}

export function InvoiceGenerator() {
  return <DocumentTool kind="invoice" />
}

export function QuoteBuilder() {
  return <DocumentTool kind="quote" />
}

function DocumentTool({ kind }: { kind: DocKind }) {
  const noun = kind === "invoice" ? "Invoice" : "Quote"
  const router = useRouter()
  const transferred = useSessionItem(kind === "invoice" ? TRANSFER_KEY : "")
  const transferredDoc = useMemo(() => parseTransfer(transferred), [transferred])
  const profileRaw = useLocalItem(PROFILE_KEY)
  const profile = useMemo(() => {
    if (!profileRaw) return null
    try {
      return JSON.parse(profileRaw) as ReturnType<typeof readProfile>
    } catch {
      return null
    }
  }, [profileRaw])
  const [doc, setDoc] = useState<BusinessDocument | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fallback = useMemo(() => withProfile(defaultDocument(kind), profile), [kind, profile])
  const current = doc ?? transferredDoc ?? fallback
  const lines = useMemo(() => parsedLines(current.lines), [current.lines])
  const totals = useMemo(() => totalsFor(current), [current])
  const issues = useMemo(() => documentIssues(current), [current])
  const ready = issues.length === 0
  const taxLabel = current.taxInclusive ? `GST included (${current.taxRate || 0}%)` : `GST (${current.taxRate || 0}%)`
  const totalLabel = kind === "invoice" ? "Amount due" : "Quoted total"

  function patch(update: Partial<BusinessDocument> | ((value: BusinessDocument) => BusinessDocument)) {
    setSaved(false)
    setPdfError(null)
    setDoc((existing) => {
      const base = existing ?? transferredDoc ?? fallback
      return typeof update === "function" ? update(base) : { ...base, ...update }
    })
  }

  function patchParty(side: "from" | "to", field: keyof Party, value: string) {
    patch((current) => ({ ...current, [side]: { ...current[side], [field]: value } }))
  }

  function patchLine(id: string, field: keyof LineItem, value: string) {
    patch((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    }))
  }

  function setTerms(value: string) {
    const days = termsToDays(value)
    patch((current) => ({
      ...current,
      terms: value,
      dueDate: days === 0 ? current.issueDate : addDaysIso(current.issueDate, days),
    }))
  }

  async function downloadPdf() {
    if (!documentReady(current)) {
      setPdfError(issues[0] ?? "Finish the required details before downloading.")
      return
    }
    try {
      const result = await documentPdf(current)
      downloadBytes(result.bytes, result.filename, "application/pdf")
    } catch {
      setPdfError("The PDF could not be created. Try print, then choose Save as PDF.")
    }
  }

  function printDoc() {
    printHtml(`${noun} ${current.number}`, documentMarkup(current, totals, taxLabel, totalLabel))
  }

  function rememberBusiness() {
    writeProfile(current.from)
    setSaved(true)
  }

  function loadExample() {
    patch(withProfile(defaultDocument(kind), readProfile()))
  }

  function startNew() {
    const blank = withProfile(blankDocument(kind), readProfile())
    blank.number = nextNumber(current.number || blank.number)
    patch(blank)
  }

  function convertQuote() {
    window.sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(quoteAsInvoice(current)))
    router.push("/business/invoice-generator")
  }

  const terms = kind === "invoice" ? INVOICE_TERMS : QUOTE_TERMS

  return (
    <BusinessShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        {kind === "invoice"
          ? "An invoice asks for payment. Fill in the details, check the preview, then download or print."
          : "A quote is an offer — not a request for payment. When it’s accepted, turn it into an invoice."}
      </p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <div className="flex flex-col gap-8">
          <Section title="Your business" hint="Saved on this device if you choose to remember it. Never uploaded.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Business name" value={current.from.name} onChange={(value) => patchParty("from", "name", value)} autoComplete="organization" />
              <TextField label="Email" value={current.from.email} onChange={(value) => patchParty("from", "email", value)} type="email" optional autoComplete="email" />
              <TextField label="Phone" value={current.from.phone} onChange={(value) => patchParty("from", "phone", value)} optional autoComplete="tel" />
              <TextField label="ABN" value={current.from.abn} onChange={(value) => patchParty("from", "abn", value)} optional placeholder="12 345 678 901" />
            </div>
            <AreaField label="Address" value={current.from.address} onChange={(value) => patchParty("from", "address", value)} optional rows={3} />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" className="h-10" onClick={rememberBusiness}>
                Remember my business details
              </Button>
              {saved ? <span className="text-[12px] text-[var(--nb-secondary)]">Saved on this device.</span> : null}
            </div>
          </Section>

          <Section title="Customer">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Customer name" value={current.to.name} onChange={(value) => patchParty("to", "name", value)} />
              <TextField label="Email" value={current.to.email} onChange={(value) => patchParty("to", "email", value)} type="email" optional />
            </div>
            <AreaField label="Address" value={current.to.address} onChange={(value) => patchParty("to", "address", value)} optional rows={3} />
          </Section>

          <Section title={`${noun} details`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={`${noun} number`} value={current.number} onChange={(value) => patch({ number: value })} />
              <DateField label="Issue date" value={current.issueDate} onChange={(value) => patch({ issueDate: value })} />
              <DateField
                label={kind === "invoice" ? "Due date" : "Valid until"}
                value={current.dueDate}
                onChange={(value) => patch({ dueDate: value })}
              />
              <label className="flex flex-col gap-2">
                <span className="text-[13px] text-[var(--nb-primary)]">{kind === "invoice" ? "Payment terms" : "Validity"}</span>
                <select
                  className={selectClass}
                  value={terms.includes(current.terms) ? current.terms : ""}
                  onChange={(event) => {
                    if (event.target.value) setTerms(event.target.value)
                  }}
                >
                  <option value="">Custom</option>
                  {terms.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              {kind === "quote" ? (
                <TextField
                  label="Project / reference"
                  value={current.project}
                  onChange={(value) => patch({ project: value })}
                  optional
                />
              ) : null}
              <PercentField
                label="GST rate"
                value={current.taxRate}
                onChange={(value) => patch({ taxRate: value })}
                hint="Australian GST is 10%. Use 0 if you don’t charge tax."
              />
            </div>
            <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
              <input
                type="checkbox"
                checked={current.taxInclusive}
                onChange={(event) => patch({ taxInclusive: event.target.checked })}
                className="size-4 accent-foreground"
              />
              Line prices include GST
            </label>
            {!terms.includes(current.terms) ? (
              <TextField label="Custom terms" value={current.terms} onChange={(value) => patch({ terms: value })} optional />
            ) : null}
          </Section>

          <Section title="Line items" hint="Quantity × unit price. Amounts are in AUD.">
            <div className="hidden grid-cols-[1fr_5.5rem_7.5rem_7.5rem_2.5rem] gap-2 px-1 text-[12px] text-[var(--nb-secondary)] sm:grid">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit price</span>
              <span className="text-right">Amount</span>
              <span className="sr-only">Remove</span>
            </div>
            <div className="flex flex-col gap-3">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_5.5rem_7.5rem_7.5rem_2.5rem] sm:items-start sm:border-0 sm:p-0"
                >
                  <label className="flex flex-col gap-1 sm:contents">
                    <span className="text-[12px] text-[var(--nb-secondary)] sm:hidden">Description</span>
                    <Input
                      value={line.description}
                      placeholder="What you’re billing"
                      aria-label="Description"
                      onChange={(event) => patchLine(line.id, "description", event.target.value)}
                      className="h-10"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:contents">
                    <span className="text-[12px] text-[var(--nb-secondary)] sm:hidden">Quantity</span>
                    <Input
                      inputMode="decimal"
                      value={line.qty}
                      aria-label="Quantity"
                      aria-invalid={line.error?.includes("quantity") || undefined}
                      onChange={(event) => patchLine(line.id, "qty", event.target.value)}
                      className="h-10 tabular-nums"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:contents">
                    <span className="text-[12px] text-[var(--nb-secondary)] sm:hidden">Unit price (AUD)</span>
                    <Input
                      inputMode="decimal"
                      value={line.rate}
                      aria-label="Unit price"
                      aria-invalid={line.error?.includes("price") || undefined}
                      onChange={(event) => patchLine(line.id, "rate", event.target.value)}
                      className="h-10 tabular-nums"
                    />
                  </label>
                  <p className="h-10 content-center text-right text-sm tabular-nums text-[var(--nb-primary)]">
                    {line.amount === null ? "—" : formatAud(line.amount)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 justify-self-end px-2 sm:justify-self-auto"
                    aria-label="Remove line"
                    disabled={current.lines.length <= 1}
                    onClick={() =>
                      patch((current) => ({
                        ...current,
                        lines: current.lines.length > 1 ? current.lines.filter((item) => item.id !== line.id) : current.lines,
                      }))
                    }
                  >
                    ×
                  </Button>
                  {line.error ? <p className="text-[12px] text-destructive sm:col-span-5">{line.error}</p> : null}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => patch((current) => ({ ...current, lines: [...current.lines, newLine()] }))}>
              Add item
            </Button>
          </Section>

          <Section title="Notes" hint={kind === "quote" ? "Scope, exclusions, or how long this offer stands." : "Payment instructions, or anything the customer should know."}>
            <AreaField
              label={kind === "quote" ? "Notes / terms" : "Notes"}
              value={current.notes}
              onChange={(value) => patch({ notes: value })}
              optional
              rows={4}
            />
          </Section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-[var(--nb-accent)]/35 p-5">
            <TotalsPanel
              rows={[
                { label: current.taxInclusive ? "Subtotal (ex GST)" : "Subtotal", value: formatAud(totals.subtotal) },
                { label: taxLabel, value: formatAud(totals.tax) },
              ]}
              totalLabel={totalLabel}
              total={formatAud(totals.total)}
            />
            <p className="mt-3 text-right text-[12px] text-[var(--nb-secondary)]">AUD · GST {current.taxInclusive ? "included in prices" : "added on top"}</p>
          </div>
          <IssueList issues={issues} />
          {pdfError ? <p className="text-[13px] text-destructive">{pdfError}</p> : null}
          <ActionBar>
            <Button type="button" className="h-10" onClick={downloadPdf} disabled={!ready}>
              Download PDF
            </Button>
            <Button type="button" variant="outline" className="h-10" onClick={printDoc}>
              Print
            </Button>
            <CopyButton text={copySummary(current)} label="Copy summary" />
            {kind === "quote" ? (
              <Button type="button" variant="outline" className="h-10" onClick={convertQuote} disabled={!ready}>
                Create invoice
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="h-10" onClick={loadExample}>
              Try an example
            </Button>
            <ResetButton onClick={startNew} label={`New ${noun.toLowerCase()}`} />
          </ActionBar>
          <DocumentPreview current={current} taxLabel={taxLabel} totalLabel={totalLabel} />
        </aside>
      </div>
      <PrivacyNote>
        Your {noun.toLowerCase()} stays in this browser until you download or print it. We don’t upload business or customer details.
      </PrivacyNote>
    </BusinessShell>
  )
}

function DocumentPreview({
  current,
  taxLabel,
  totalLabel,
}: {
  current: BusinessDocument
  taxLabel: string
  totalLabel: string
}) {
  const totals = totalsFor(current)
  const lines = parsedLines(current.lines).filter((line) => line.description.trim() || line.amount !== null)
  const noun = current.kind === "invoice" ? "Invoice" : "Quote"
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-white text-neutral-900 shadow-sm"
      aria-label={`${noun} preview`}
    >
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-neutral-500 uppercase">{noun}</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">{current.number || "—"}</p>
          </div>
          <p className="text-[11px] text-neutral-500">AUD</p>
        </div>
        <div className="grid gap-4 text-[12px] leading-relaxed sm:grid-cols-2">
          <div>
            <p className="text-[10px] tracking-[0.14em] text-neutral-500 uppercase">From</p>
            <PartyBlock party={current.from} />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.14em] text-neutral-500 uppercase">To</p>
            <PartyBlock party={current.to} />
          </div>
        </div>
        <p className="text-[11px] text-neutral-500">
          Issued {formatDateAu(current.issueDate)}
          {current.dueDate ? ` · ${current.kind === "invoice" ? "Due" : "Valid until"} ${formatDateAu(current.dueDate)}` : ""}
          {current.terms ? ` · ${current.terms}` : ""}
          {current.project ? ` · ${current.project}` : ""}
        </p>
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-neutral-200 text-[10px] tracking-[0.08em] text-neutral-500 uppercase">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="hidden py-2 text-right font-medium sm:table-cell">Rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-neutral-400">
                  Add a line item to see it here.
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-2">{line.description || "—"}</td>
                  <td className="py-2 text-right tabular-nums">{line.qty || "—"}</td>
                  <td className="hidden py-2 text-right tabular-nums sm:table-cell">
                    {line.rateValue === null ? "—" : formatAud(line.rateValue)}
                  </td>
                  <td className="py-2 text-right tabular-nums">{line.amount === null ? "—" : formatAud(line.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="ml-auto w-full max-w-[14rem] text-[12px]">
          <div className="flex justify-between gap-6 py-0.5">
            <span className="text-neutral-500">{current.taxInclusive ? "Subtotal (ex GST)" : "Subtotal"}</span>
            <span className="tabular-nums">{formatAud(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-6 py-0.5">
            <span className="text-neutral-500">{taxLabel}</span>
            <span className="tabular-nums">{formatAud(totals.tax)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-6 border-t border-neutral-200 pt-2 text-[13px] font-semibold">
            <span>{totalLabel}</span>
            <span className="tabular-nums">{formatAud(totals.total)}</span>
          </div>
        </div>
        {current.notes.trim() ? <p className="whitespace-pre-line text-[12px] text-neutral-500">{current.notes}</p> : null}
      </div>
    </div>
  )
}

function PartyBlock({ party }: { party: Party }) {
  const lines = [party.name, party.address, party.email, party.phone, party.abn ? `ABN ${party.abn}` : ""].filter(Boolean)
  if (lines.length === 0) return <p className="mt-1 text-neutral-400">—</p>
  return <p className="mt-1 whitespace-pre-line">{lines.join("\n")}</p>
}

function documentMarkup(
  current: BusinessDocument,
  totals: { subtotal: number; tax: number; total: number },
  taxLabel: string,
  totalLabel: string,
) {
  const noun = current.kind === "invoice" ? "Invoice" : "Quote"
  const lines = parsedLines(current.lines)
    .filter((line) => line.description.trim() || line.amount !== null)
    .map(
      (line) =>
        `<tr><td>${escapeHtml(line.description || "—")}</td><td class="num">${escapeHtml(line.qty || "—")}</td><td class="num">${line.rateValue === null ? "—" : escapeHtml(formatAud(line.rateValue))}</td><td class="num">${line.amount === null ? "—" : escapeHtml(formatAud(line.amount))}</td></tr>`,
    )
    .join("")
  const from = [current.from.name, current.from.address, current.from.email, current.from.phone, current.from.abn ? `ABN ${current.from.abn}` : ""]
    .filter(Boolean)
    .join("\n")
  const to = [current.to.name, current.to.address, current.to.email, current.to.phone].filter(Boolean).join("\n")
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
      <div><div class="label">${escapeHtml(noun)}</div><h1>${escapeHtml(current.number || noun)}</h1></div>
      <div class="muted">Amounts in AUD</div>
    </div>
    <div class="row">
      <div class="col"><div class="label">From</div>${escapeHtml(from || "—")}</div>
      <div class="col"><div class="label">To</div>${escapeHtml(to || "—")}</div>
    </div>
    <p class="muted">Issued ${escapeHtml(formatDateAu(current.issueDate))}${current.dueDate ? ` · ${current.kind === "invoice" ? "Due" : "Valid until"} ${escapeHtml(formatDateAu(current.dueDate))}` : ""}${current.terms ? ` · ${escapeHtml(current.terms)}` : ""}${current.project ? ` · ${escapeHtml(current.project)}` : ""}</p>
    <table><thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${lines || `<tr><td colspan="4">No items</td></tr>`}</tbody></table>
    <div class="totals">
      <div><span>${current.taxInclusive ? "Subtotal (ex GST)" : "Subtotal"}</span><span>${escapeHtml(formatAud(totals.subtotal))}</span></div>
      <div><span>${escapeHtml(taxLabel)}</span><span>${escapeHtml(formatAud(totals.tax))}</span></div>
      <div class="due"><span>${escapeHtml(totalLabel)}</span><span>${escapeHtml(formatAud(totals.total))}</span></div>
    </div>
    ${current.notes.trim() ? `<div class="notes"><div class="label">Notes</div>${escapeHtml(current.notes)}</div>` : ""}
  `
}
