"use client"

import { Button } from "@/components/ui/button"

export function IntroStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-8 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl max-sm:border max-sm:border-border max-sm:p-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--nb-primary)] sm:text-4xl">
            Welcome, Fielders team.
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--nb-secondary)]">
            This prototype shows what flashing orders could look like live on fielders.com.au. Customers
            can configure, preview, request a quote or pay and order, start to finish.
          </p>
          <p className="text-[15px] leading-relaxed text-[var(--nb-secondary)]">
            Have a play and let us know what you think.
          </p>
        </div>
        <Button type="button" size="lg" className="h-12 w-full px-5 text-base sm:h-11 sm:w-fit" onClick={onStart}>
          Start designing
        </Button>
      </div>
    </div>
  )
}
