"use client"

import { Button } from "@/components/ui/button"

export function IntroStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6">
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
        <Button type="button" size="lg" className="h-11 w-fit px-5" onClick={onStart}>
          Start designing
        </Button>
      </div>
    </div>
  )
}
