"use client"

import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

export function IntroStep({
  onStart,
  notice,
}: {
  onStart: () => void
  notice?: ReactNode
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6">
        {notice}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--nb-primary)] sm:text-4xl">
            Design your flashing
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--nb-secondary)]">
            Configure your flashing profile, finish and dimensions, then review your design before ordering.
          </p>
          <p className="text-sm text-[var(--nb-secondary)]">About 2 minutes</p>
        </div>
        <Button type="button" size="lg" className="h-11 w-fit px-5" onClick={onStart}>
          Start designing
        </Button>
      </div>
    </div>
  )
}
