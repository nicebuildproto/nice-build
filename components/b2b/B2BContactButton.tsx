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

export function B2BContactButton({ label = "Contact" }: { label?: string }) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const nameId = useId()
  const emailId = useId()
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
        className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-[var(--nb-primary)] transition-colors outline-none hover:bg-[var(--nb-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
      </DialogTrigger>
      <DialogContent className="w-[min(100%-2rem,28rem)]">
        {sent ? (
          <DialogHeader>
            <DialogTitle>Noted on this page.</DialogTitle>
            <DialogDescription>
              The form isn’t connected to an inbox yet, so nothing was sent or stored. We’ll follow
              up once this prototype is wired through.
            </DialogDescription>
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
              <DialogTitle>Contact Nice Tools</DialogTitle>
              <DialogDescription>
                Tell us what you think of the flashing designer — what worked, what didn’t, and
                what you’d want next.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={nameId}>Name</Label>
                <Input id={nameId} name="name" autoComplete="name" required className="h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={emailId}>Email</Label>
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={messageId}>Message</Label>
                <textarea
                  id={messageId}
                  name="message"
                  required
                  rows={5}
                  placeholder="Thoughts on the flashing designer…"
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
            <Button type="submit" className="mt-6 h-10 w-full">
              Send
            </Button>
            <p className="mt-3 text-center text-xs text-[var(--nb-secondary)]">
              Nothing is stored. This inbox isn’t connected yet.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
