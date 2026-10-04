"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useId, useState } from "react"

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const nameId = useId()
  const emailId = useId()
  const messageId = useId()

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-8 sm:px-6">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--nb-primary)]">Noted on this page.</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--nb-secondary)]">
          The form is not connected to an inbox yet, so nothing was sent or stored.
        </p>
        <Button type="button" variant="outline" className="mt-6 h-10" onClick={() => setSent(false)}>
          Write another note
        </Button>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-6 sm:px-6"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(true)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={nameId}>Name</Label>
          <Input id={nameId} name="name" autoComplete="name" required className="h-10" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input id={emailId} name="email" type="email" autoComplete="email" required className="h-10" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={messageId}>Message</Label>
        <textarea
          id={messageId}
          name="message"
          required
          rows={6}
          placeholder="What you were trying to do, and what happened."
          className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex flex-col items-start gap-3 pt-2">
        <Button type="submit" className="h-10 px-4">
          Send
        </Button>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          Nothing is stored. This inbox is not connected yet.
        </p>
      </div>
    </form>
  )
}
