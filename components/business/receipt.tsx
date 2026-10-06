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
} from "@/components/business/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { documentTotals, parseMoney, parseRate } from "@/lib/business/money"
import { formatAud, formatDateAu, todayIso } from "@/lib/business/document"
import { useMemo, useState } from "react"

type ReceiptLine = { id: string; description: string; amount: string }

function newReceiptLine(partial?: Partial<ReceiptLine>): ReceiptLine {
  return { id: `r${Math.random().toString(36).slice(2, 9)}`, description: "", amount: "", ...partial }
}

const EXAMPLE_LINES = [
  newReceiptLine({ description: "Workshop", amount: "80" }),
  newReceiptLine({ description: "Materials", amount: "24" }),
]

export function ReceiptGenerator() {
  const [business, setBusiness] = useState("North Studio")
  const [number, setNumber] = useState("R-104")
  const [issued, setIssued] = useState(() => todayIso())
  const [taxRate, setTaxRate] = useState("10")
  const [inclusive, setInclusive] = useState(false)
  const [notes, setNotes] = useState("Paid in full. Thank you.")
  const [lines, setLines] = useState<ReceiptLine[]>(EXAMPLE_LINES)

  const parsed = useMemo(
    () =>
      lines.map((line) => {
        const amount = parseMoney(line.amount)
        const ok = amount !== null && Number.isFinite(amount)
        return {
          ...line,
          value: ok ? amount : null,
          error: line.amount !== "" && !ok ? "Enter an amount, such as 80 or -12 for a refund." : null,
        }
      }),
    [lines],
  )

  const tax = parseRate(taxRate)
  const totals = documentTotals(
    parsed.filter((line) => line.value !== null).map((line) => ({ qty: 1, rate: line.value ?? 0 })),
    tax ?? 0,
    inclusive,
  )
  const issues = [
    !business.trim() ? "Add the business name." : "",
    !number.trim() ? "Add a receipt number." : "",
    taxRate !== "" && (tax === null || tax < 0) ? "Enter a tax rate of 0% or more." : "",
    parsed.every((line) => !line.description.trim() || line.value === null)
      ? "Add at least one line with a description and amount."
      : "",
    ...parsed.map((line) => line.error ?? ""),
  ].filter(Boolean)
  const taxLabel = inclusive ? `GST included (${taxRate || 0}%)` : `GST (${taxRate || 0}%)`

  function patchLine(id: string, field: keyof ReceiptLine, value: string) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, [field]: value } : line)))
  }

  const copyText = [
    `Receipt ${number}`,
    business,
    `Issued ${formatDateAu(issued)}`,
    ...parsed
      .filter((line) => line.description.trim())
      .map((line) => `${line.description}  ${line.value === null ? "—" : formatAud(line.value)}`),
    `Subtotal ${formatAud(totals.subtotal)}`,
    `${taxLabel} ${formatAud(totals.tax)}`,
    `Total ${formatAud(totals.total)} AUD`,
    notes,
  ]
    .filter(Boolean)
    .join("\n")

  function printReceipt() {
    const rows = parsed
      .filter((line) => line.description.trim() || line.value !== null)
      .map(
        (line) =>
          `<tr><td>${escapeHtml(line.description || "—")}</td><td class="num">${line.value === null ? "—" : escapeHtml(formatAud(line.value))}</td></tr>`,
      )
      .join("")
    printHtml(
      `Receipt ${number}`,
      `<div class="label">Receipt</div><h1>${escapeHtml(number)}</h1>
       <p>${escapeHtml(business)}</p>
       <p class="muted">Issued ${escapeHtml(formatDateAu(issued))} · AUD</p>
       <table><thead><tr><th>Description</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table>
       <div class="totals">
         <div><span>${inclusive ? "Subtotal (ex GST)" : "Subtotal"}</span><span>${escapeHtml(formatAud(totals.subtotal))}</span></div>
         <div><span>${escapeHtml(taxLabel)}</span><span>${escapeHtml(formatAud(totals.tax))}</span></div>
         <div class="due"><span>Total</span><span>${escapeHtml(formatAud(totals.total))}</span></div>
       </div>
       ${notes.trim() ? `<div class="notes">${escapeHtml(notes)}</div>` : ""}`,
    )
  }

  return (
    <BusinessShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        A simple GST receipt you can print or copy. For an invoice that asks for payment, use Invoice Generator.
      </p>
      <Section title="Receipt">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Business name" value={business} onChange={setBusiness} />
          <TextField label="Receipt number" value={number} onChange={setNumber} />
          <DateField label="Date" value={issued} onChange={setIssued} />
          <PercentField label="GST rate" value={taxRate} onChange={setTaxRate} hint="Australian GST is 10%. Use 0 if you don’t charge tax." />
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
          <input
            type="checkbox"
            checked={inclusive}
            onChange={(event) => setInclusive(event.target.checked)}
            className="size-4 accent-foreground"
          />
          Amounts include GST
        </label>
      </Section>
      <Section title="Items" hint="Use a negative amount for a refund or discount.">
        <div className="flex flex-col gap-3">
          {parsed.map((line) => (
            <div key={line.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_8rem_2.5rem] sm:border-0 sm:p-0">
              <Input
                value={line.description}
                placeholder="Description"
                onChange={(event) => patchLine(line.id, "description", event.target.value)}
                className="h-10"
              />
              <Input
                inputMode="decimal"
                value={line.amount}
                aria-invalid={line.error ? true : undefined}
                placeholder="Amount"
                onChange={(event) => patchLine(line.id, "amount", event.target.value)}
                className="h-10 tabular-nums"
              />
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-2"
                aria-label="Remove line"
                disabled={lines.length <= 1}
                onClick={() => setLines((current) => (current.length > 1 ? current.filter((item) => item.id !== line.id) : current))}
              >
                ×
              </Button>
              {line.error ? <p className="text-[12px] text-destructive sm:col-span-3">{line.error}</p> : null}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setLines((current) => [...current, newReceiptLine()])}>
          Add item
        </Button>
      </Section>
      <AreaField label="Notes" value={notes} onChange={setNotes} optional rows={3} />
      <div className="rounded-2xl border border-border bg-[var(--nb-accent)]/35 p-5">
        <TotalsPanel
          rows={[
            { label: inclusive ? "Subtotal (ex GST)" : "Subtotal", value: formatAud(totals.subtotal) },
            { label: taxLabel, value: formatAud(totals.tax) },
          ]}
          totalLabel="Total"
          total={formatAud(totals.total)}
        />
      </div>
      <IssueList issues={issues} />
      <ActionBar>
        <Button type="button" className="h-10" onClick={printReceipt} disabled={issues.length > 0}>
          Print
        </Button>
        <CopyButton text={copyText} label="Copy receipt" />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() => {
            setBusiness("North Studio")
            setNumber("R-104")
            setIssued(todayIso())
            setTaxRate("10")
            setInclusive(false)
            setNotes("Paid in full. Thank you.")
            setLines([
              newReceiptLine({ description: "Workshop", amount: "80" }),
              newReceiptLine({ description: "Materials", amount: "24" }),
            ])
          }}
        >
          Try an example
        </Button>
        <ResetButton
          onClick={() => {
            setBusiness("")
            setNumber("R-001")
            setIssued(todayIso())
            setTaxRate("10")
            setInclusive(false)
            setNotes("")
            setLines([newReceiptLine()])
          }}
          label="New receipt"
        />
      </ActionBar>
      <PrivacyNote>The receipt stays in this browser until you print or copy it.</PrivacyNote>
    </BusinessShell>
  )
}
