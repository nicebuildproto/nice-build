"use client"

import { Button } from "@/components/ui/button"
import { flashingLabel } from "./chrome"
import { OnboardingCard, onboardingBody, onboardingCta, onboardingHeading } from "./Onboarding"

export function IntroStep({ onStart }: { onStart: () => void }) {
  return (
    <OnboardingCard>
      <div className="flex flex-col gap-3">
        <p className={flashingLabel}>A working prototype by Nice Tools</p>
        <h1 className={onboardingHeading}>Welcome, Fielders team.</h1>
        <p className={onboardingBody}>
          We’ve built this to make ordering easier for your customers and simpler for your team to manage.
        </p>
        <p className={onboardingBody}>
          If you see a fit for Fielders, give me a call on{" "}
          <a
            href="tel:0497999339"
            className="whitespace-nowrap text-[var(--nb-primary)] underline underline-offset-4"
          >
            0497 999 339
          </a>{" "}
          to discuss bringing it to fielders.com.au.
        </p>
        <p className={onboardingBody}>
          Cheers,
          <br />
          Mitch
        </p>
      </div>
      <div role="note" className="flex flex-col gap-0.5 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Prototype disclaimer</p>
        <p>Pricing is indicative only and hasn’t been configured to Fielders’ pricing rules.</p>
      </div>
      <Button type="button" size="lg" className={onboardingCta} onClick={onStart}>
        Try the prototype
      </Button>
    </OnboardingCard>
  )
}
