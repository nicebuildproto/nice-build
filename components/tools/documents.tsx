"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { money, num } from "@/lib/tools/format"
import { useMemo, useState } from "react"

type Line = { id: number; description: string; qty: string; rate: string }

export function DocumentTool({ kind }: { kind: "invoice" | "quote" }) {
  const noun = kind === "invoice" ? "Invoice" : "Quote"
  const [from, setFrom] = useState("Nice Build")
  const [to, setTo] = useState("")
  const [number, setNumber] = useState(kind === "invoice" ? "001" : "Q-001")
  const [tax, setTax] = useState("10")
  const [lines, setLines] = useState<Line[]>([
    { id: 1, description: "Design and documentation", qty: "1", rate: "1200" },
  ])
  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.rate) || 0), 0)
    const taxAmount = subtotal * ((Number(tax) || 0) / 100)
    return { subtotal, taxAmount, total: subtotal + taxAmount }
  }, [lines, tax])

  function update(id: number, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  function printDocument() {
    const rows = lines
      .map(
        (line) =>
          `<tr><td>${escapeHtml(line.description)}</td><td>${escapeHtml(line.qty)}</td><td>${escapeHtml(money(Number(line.rate) || 0))}</td><td>${escapeHtml(money((Number(line.qty) || 0) * (Number(line.rate) || 0)))}</td></tr>`
      )
      .join("")
    const html = `<!doctype html><html><head><title>${noun} ${escapeHtml(number)}</title><style>
      body{font-family:Georgia,serif;color:#111;padding:48px;max-width:720px;margin:auto}
      h1{font-size:28px;margin:0 0 8px} p{margin:0 0 6px;color:#444}
      table{width:100%;border-collapse:collapse;margin-top:28px}
      th,td{text-align:left;padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px}
      td:nth-child(n+2),th:nth-child(n+2){text-align:right}
      .total{margin-top:16px;text-align:right;font-size:16px}
    </style></head><body>
      <h1>${noun} ${escapeHtml(number)}</h1>
      <p>From ${escapeHtml(from || "—")}</p>
      <p>To ${escapeHtml(to || "—")}</p>
      <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="total">Subtotal ${escapeHtml(money(totals.subtotal))}<br/>Tax ${escapeHtml(num(Number(tax) || 0))}% ${escapeHtml(money(totals.taxAmount))}<br/><strong>Total ${escapeHtml(money(totals.total))}</strong></p>
    </body></html>`
    const frame = document.createElement("iframe")
    frame.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0")
    document.body.appendChild(frame)
    const doc = frame.contentDocument
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    window.setTimeout(() => frame.remove(), 1000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From" value={from} onChange={setFrom} />
        <Field label="To" value={to} onChange={setTo} placeholder="Client name" />
        <Field label="Number" value={number} onChange={setNumber} />
        <Field label="Tax" value={tax} onChange={setTax} suffix="%" />
      </div>
      <div className="flex flex-col gap-3">
        {lines.map((line) => (
          <div key={line.id} className="grid gap-2 sm:grid-cols-[1fr_5rem_7rem]">
            <Input
              value={line.description}
              placeholder="Description"
              onChange={(event) => update(line.id, { description: event.target.value })}
              className="h-10"
            />
            <Input value={line.qty} inputMode="decimal" onChange={(event) => update(line.id, { qty: event.target.value })} className="h-10" />
            <Input value={line.rate} inputMode="decimal" onChange={(event) => update(line.id, { rate: event.target.value })} className="h-10" />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => setLines((current) => [...current, { id: Date.now(), description: "", qty: "1", rate: "0" }])}
        >
          Add line
        </Button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs text-[var(--nb-secondary)]">Total</p>
          <p className="text-4xl font-semibold tabular-nums">{money(totals.total)}</p>
        </div>
        <Button type="button" onClick={printDocument}>
          Print {noun.toLowerCase()}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suffix?: string
}) {
  return (
    <label className="flex flex-col gap-2 text-[13px]">
      {label}
      <div className="relative">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-10"
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export function InvoiceGenerator() {
  return <DocumentTool kind="invoice" />
}

export function QuoteBuilder() {
  return <DocumentTool kind="quote" />
}
