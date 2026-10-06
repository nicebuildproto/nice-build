"use client"

import { CodeField, CopyButton, DeveloperPrivacy, ResetButton } from "@/components/developer/kit"
import { parseEmailHeaders } from "@/lib/tools/email-headers"
import { useMemo, useState } from "react"

const sample = `Return-Path: <ada@example.com>
Received: from mail.example.net (mail.example.net [203.0.113.10])
	by inbound.example.com with ESMTPS id abc123;
	Mon, 5 Oct 2026 10:00:01 +1100
From: Ada Lovelace <ada@example.com>
To: Bob <bob@example.com>
Subject: Diagrams for Friday
Date: Mon, 5 Oct 2026 10:00:00 +1100
Message-ID: <msg-1@example.com>
Authentication-Results: inbound.example.com;
	spf=pass smtp.mailfrom=example.com;
	dkim=pass header.d=example.com;
	dmarc=pass header.from=example.com
Received-SPF: pass (example.com: domain of ada@example.com designates 203.0.113.10 as permitted sender)`

export function EmailHeaderAnalyzer() {
  const [raw, setRaw] = useState(sample)
  const parsed = useMemo(() => parseEmailHeaders(raw), [raw])

  return (
    <div className="flex flex-col gap-6">
      <DeveloperPrivacy>
        Paste the raw headers from a message source. This page reads common fields and auth tokens in your browser. It does not prove whether a message is genuine.
      </DeveloperPrivacy>
      <CodeField label="Raw headers" value={raw} onChange={setRaw} rows={12} />
      {"error" in parsed ? (
        <p role="alert" className="text-sm text-destructive">
          {parsed.error}
        </p>
      ) : (
        <div className="flex flex-col gap-6" aria-live="polite">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Item label="From" value={parsed.from} />
            <Item label="To" value={parsed.to} />
            <Item label="Subject" value={parsed.subject} />
            <Item label="Date" value={parsed.date} />
            <Item label="Return-Path" value={parsed.returnPath} />
            <Item label="Message-ID" value={parsed.messageId} />
          </dl>
          <section>
            <h2 className="mb-2 text-[13px] font-medium text-[var(--nb-primary)]">Authentication fields</h2>
            <p className="mb-3 max-w-xl text-sm text-[var(--nb-secondary)]">
              These are the tokens present in the headers. Pass or fail here is what the receiving server wrote — not an independent verdict.
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip label="SPF" value={parsed.auth.spf} />
              <Chip label="DKIM" value={parsed.auth.dkim} />
              <Chip label="DMARC" value={parsed.auth.dmarc} />
            </div>
            {parsed.auth.receivedSpf ? <p className="mt-3 text-sm text-[var(--nb-secondary)]">{parsed.auth.receivedSpf}</p> : null}
          </section>
          <section>
            <h2 className="mb-2 text-[13px] font-medium text-[var(--nb-primary)]">Received path</h2>
            {parsed.received.length ? (
              <ol className="flex flex-col gap-2">
                {parsed.received.map((hop, index) => (
                  <li key={index} className="rounded-xl border border-border px-3 py-2 text-sm">
                    <div className="text-[var(--nb-primary)]">
                      {hop.by ? `by ${hop.by}` : "Hop"} {hop.from ? `from ${hop.from}` : ""}
                    </div>
                    <div className="text-[12px] text-[var(--nb-secondary)]">{hop.date || hop.with || hop.raw}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--nb-secondary)]">No Received headers were found.</p>
            )}
          </section>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={[parsed.from, parsed.to, parsed.subject, parsed.date].filter(Boolean).join("\n")} label="Copy summary" />
            <ResetButton label="Clear" onClick={() => setRaw("")} />
          </div>
        </div>
      )}
    </div>
  )
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--nb-secondary)]">{label}</dt>
      <dd className="mt-1 break-all text-sm text-[var(--nb-primary)]">{value || "—"}</dd>
    </div>
  )
}

function Chip({ label, value }: { label: string; value?: string }) {
  const tone =
    value === "pass"
      ? "border-emerald-600/40 text-emerald-800 dark:text-emerald-400"
      : value === "fail"
        ? "border-destructive/40 text-destructive"
        : "border-border text-[var(--nb-secondary)]"
  return (
    <span className={`rounded-full border px-3 py-1 text-[13px] ${tone}`}>
      {label}: {value || "not present"}
    </span>
  )
}
