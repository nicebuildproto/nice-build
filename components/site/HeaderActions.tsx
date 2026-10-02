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
import { Moon, Sun } from "lucide-react"
import { useEffect, useId, useState } from "react"

const storageKey = "nb-theme"

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark")
  localStorage.setItem(storageKey, theme)
}

export function HeaderActions() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  const emailId = useId()
  const passwordId = useId()

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
  }, [])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    applyTheme(next)
    setTheme(next)
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
        className="text-[var(--nb-secondary)] hover:bg-[var(--nb-accent)] hover:text-[var(--nb-primary)]"
      >
        {theme === "dark" ? <Sun /> : <Moon />}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setDone(false)
            setEmail("")
          }
        }}
      >
        <DialogTrigger
          className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-[var(--nb-primary)] transition-colors outline-none hover:bg-[var(--nb-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Log in
        </DialogTrigger>
        <DialogContent>
          {done ? (
            <DialogHeader>
              <DialogTitle>Accounts are on the way.</DialogTitle>
              <DialogDescription>
                Nothing was saved. This screen is a preview of signing in to Nice Build.
              </DialogDescription>
            </DialogHeader>
          ) : (
            <form
              className="flex flex-col"
              onSubmit={(event) => {
                event.preventDefault()
                if (!email.trim()) return
                setDone(true)
              }}
            >
              <DialogHeader>
                <DialogTitle>Log in</DialogTitle>
                <DialogDescription>
                  A quiet place for your account. Signing in is not available yet.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={emailId}>Email</Label>
                  <Input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={passwordId}>Password</Label>
                  <Input
                    id={passwordId}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-10"
                  />
                </div>
              </div>

              <Button type="submit" className="mt-6 h-10 w-full">
                Continue
              </Button>
              <p className="mt-3 text-center text-xs text-[var(--nb-secondary)]">
                No account is created.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
