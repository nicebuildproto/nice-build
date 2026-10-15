"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useId, useRef, useState } from "react"

type Status = "idle" | "submitting" | "success" | "error"
type Field = "name" | "email" | "message"
type FieldErrors = Partial<Record<Field, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const MESSAGES: Record<Field, string> = {
  name: "Add your name so we know who to reply to.",
  email: "Add your email so we can reply.",
  message: "Pop a message in first.",
}

function check(values: Record<Field, string>): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.name.trim()) errors.name = MESSAGES.name
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = MESSAGES.email
  if (values.message.trim().length < 10) errors.message = MESSAGES.message
  return errors
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [company, setCompany] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const startedAtRef = useRef(0)
  const successRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const nameId = useId()
  const emailId = useId()
  const messageId = useId()
  const nameErrorId = useId()
  const emailErrorId = useId()
  const emailHelpId = useId()
  const messageErrorId = useId()

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (status === "success") successRef.current?.focus()
  }, [status])

  function focusFirst(found: FieldErrors) {
    const first = (["name", "email", "message"] as const).find((field) => found[field])
    if (first === "name") nameRef.current?.focus()
    else if (first === "email") emailRef.current?.focus()
    else if (first === "message") messageRef.current?.focus()
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "submitting") return

    const found = check({ name, email, message })
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setStatus("idle")
      focusFirst(found)
      return
    }

    setStatus("submitting")
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message, company, startedAt: startedAtRef.current }),
      })
      const result = (await response.json().catch(() => null)) as { ok?: boolean; errors?: FieldErrors } | null
      if (response.ok && result?.ok) {
        setStatus("success")
        return
      }
      if (response.status === 400 && result?.errors) {
        const serverErrors: FieldErrors = {}
        for (const field of ["name", "email", "message"] as const) {
          if (result.errors[field]) serverErrors[field] = MESSAGES[field]
        }
        setErrors(serverErrors)
        setStatus("idle")
        focusFirst(serverErrors)
        return
      }
      setStatus("error")
    } catch {
      setStatus("error")
    }
  }

  function reset() {
    setName("")
    setEmail("")
    setMessage("")
    setCompany("")
    setErrors({})
    startedAtRef.current = Date.now()
    setStatus("idle")
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-border bg-card px-5 py-8 sm:px-6">
        <p ref={successRef} tabIndex={-1} className="text-lg font-semibold tracking-[-0.02em] text-[var(--nb-primary)] outline-none">
          Thanks! Your note is on its way.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 text-sm text-[var(--nb-secondary)] underline underline-offset-4 hover:text-[var(--nb-primary)]"
        >
          Send another
        </button>
      </div>
    )
  }

  const submitting = status === "submitting"

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-6 sm:px-6"
    >
      <div role="status">
        {status === "error" ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-[var(--nb-primary)]">
            That didn’t go through. Give it another go in a moment.
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={nameId}>Name</Label>
          <Input
            ref={nameRef}
            id={nameId}
            name="name"
            autoComplete="name"
            placeholder="What should we call you?"
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? nameErrorId : undefined}
            className="h-10 text-base"
          />
          {errors.name ? (
            <p id={nameErrorId} className="text-[13px] text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${emailHelpId} ${emailErrorId}` : emailHelpId}
            className="h-10 text-base"
          />
          <p id={emailHelpId} className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
            So we can reply. We won’t add you to any list.
          </p>
          {errors.email ? (
            <p id={emailErrorId} className="text-[13px] text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={messageId}>Message</Label>
        <textarea
          ref={messageRef}
          id={messageId}
          name="message"
          rows={6}
          maxLength={5000}
          placeholder="Which tool, what you typed, and what you expected to see"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? messageErrorId : undefined}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
        />
        {errors.message ? (
          <p id={messageErrorId} className="text-[13px] text-destructive">
            {errors.message}
          </p>
        ) : null}
      </div>
      <div aria-hidden="true" className="sr-only">
        <label>
          Company
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-col items-start gap-3 pt-2">
        <Button type="submit" className="h-10 px-4" disabled={submitting}>
          {submitting ? "Sending…" : "Send note"}
        </Button>
      </div>
    </form>
  )
}
