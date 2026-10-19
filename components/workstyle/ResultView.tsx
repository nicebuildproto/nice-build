"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { dimensionIds } from "@/lib/workstyle/dimensions"
import { patternLinks } from "@/lib/workstyle/export/model"
import { buildProfile } from "@/lib/workstyle/profile"
import { readResult } from "@/lib/workstyle/persistence"
import { getQuestion } from "@/lib/workstyle/questions"
import { describeAnswer, scoreResponses } from "@/lib/workstyle/scoring"
import { comparePath, decodeShare, sanitizeName } from "@/lib/workstyle/share"
import { productPath } from "@/lib/workstyle/brand"
import type { DimensionId } from "@/lib/workstyle/types"
import { GuideEditor } from "./GuideEditor"
import { Reveal } from "./Reveal"
import { DimensionList, InsightList, Patterns, SectionHead, SignatureLegend } from "./ResultSections"
import { SharePanel } from "./SharePanel"
import { SignatureArt } from "./SignatureArt"
import { clearAll, REVEAL_KEY, useWorkstyle, type Snapshot } from "./store"

export function ResultView() {
  const snapshot = useWorkstyle()
  if (!snapshot) return <div className="ws-loading">Loading your result…</div>
  const result = readResult(snapshot.state)
  if (!result) return <NoResult snapshot={snapshot} />
  return <ResultInner snapshot={snapshot} completedAt={result.completedAt} />
}

function NoResult({ snapshot }: { snapshot: Snapshot }) {
  const started = snapshot.state.started && Object.keys(snapshot.state.responses).length > 0
  return (
    <div className="ws-narrow" style={{ padding: "4rem 1.25rem" }}>
      <div className="ws-stack">
        <p className="ws-eyebrow">No result yet</p>
        <h1 className="ws-h2">{started ? "You’re partway through." : "There’s nothing saved on this device."}</h1>
        <p className="ws-lede">
          {started ? "Finish the questions and your result will appear here." : "Your result is built from your own answers, so it appears once you’ve taken the assessment. It’s saved in this browser, so a different device or a cleared browser starts fresh."}
        </p>
        <div className="ws-cta-row">
          <Link className="ws-btn ws-btn--primary" href={productPath("/start")}>
            {started ? "Continue" : "Start the assessment"}
          </Link>
        </div>
      </div>
    </div>
  )
}

function ResultInner({ snapshot, completedAt }: { snapshot: Snapshot; completedAt: string }) {
  const router = useRouter()
  const { state } = snapshot
  const result = readResult(state)!
  const [revealing, setRevealing] = useState(() => {
    try {
      return window.sessionStorage.getItem(REVEAL_KEY) !== completedAt
    } catch {
      return false
    }
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const summary = useMemo(() => ({ ...result.summary, name: sanitizeName(state.name) }), [result.summary, state.name])
  const profile = useMemo(() => buildProfile(summary), [summary])
  const links = useMemo(() => patternLinks(profile), [profile])
  const why = useMemo(() => {
    const score = scoreResponses(state.responses)
    const lines: Partial<Record<DimensionId, string[]>> = {}
    for (const id of dimensionIds) {
      const seen = new Set<string>()
      lines[id] = score.dimensions[id].signals.flatMap((signal) => {
        if (seen.has(signal.questionId)) return []
        seen.add(signal.questionId)
        const question = getQuestion(signal.questionId)
        const described = question ? describeAnswer(question, state.responses[signal.questionId]) : null
        return question && described ? [`“${question.prompt}” You said: ${described}`] : []
      })
    }
    return lines
  }, [state.responses])

  const pendingCompare = useMemo(() => {
    if (!state.pendingCompare) return null
    const decoded = decodeShare(state.pendingCompare)
    return decoded.ok ? { code: state.pendingCompare, name: decoded.summary.name } : null
  }, [state.pendingCompare])

  const finishReveal = useCallback(() => {
    try {
      window.sessionStorage.setItem(REVEAL_KEY, completedAt)
    } catch {
      // Without session storage the reveal may replay on reload; harmless.
    }
    setRevealing(false)
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [completedAt])

  if (revealing) return <Reveal profile={profile} onDone={finishReveal} />

  const heading = state.name ? `${state.name}’s work style` : "Your work style"
  const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(completedAt))

  return (
    <>
      <div className="ws-wrap">
        <section className="ws-result-hero" aria-labelledby="headline">
          <div className="ws-stack">
            <p className="ws-eyebrow">
              {heading} · {dateLabel}
            </p>
            <h1 className="ws-h1" id="headline">
              {profile.headline.title}
            </h1>
            <p className="ws-lede">{profile.headline.statement}</p>
            <p className="ws-muted" style={{ margin: 0, maxWidth: "52ch" }}>
              {profile.headline.lead}
            </p>
            <div className="ws-cta-row">
              <a className="ws-btn ws-btn--primary" href="#share">
                Share it
              </a>
              <a className="ws-btn" href="#guide">
                Edit my guide
              </a>
            </div>
          </div>
          <div className="ws-hero-art">
            <SignatureArt input={profile.summary.dimensions} links={links} label={`Your work signature. ${profile.headline.title}.`} />
          </div>
        </section>
      </div>

      <nav className="ws-sectionnav" aria-label="On this page">
        <ul>
          <li><a href="#signature">Signature</a></li>
          <li><a href="#dimensions">Dimensions</a></li>
          <li><a href="#best">Best &amp; friction</a></li>
          <li><a href="#guide">How to work with me</a></li>
          <li><a href="#experiments">Experiments</a></li>
          <li><a href="#notice">What others may notice</a></li>
          <li><a href="#share">Share</a></li>
        </ul>
      </nav>

      <div className="ws-wrap">
        {pendingCompare ? (
          <div className="ws-notice" style={{ marginTop: "2rem" }}>
            You opened this from {pendingCompare.name ? `${pendingCompare.name}’s` : "a colleague’s"} shared profile.{" "}
            <Link href={comparePath(pendingCompare.code)}>See how you two compare</Link>. Nothing is sent to them.
          </div>
        ) : null}

        <section className="ws-section" id="signature" aria-labelledby="signature-title">
          <SectionHead id="signature-title" eyebrow="Your signature" title="A picture of how you work" intro="Eight marks, one for each dimension, drawn from your own answers. Nothing about it is random: change an answer and it moves." />
          <div className="ws-result-split">
            <div className="ws-sticky">
              <div style={{ maxWidth: 340 }}>
                <SignatureArt input={profile.summary.dimensions} links={links} labels label="Your signature with each dimension labelled." />
              </div>
            </div>
            <div className="ws-stack">
              <div className="ws-prose">
                <p>
                  <strong>Distance from the centre</strong> shows where you sit between two ways of working. <strong>Bigger marks</strong> mean a clearer lean, and <strong>a tighter halo</strong> means more of your answers backed it up.{" "}
                  <strong>Small dots</strong> show how much your answers varied, and <strong>dashed arcs</strong> join dimensions that form a pattern.
                </p>
              </div>
              <SignatureLegend profile={profile} />
              <Patterns profile={profile} />
            </div>
          </div>
        </section>

        <section className="ws-section" id="dimensions" aria-labelledby="dimensions-title">
          <SectionHead id="dimensions-title" eyebrow="The eight dimensions" title="Where you sit, and how sure we are" intro="Each is a spectrum with no good end. The shaded band shows how far your answers varied; a wide one means ‘it depends’." />
          <DimensionList profile={profile} why={why} />
        </section>

        <section className="ws-section" id="best" aria-label="Best and friction">
          <div className="ws-columns">
            <div>
              <SectionHead eyebrow="At your best" title="What brings out your best" />
              <InsightList items={profile.best} />
            </div>
            <div>
              <SectionHead eyebrow="Friction" title="Where it may get bumpy" intro="Friction is about fit between people, not a flaw in either." />
              <InsightList items={profile.friction} />
            </div>
          </div>
        </section>

        <section className="ws-section" id="guide" aria-labelledby="guide-title">
          <SectionHead id="guide-title" eyebrow="How to work with me" title="A guide you can hand to a colleague" intro="Written in your voice from your results. Edit anything that doesn’t sound like you; your changes are saved here and used in every export." />
          <GuideEditor profile={profile} suggested={profile.guide} edits={state.guideEdits} reflection={state.reflection} />
        </section>

        <section className="ws-section" id="experiments" aria-labelledby="experiments-title">
          <SectionHead id="experiments-title" eyebrow="Try this" title="Three small experiments" intro="Each is meant to run for a week. Treat them as questions, not advice." />
          <ol className="ws-experiments">
            {profile.experiments.map((experiment) => (
              <li key={experiment.id}>
                <p>{experiment.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="ws-section" id="notice" aria-labelledby="notice-title">
          <SectionHead id="notice-title" eyebrow="From the outside" title="What colleagues may notice" intro="Some of these your answers support well; others are educated guesses. Ask someone who works with you which ring true." />
          <InsightList items={profile.notice} badge />
        </section>

        <section className="ws-section" id="share" aria-labelledby="share-title">
          <SectionHead id="share-title" eyebrow="Share" title="Share only what you want to" intro="Pick what goes into the link, add a name if you like, and preview the card before anything leaves this device." />
          <SharePanel profile={profile} responses={state.responses} name={state.name} shareDimensions={state.shareDimensions} />
        </section>

        <section className="ws-closing" aria-labelledby="closing-title">
          <p className="ws-eyebrow" id="closing-title">
            One last thing
          </p>
          <blockquote>{profile.closing}</blockquote>
          <ul className="ws-caveats">
            {profile.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </section>

        <section className="ws-section" aria-label="Your data">
          <hr className="ws-rule" />
          <div className="ws-stack" style={{ paddingTop: "2rem" }}>
            <h2 className="ws-h3">Your data</h2>
            <p className="ws-muted ws-small" style={{ margin: 0, maxWidth: "60ch" }}>
              Your answers and result live only in this browser. Deleting them here doesn’t affect links you’ve already shared, because those carry a copy of the dimensions you chose.
            </p>
            <div className="ws-cta-row">
              <Link className="ws-btn ws-btn--small" href={productPath("/start")}>
                Retake the assessment
              </Link>
              {confirmDelete ? (
                <>
                  <button
                    type="button"
                    className="ws-btn ws-btn--small ws-btn--danger"
                    onClick={() => {
                      clearAll()
                      router.push(productPath())
                    }}
                  >
                    Yes, delete everything
                  </button>
                  <button type="button" className="ws-btn ws-btn--small ws-btn--quiet" onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </button>
                </>
              ) : (
                <button type="button" className="ws-btn ws-btn--small" onClick={() => setConfirmDelete(true)}>
                  Delete my answers and result
                </button>
              )}
              <button type="button" className="ws-btn ws-btn--small ws-btn--quiet" onClick={() => setRevealing(true)}>
                Replay the reveal
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
