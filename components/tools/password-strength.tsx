"use client"

import { CopyButton, DeveloperPrivacy, ResetButton } from "@/components/developer/kit"
import { Field } from "@/components/tools/ui"
import { Input } from "@/components/ui/input"
import { analysePassword } from "@/lib/tools/password-strength"
import { useMemo, useState } from "react"

const bars: Record<string, string> = {
  empty: "bg-border",
  "very-weak": "bg-destructive",
  weak: "bg-orange-500",
  fair: "bg-amber-500",
  strong: "bg-emerald-600",
  "very-strong": "bg-emerald-700",
}

export function PasswordStrengthChecker() {
  const [password, setPassword] = useState("")
  const [reveal, setReveal] = useState(false)
  const report = useMemo(() => analysePassword(password), [password])

  return (
    <div className="flex flex-col gap-6">
      <DeveloperPrivacy>
        Strength is estimated in this browser from length, character variety, and a few weak patterns. It is not a guarantee, and the password is never sent anywhere.
      </DeveloperPrivacy>
      <Field label="Password">
        <div className="flex gap-2">
          <Input
            type={reveal ? "text" : "password"}
            value={password}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 font-mono sm:h-10"
          />
          <button type="button" className="text-sm text-[var(--nb-secondary)] underline-offset-4 hover:underline" onClick={() => setReveal((value) => !value)}>
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      <div aria-live="polite" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[var(--nb-secondary)]">Estimate</div>
            <div className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{report.label}</div>
          </div>
          <div className="text-right text-sm text-[var(--nb-secondary)] tabular-nums">
            {Math.round(report.entropy)} bits · {report.length} chars
          </div>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-border"
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={report.score}
          aria-valuetext={report.label}
        >
          <div className={`h-full ${bars[report.band]}`} style={{ width: `${report.score}%` }} />
        </div>
        <ul className="flex flex-col gap-1 text-sm text-[var(--nb-secondary)]">
          {report.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        {password ? <CopyButton text={`${report.label} · ${Math.round(report.entropy)} bits`} label="Copy summary" /> : null}
        <ResetButton label="Clear" onClick={() => setPassword("")} />
      </div>
    </div>
  )
}
