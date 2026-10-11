"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useId, useState } from "react"

export function B2BContactButton({ label = "Contact", appearance = "solid" }: { label?: string; appearance?: "solid" | "ghost" }) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const nameId = useId()
  const emailId = useId()
  const phoneId = useId()
  const messageId = useId()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSent(false)
      }}
    >
      <DialogTrigger
        className={
          appearance === "ghost"
            ? "inline-flex h-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            : "inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-[var(--nb-primary)] transition-colors outline-none hover:bg-[var(--nb-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
        }
      >
        {label}
      </DialogTrigger>
      <DialogContent
        className="w-[min(100%-2rem,28rem)] bg-background max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:overscroll-contain max-sm:rounded-none max-sm:px-4 max-sm:pt-[max(1.5rem,env(safe-area-inset-top))] max-sm:pb-0"
      >
        {sent ? (
          <DialogHeader>
            <DialogTitle>Thanks — we’ll come back to you directly.</DialogTitle>
            <DialogDescription>No mailing lists, no spam.</DialogDescription>
          </DialogHeader>
        ) : (
          <form
            className="flex flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              setSent(true)
            }}
          >
            <DialogHeader>
              <DialogTitle>Interested in this for Fielders?</DialogTitle>
              <DialogDescription>
                This is a working prototype, built to show what a flashing designer could look like on
                your own site. If it’s a fit, let’s talk about what it’d take to make it real — no
                obligation, just a conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={nameId}>Name</Label>
                <Input id={nameId} name="name" autoComplete="name" enterKeyHint="next" required className="h-12 sm:h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={emailId}>Email</Label>
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  enterKeyHint="next"
                  required
                  className="h-12 sm:h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={phoneId}>Best contact number</Label>
                <Input
                  id={phoneId}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  required
                  className="h-12 sm:h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={messageId}>Message</Label>
                <textarea
                  id={messageId}
                  name="message"
                  rows={4}
                  placeholder="Anything specific you'd like to know?"
                  enterKeyHint="done"
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base leading-relaxed sm:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
            <div className="sticky bottom-0 mt-6 bg-background pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:pb-0">
              <Button type="submit" className="h-12 w-full sm:h-10">
                Start the conversation
              </Button>
              <p className="mt-3 text-center text-xs text-[var(--nb-secondary)]">
                We’ll come back to you directly — no mailing lists, no spam.
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
