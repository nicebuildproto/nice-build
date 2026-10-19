"use client"

import { useEffect, useRef, useState } from "react"
import type { Profile } from "@/lib/workstyle/profile"
import { patternLinks } from "@/lib/workstyle/export/model"
import { SignatureArt } from "./SignatureArt"
import { usePrefersReducedMotion } from "./store"

// The earned reveal: the signature draws itself from the person's own answers, then the headline
// appears. It plays once per completed result, can be skipped at any time, and is instant with
// reduced motion.

export function Reveal({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const reduced = usePrefersReducedMotion()
  const [timedOut, setTimedOut] = useState(false)
  const phase: 0 | 1 = reduced || timedOut ? 1 : 0
  const headingRef = useRef<HTMLHeadingElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const links = patternLinks(profile)

  useEffect(() => {
    if (reduced) return
    const timer = setTimeout(() => setTimedOut(true), 2600)
    return () => clearTimeout(timer)
  }, [reduced])

  useEffect(() => {
    if (phase === 1) headingRef.current?.focus({ preventScroll: true })
    else skipRef.current?.focus({ preventScroll: true })
  }, [phase])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDone()
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [onDone])

  return (
    <div className="ws-reveal" data-tone="ink">
      <div className="ws-reveal-inner">
        <div className="ws-reveal-art">
          <SignatureArt
            input={profile.summary.dimensions}
            links={links}
            tone="ink"
            intro={!reduced}
            duration={2200}
            label="Your work signature, drawn from your answers."
          />
        </div>
        {phase === 0 ? (
          <>
            <p className="ws-reveal-status" role="status">
              Setting your answers against eight dimensions…
            </p>
            <button type="button" ref={skipRef} className="ws-btn ws-btn--quiet ws-btn--small" onClick={onDone}>
              Skip
            </button>
          </>
        ) : (
          <div className="ws-reveal-text">
            <p className="ws-eyebrow">{profile.summary.name ? `${profile.summary.name}’s work style` : "Your work style"}</p>
            <h1 className="ws-h1" ref={headingRef} tabIndex={-1} style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)", outline: "none" }}>
              {profile.headline.title}
            </h1>
            <p className="ws-lede" style={{ maxWidth: "30ch" }}>
              {profile.headline.statement}
            </p>
            <button type="button" className="ws-btn ws-btn--primary" onClick={onDone}>
              Show me the detail
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
