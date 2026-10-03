"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextArea } from "@/components/tools/ui"
import { money } from "@/lib/tools/format"
import { useMemo, useState, type ReactNode } from "react"

export function ResumeBuilder() {
  const [name, setName] = useState("Ada North")
  const [role, setRole] = useState("Product designer")
  const [contact, setContact] = useState("ada@example.com · Adelaide")
  const [summary, setSummary] = useState("Designs quiet tools for everyday work.")
  const [experience, setExperience] = useState("Studio lead, 2022–now\nShipped a small set of in-browser tools.")
  const [skills, setSkills] = useState("Interface design, writing, prototyping")

  return (
    <Paper
      onPrint={() =>
        printHtml(
          `${escapeHtml(name)} — resume`,
          `<h1>${escapeHtml(name)}</h1><p>${escapeHtml(role)}</p><p>${escapeHtml(contact)}</p><h2>Summary</h2><p>${escapeHtml(summary)}</p><h2>Experience</h2>${paragraphs(experience)}<h2>Skills</h2><p>${escapeHtml(skills)}</p>`,
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Name" value={name} onChange={setName} />
        <Text label="Role" value={role} onChange={setRole} />
      </div>
      <Text label="Contact" value={contact} onChange={setContact} />
      <TextArea label="Summary" value={summary} onChange={setSummary} rows={3} />
      <TextArea label="Experience" value={experience} onChange={setExperience} rows={5} />
      <Text label="Skills" value={skills} onChange={setSkills} />
    </Paper>
  )
}

export function CoverLetterGenerator() {
  const [name, setName] = useState("Ada North")
  const [role, setRole] = useState("Product designer")
  const [company, setCompany] = useState("Northwind")
  const [why, setWhy] = useState("The work is specific, and the team ships in the open.")
  const [proof, setProof] = useState("I led a small toolkit from sketch to a public site.")

  const letter = `${name}\n\nDear ${company} team,\n\nI am applying for the ${role} role. ${why}\n\n${proof}\n\nI would welcome a conversation.\n\n${name}`

  return (
    <Paper onPrint={() => printHtml(`${escapeHtml(role)} — letter`, paragraphs(letter))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Your name" value={name} onChange={setName} />
        <Text label="Role" value={role} onChange={setRole} />
      </div>
      <Text label="Company" value={company} onChange={setCompany} />
      <TextArea label="Why this role" value={why} onChange={setWhy} rows={3} />
      <TextArea label="Proof" value={proof} onChange={setProof} rows={3} />
      <pre className="rounded-xl border border-border bg-[var(--nb-accent)] p-4 text-sm whitespace-pre-wrap">{letter}</pre>
    </Paper>
  )
}

export function ReceiptGenerator() {
  const [business, setBusiness] = useState("Nice Build")
  const [number, setNumber] = useState("R-104")
  const [lines, setLines] = useState("Workshop, 80\nMaterials, 24")
  const [tax, setTax] = useState("10")
  const totals = useMemo(() => {
    const rows = lines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.*?)[,:\s]+(-?\d+(?:\.\d+)?)$/)
        return { name: match?.[1]?.trim() || line, amount: Number(match?.[2] ?? 0) }
      })
    const subtotal = rows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0)
    const taxAmount = subtotal * ((Number(tax) || 0) / 100)
    return { rows, subtotal, taxAmount, total: subtotal + taxAmount }
  }, [lines, tax])

  return (
    <Paper
      onPrint={() =>
        printHtml(
          `Receipt ${escapeHtml(number)}`,
          `<h1>Receipt ${escapeHtml(number)}</h1><p>${escapeHtml(business)}</p><table>${totals.rows
            .map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(money(row.amount))}</td></tr>`)
            .join("")}</table><p>Tax ${escapeHtml(money(totals.taxAmount))}<br/><strong>${escapeHtml(money(totals.total))}</strong></p>`,
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Business" value={business} onChange={setBusiness} />
        <Text label="Number" value={number} onChange={setNumber} />
      </div>
      <TextArea label="Lines" value={lines} onChange={setLines} rows={5} />
      <Text label="Tax %" value={tax} onChange={setTax} />
      <p className="text-sm text-[var(--nb-secondary)]">
        Subtotal {money(totals.subtotal)} · Tax {money(totals.taxAmount)} · Total {money(totals.total)}
      </p>
    </Paper>
  )
}

function Paper({ children, onPrint }: { children: ReactNode; onPrint: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      {children}
      <Button type="button" className="w-fit" onClick={onPrint}>
        Print
      </Button>
    </div>
  )
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2 text-[13px]">
      {label}
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
    </label>
  )
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br/>")}</p>`)
    .join("")
}

function printHtml(title: string, body: string) {
  const html = `<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Georgia,serif;color:#111;padding:48px;max-width:720px;margin:auto}
    h1{font-size:28px;margin:0 0 8px} h2{font-size:14px;letter-spacing:.08em;text-transform:uppercase;margin:28px 0 8px}
    p{margin:0 0 10px;line-height:1.5} table{width:100%;border-collapse:collapse;margin-top:20px}
    td{padding:8px 0;border-bottom:1px solid #e5e5e5} td:last-child{text-align:right}
  </style></head><body>${body}</body></html>`
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

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}
