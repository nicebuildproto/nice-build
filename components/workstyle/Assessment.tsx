"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { brand, productPath } from "@/lib/workstyle/brand"
import { chapterIds, chapters } from "@/lib/workstyle/dimensions"
import { buildSteps, chapterObservation, nextStepKey, previousAnswerStepKey, progressFor, resolveStepKey, stepKeys, type Step } from "@/lib/workstyle/flow"
import { completeState, emptyState, MAX_REFLECTION_LENGTH, readResult, type StoredState } from "@/lib/workstyle/persistence"
import { getFollowUp, getQuestion, questions } from "@/lib/workstyle/questions"
import { assessCompletion, scoreResponses, toProfileSummary } from "@/lib/workstyle/scoring"
import type { Answer, Completion } from "@/lib/workstyle/types"
import { SignatureArt } from "./SignatureArt"
import { getState, updateState, usePrefersReducedMotion, useWorkstyle, type Snapshot } from "./store"
import { FollowUpWidget, QuestionWidget } from "./widgets"

const MAX_REFLECTION = MAX_REFLECTION_LENGTH

export function Assessment() {
  const snapshot = useWorkstyle()
  if (!snapshot) return <div className="ws-loading">Loading…</div>
  return <AssessmentInner snapshot={snapshot} />
}

function AssessmentInner({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter()
  const reduced = usePrefersReducedMotion()
  const { state } = snapshot
  const [dir, setDir] = useState<"forward" | "back">("forward")
  const [resumeAck, setResumeAck] = useState(false)
  const [retaking, setRetaking] = useState(false)
  const [confirmRetake, setConfirmRetake] = useState(false)
  const [blocked, setBlocked] = useState<Completion | null>(null)
  const [reflection, setReflection] = useState(state.reflection)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRender = useRef(true)

  const steps = useMemo(() => buildSteps(state.responses), [state.responses])
  const stepKey = resolveStepKey(steps, state.step)
  const step = steps.find((candidate) => candidate.key === stepKey) as Step
  const progress = useMemo(() => progressFor(steps, stepKey), [steps, stepKey])
  const hasProgress = state.started && Object.keys(state.responses).length > 0
  const result = readResult(state)
  const liveInput = useMemo(() => toProfileSummary(scoreResponses(state.responses)).dimensions, [state.responses])

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])
  useEffect(() => clearTimer, [clearTimer])

  // Move focus to the new step's heading so screen-reader and keyboard users land at the top of it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [stepKey, state.started, resumeAck, retaking])

  const go = useCallback(
    (key: string, direction: "forward" | "back") => {
      clearTimer()
      setDir(direction)
      updateState((current) => ({ ...current, started: true, step: key }))
    },
    [clearTimer],
  )

  const goNext = useCallback(() => {
    const current = getState()
    const latest = buildSteps(current.responses)
    const key = resolveStepKey(latest, current.step)
    const next = nextStepKey(latest, key)
    if (next) go(next, "forward")
  }, [go])

  const goBack = useCallback(() => {
    const current = getState()
    const latest = buildSteps(current.responses)
    const key = resolveStepKey(latest, current.step)
    const previous = previousAnswerStepKey(latest, key)
    if (previous) go(previous, "back")
  }, [go])

  const setAnswer = useCallback(
    (id: string, answer: Answer | null, advance = false) => {
      clearTimer()
      updateState((current) => {
        const responses = { ...current.responses }
        if (answer) responses[id] = answer
        else delete responses[id]
        return { ...current, responses }
      })
      if (advance && answer) {
        timer.current = setTimeout(goNext, reduced ? 120 : 380)
      }
    },
    [clearTimer, goNext, reduced],
  )

  const begin = () => {
    setResumeAck(true)
    go(stepKeys.chapter("c1"), "forward")
  }

  const finish = (withReflection: boolean) => {
    const completion = assessCompletion(state.responses)
    if (!completion.complete) {
      setBlocked(completion)
      return
    }
    updateState((current) => completeState({ ...current, reflection: withReflection ? reflection.trim() : current.reflection }))
    router.push(productPath("/result"))
  }

  const retake = () => {
    clearTimer()
    updateState((current) => ({ ...emptyState(), name: current.name, shareDimensions: current.shareDimensions, pendingCompare: current.pendingCompare }))
    setRetaking(true)
    setResumeAck(true)
    setConfirmRetake(false)
    setBlocked(null)
    setReflection("")
  }

  // Enter continues when an answer is ready; it never fires inside text fields or on buttons and links.
  const answerForStep = step.kind === "question" || step.kind === "followup" ? state.responses[step.id] : undefined
  const canContinue = step.kind === "question" || step.kind === "followup" ? !!answerForStep && answerForStep.format !== "skip" : true
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.defaultPrevented || event.shiftKey || event.metaKey || event.ctrlKey) return
      if (!state.started || !resumeAck && hasProgress || step.kind === "reflect") return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "BUTTON" || tag === "A" || tag === "TEXTAREA" || tag === "SUMMARY" || (tag === "INPUT" && (target as HTMLInputElement).type === "text")) return
      if (!canContinue) return
      event.preventDefault()
      goNext()
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [state.started, resumeAck, hasProgress, step.kind, canContinue, goNext])

  // ───────────── Screens outside the question flow ─────────────

  if (result && !retaking) {
    return (
      <div className="ws-narrow ws-quiz">
        <div className="ws-step ws-stack" data-dir="forward">
          <p className="ws-eyebrow">All done</p>
          <h1 className="ws-h2" ref={headingRef} tabIndex={-1}>
            You’ve finished. Your result is saved on this device.
          </h1>
          <div className="ws-cta-row">
            <a className="ws-btn ws-btn--primary" href={productPath("/result")}>
              See my result
            </a>
            {confirmRetake ? (
              <>
                <button type="button" className="ws-btn ws-btn--danger" onClick={retake}>
                  Yes, replace my result
                </button>
                <button type="button" className="ws-btn ws-btn--quiet" onClick={() => setConfirmRetake(false)}>
                  Keep it
                </button>
              </>
            ) : (
              <button type="button" className="ws-btn" onClick={() => setConfirmRetake(true)}>
                Retake from the start
              </button>
            )}
          </div>
          {confirmRetake ? <p className="ws-notice">Retaking clears your answers and your saved result from this device. Links you’ve already shared keep working.</p> : null}
        </div>
      </div>
    )
  }

  if (!state.started) {
    return (
      <div className="ws-narrow ws-quiz">
        <div className="ws-step ws-stack" data-dir="forward">
          <p className="ws-eyebrow">Before you begin</p>
          <h1 className="ws-h2" ref={headingRef} tabIndex={-1}>
            {questions.length} questions about how you actually like to work.
          </h1>
          <ul className="ws-facts" aria-label="What to expect">
            <li className="ws-chip">{brand.estimatedMinutesLabel}</li>
            <li className="ws-chip">4 short chapters</li>
            <li className="ws-chip">No account</li>
            <li className="ws-chip">Saved as you go</li>
          </ul>
          <ul className="ws-howto">
            <li>There are no right answers, so go with your gut.</li>
            <li>Pick what’s closest, even if it’s not perfect. Think of a typical day, not your best or your worst.</li>
            <li>You can go back, change an answer or skip one. Keys 1–5 pick options; Enter continues.</li>
            <li>Your answers stay in this browser.</li>
          </ul>
          <div className="ws-cta-row">
            <button type="button" className="ws-btn ws-btn--primary" onClick={begin}>
              Begin
            </button>
          </div>
          {snapshot.recovery === "corrupt" ? (
            <p className="ws-notice" role="status">
              We couldn’t read your earlier saved progress, so this starts fresh.
            </p>
          ) : null}
          {snapshot.recovery === "migrated" ? (
            <p className="ws-notice" role="status">
              The questions were updated since you last visited, so earlier answers weren’t carried over. This starts fresh.
            </p>
          ) : null}
          {snapshot.saveFailed ? <SaveWarning /> : null}
        </div>
      </div>
    )
  }

  if (hasProgress && !resumeAck) {
    const answered = Object.keys(state.responses).filter((id) => getQuestion(id)).length
    return (
      <div className="ws-narrow ws-quiz">
        <div className="ws-step ws-stack" data-dir="forward">
          <p className="ws-eyebrow">Welcome back</p>
          <h1 className="ws-h2" ref={headingRef} tabIndex={-1}>
            You’ve answered {answered} of {questions.length}.
          </h1>
          <p className="ws-lede">Pick up where you left off. Your earlier answers are just as you left them.</p>
          <div className="ws-cta-row">
            <button type="button" className="ws-btn ws-btn--primary" onClick={() => setResumeAck(true)}>
              Continue
            </button>
            <button type="button" className="ws-btn" onClick={retake}>
              Start over
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ───────────── The flow ─────────────

  const currentQuestion = step.kind === "question" ? getQuestion(step.id) : undefined
  const currentFollowUp = step.kind === "followup" ? getFollowUp(step.id) : undefined
  const activeChapter = "chapter" in step ? chapters[step.chapter] : null
  const canGoBack = previousAnswerStepKey(steps, stepKey) !== null
  const showAside = step.kind === "question" || step.kind === "followup"

  return (
    <div className="ws-wrap ws-quiz">
      <div className="ws-quiz-top">
        <div
          className="ws-progress"
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={Math.min(progress.total, step.kind === "reflect" ? progress.total : Math.max(0, progress.current - (step.kind === "question" ? 1 : 0)))}
          aria-valuetext={step.kind === "reflect" ? "All questions answered" : `Question ${progress.current} of ${progress.total}${activeChapter ? `, chapter ${activeChapter.number}: ${activeChapter.title}` : ""}`}
        >
          <div className="ws-progress-meta" aria-hidden="true">
            <span>{activeChapter ? `Chapter ${activeChapter.number} · ${activeChapter.title}` : "Last step"}</span>
            <span>
              {step.kind === "reflect" ? "Done" : <><strong>{progress.current}</strong> of {progress.total}</>} · saved on this device
            </span>
          </div>
          <div className="ws-segs" aria-hidden="true" style={{ gridTemplateColumns: progress.segments.map((segment) => `${segment.count}fr`).join(" ") }}>
            {progress.segments.map((segment) => (
              <div key={segment.chapter} className="ws-seg">
                <span style={{ transform: `scaleX(${step.kind === "reflect" ? 1 : segment.fill})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ws-quiz-grid">
        <div className="ws-step" key={stepKey} data-dir={dir}>
          {step.kind === "chapter" ? (
            <div className="ws-chapter">
              <p className="ws-chapter-number" aria-hidden="true">
                {chapters[step.chapter].number}
              </p>
              <p className="ws-eyebrow">Chapter {chapters[step.chapter].number} of {chapterIds.length}</p>
              <h1 className="ws-h1" ref={headingRef} tabIndex={-1} style={{ fontSize: "clamp(2.2rem, 6vw, 3.8rem)" }}>
                {chapters[step.chapter].title}
              </h1>
              <p className="ws-lede">{chapters[step.chapter].intro}</p>
              <div className="ws-actions">
                <button type="button" className="ws-btn ws-btn--primary" onClick={goNext}>
                  Start chapter {chapters[step.chapter].number}
                </button>
                {canGoBack ? (
                  <button type="button" className="ws-btn ws-btn--quiet" onClick={goBack}>
                    Back
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentQuestion ? (
            <>
              <div className="ws-qhead">
                <div className="ws-qmeta">
                  <span className="ws-chip">
                    Question {progress.current} of {progress.total}
                  </span>
                </div>
                <h1 className="ws-prompt" ref={headingRef} tabIndex={-1}>
                  {currentQuestion.prompt}
                </h1>
                {currentQuestion.hint ? <p className="ws-hint">{currentQuestion.hint}</p> : null}
              </div>
              <QuestionWidget
                key={currentQuestion.id}
                question={currentQuestion}
                answer={state.responses[currentQuestion.id]}
                reducedMotion={reduced}
                seed={state.seed}
                onAnswer={(answer, advance) => setAnswer(currentQuestion.id, answer, advance)}
              />
              <Actions
                canGoBack={canGoBack}
                canContinue={canContinue}
                onBack={goBack}
                onContinue={goNext}
                onSkip={() => {
                  setAnswer(currentQuestion.id, { format: "skip" })
                  goNext()
                }}
              />
            </>
          ) : null}

          {currentFollowUp ? (
            <>
              <div className="ws-qhead">
                <div className="ws-qmeta">
                  <span className="ws-chip">A quick follow-up</span>
                  <span className="ws-chip">Optional</span>
                </div>
                <h1 className="ws-prompt" ref={headingRef} tabIndex={-1}>
                  {currentFollowUp.prompt}
                </h1>
                <p className="ws-hint">{currentFollowUp.hint}</p>
              </div>
              <FollowUpWidget key={currentFollowUp.id} followUp={currentFollowUp} answer={state.responses[currentFollowUp.id]} onAnswer={(answer, advance) => setAnswer(currentFollowUp.id, answer, advance)} />
              <Actions
                canGoBack={canGoBack}
                canContinue={canContinue}
                onBack={goBack}
                onContinue={goNext}
                onSkip={() => {
                  setAnswer(currentFollowUp.id, { format: "skip" })
                  goNext()
                }}
              />
            </>
          ) : null}

          {step.kind === "pause" ? <PauseScreen chapter={step.chapter} state={state} input={liveInput} headingRef={headingRef} onContinue={goNext} onBack={canGoBack ? goBack : undefined} /> : null}

          {step.kind === "reflect" ? (
            <div className="ws-stack">
              <div className="ws-qhead">
                <p className="ws-eyebrow">One last thing · optional</p>
                <h1 className="ws-prompt" ref={headingRef} tabIndex={-1}>
                  Finish the sentence, in your own words: “It helps me most when the people I work with…”
                </h1>
                <p className="ws-hint">If you write something, it appears in your own words in your guide. It stays on this device unless you export or share your guide.</p>
              </div>
              <div className="ws-field">
                <label className="ws-label" htmlFor="reflection">
                  It helps me most when the people I work with…
                </label>
                <textarea id="reflection" className="ws-textarea" maxLength={MAX_REFLECTION} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="For example: tell me the question a day before we talk." />
                <span className="ws-counter" aria-hidden="true">
                  {reflection.length}/{MAX_REFLECTION}
                </span>
              </div>
              {blocked ? (
                <div className="ws-notice" role="alert">
                  <p style={{ margin: 0 }}>{blocked.reason ?? "A few more answers are needed before we can build your result."}</p>
                  {blocked.missing[0] ? (
                    <p style={{ margin: "0.6rem 0 0" }}>
                      <button type="button" className="ws-btn ws-btn--small" onClick={() => go(stepKeys.question(blocked.missing[0]), "back")}>
                        Go to the first unanswered question
                      </button>
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="ws-actions">
                <button type="button" className="ws-btn ws-btn--primary" onClick={() => finish(true)}>
                  See my result
                </button>
                <button type="button" className="ws-btn ws-btn--quiet" onClick={goBack}>
                  Back
                </button>
              </div>
            </div>
          ) : null}
          {snapshot.saveFailed ? <SaveWarning /> : null}
        </div>

        {showAside ? (
          <aside className="ws-aside" aria-hidden="true">
            <div style={{ width: 260, height: 260, margin: "0 auto" }}>
              <SignatureArt input={liveInput} decorative label="" duration={700} />
            </div>
            <p>Your signature, taking shape. It keeps changing until the end.</p>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

function Actions({ canGoBack, canContinue, onBack, onContinue, onSkip }: { canGoBack: boolean; canContinue: boolean; onBack: () => void; onContinue: () => void; onSkip: () => void }) {
  return (
    <div className="ws-actions">
      <button type="button" className="ws-btn ws-btn--primary" onClick={onContinue} disabled={!canContinue}>
        Continue
      </button>
      <button type="button" className="ws-btn ws-btn--quiet" onClick={onBack} disabled={!canGoBack}>
        Back
      </button>
      <span className="ws-spacer" />
      <button type="button" className="ws-btn ws-btn--quiet" onClick={onSkip}>
        Skip this one
      </button>
    </div>
  )
}

function PauseScreen({ chapter, state, input, headingRef, onContinue, onBack }: { chapter: "c1" | "c2" | "c3" | "c4"; state: StoredState; input: ReturnType<typeof toProfileSummary>["dimensions"]; headingRef: React.RefObject<HTMLHeadingElement | null>; onContinue: () => void; onBack?: () => void }) {
  const observation = chapterObservation(state.responses, chapter)
  const next = chapters[chapterIds[chapterIds.indexOf(chapter) + 1]]
  return (
    <div className="ws-pause">
      <p className="ws-eyebrow">Chapter {chapters[chapter].number} done</p>
      <h1 className="ws-h2" ref={headingRef} tabIndex={-1}>
        {observation.text}
      </h1>
      <div className="ws-pause-art">
        <SignatureArt input={input} label="Your signature so far: a mark for each dimension you’ve answered about." duration={900} />
      </div>
      <p className="ws-muted" style={{ margin: 0, maxWidth: "46ch" }}>
        That’s your signature so far. Each mark sits between two ways of working, and the picture keeps changing until you finish. Next: <strong style={{ color: "var(--ink)" }}>{next.title}</strong>.
      </p>
      <div className="ws-actions">
        <button type="button" className="ws-btn ws-btn--primary" onClick={onContinue}>
          Continue to chapter {next.number}
        </button>
        {onBack ? (
          <button type="button" className="ws-btn ws-btn--quiet" onClick={onBack}>
            Back
          </button>
        ) : null}
      </div>
    </div>
  )
}

function SaveWarning() {
  return (
    <p className="ws-notice" role="alert">
      Your browser isn’t letting this page save. You can carry on, but your answers will be lost if you close or reload the tab.
    </p>
  )
}
