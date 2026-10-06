import assert from "node:assert/strict"
import test from "node:test"
import {
  blankDocument,
  defaultDocument,
  documentIssues,
  nextNumber,
  parsedLines,
  quoteAsInvoice,
  termsToDays,
  totalsFor,
  addDaysIso,
} from "./document.ts"
import { documentPdf } from "./pdf.ts"
import {
  breakEven,
  commissionOn,
  documentTotals,
  explainMargin,
  lineTotal,
  marginFromPrices,
  parseMoney,
  platformFee,
  priceFromMargin,
  priceFromMarkup,
  roundCents,
} from "./money.ts"

test("cents rounding and line totals", () => {
  assert.equal(roundCents(1.005), 1.01)
  assert.equal(lineTotal(2, 19.99), 39.98)
  assert.equal(parseMoney("$1,250.00"), 1250)
  assert.equal(parseMoney(""), null)
  assert.equal(roundCents(19.99 * 0.1), 2)
})

test("GST exclusive and inclusive", () => {
  const exclusive = documentTotals(
    [
      { qty: 1, rate: 1200 },
      { qty: 2, rate: 180 },
    ],
    10,
    false,
  )
  assert.equal(exclusive.subtotal, 1560)
  assert.equal(exclusive.tax, 156)
  assert.equal(exclusive.total, 1716)
  const inclusive = documentTotals([{ qty: 1, rate: 110 }], 10, true)
  assert.equal(inclusive.total, 110)
  assert.equal(inclusive.subtotal, 100)
  assert.equal(inclusive.tax, 10)
  const zero = documentTotals([{ qty: 1, rate: 50 }], 0, false)
  assert.equal(zero.tax, 0)
  assert.equal(zero.total, 50)
})

test("margin, markup, and reverse price", () => {
  const result = marginFromPrices(40, 65)
  assert.equal(result.profit, 25)
  assert.equal(result.margin !== null && Math.round((result.margin ?? 0) * 10) / 10, 38.5)
  assert.equal(result.markup, 62.5)
  assert.equal(priceFromMargin(40, 38.4615384615), 65)
  assert.equal(priceFromMarkup(40, 62.5), 65)
  assert.equal(priceFromMargin(40, 100), null)
  const loss = marginFromPrices(80, 60)
  assert.equal(loss.profit, -20)
  assert.ok((loss.margin ?? 0) < 0)
  assert.match(explainMargin(result), /\$25\.00 gross profit/)
})

test("zero cost and zero price", () => {
  const free = marginFromPrices(0, 50)
  assert.equal(free.markup, null)
  const none = marginFromPrices(20, 0)
  assert.equal(none.margin, null)
  assert.equal(none.profit, -20)
})

test("break-even rounds up and rejects no contribution", () => {
  const ok = breakEven(8000, 120, 45)
  assert.equal(ok.ok, true)
  if (ok.ok) {
    assert.equal(ok.contribution, 75)
    assert.equal(ok.units, 107)
    assert.equal(ok.revenue, 12840)
  }
  const bad = breakEven(1000, 40, 45)
  assert.equal(bad.ok, false)
})

test("commission and platform fee", () => {
  assert.equal(commissionOn(4800, 8), 384)
  const paypal = platformFee(100, 2.6, 0.3)
  assert.equal(paypal.fee, 2.9)
  assert.equal(paypal.net, 97.1)
})

test("document validation, numbering, and dates", () => {
  const doc = defaultDocument("invoice")
  assert.equal(documentIssues(doc).length, 0)
  const totals = totalsFor(doc)
  assert.equal(totals.subtotal, 1560)
  assert.equal(totals.tax, 156)
  assert.equal(totals.total, 1716)
  const empty = blankDocument("quote")
  assert.ok(documentIssues(empty).length >= 3)
  empty.lines = [{ id: "1", description: "", qty: "0", rate: "-4" }]
  assert.ok(documentIssues(empty).some((issue) => issue.includes("quantity") || issue.includes("price") || issue.includes("line")))
  assert.equal(addDaysIso("2026-10-06", 14), "2026-10-20")
  assert.equal(nextNumber("INV-104"), "INV-105")
  assert.equal(termsToDays("Net 14"), 14)
  assert.equal(termsToDays("Due on receipt"), 0)
  const parsed = parsedLines([{ id: "1", description: "A", qty: "2", rate: "10" }])
  assert.equal(parsed[0]?.amount, 20)
  const invoice = quoteAsInvoice(defaultDocument("quote"))
  assert.equal(invoice.kind, "invoice")
  assert.match(invoice.number, /^INV-/)
  assert.match(invoice.notes, /Converted from quote/)
  assert.doesNotMatch(invoice.notes, /not a request for payment/i)
})

test("PDF is a real PDF with invoice totals", async () => {
  const { bytes, filename, text } = await documentPdf(defaultDocument("invoice"))
  assert.equal(filename, "invoice-inv-104.pdf")
  assert.match(text, /Amount due|Total/)
  assert.ok(bytes.byteLength > 500)
  assert.equal(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]), "%PDF")
})
