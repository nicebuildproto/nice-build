"use client"

import { useState } from "react"
import { MAX_EDIT_LENGTH, MAX_REFLECTION_LENGTH } from "@/lib/workstyle/persistence"
import type { GuideStatement, Profile } from "@/lib/workstyle/profile"
import { copyText, downloadGuidePdf, downloadMarkdown, guideText } from "./exports"
import { updateState } from "./store"

type Props = {
  profile: Profile
  /** Suggested statements, before any edits. */
  suggested: GuideStatement[]
  edits: Record<string, string>
  reflection: string
}

export function GuideEditor({ profile, suggested, edits, reflection }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  // While a box is open we keep the raw text, so it can be emptied and retyped without snapping back.
  const [draft, setDraft] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  const effective: GuideStatement[] = [
    ...suggested.map((statement) => ({ ...statement, text: edits[statement.id]?.trim() || statement.text })),
    ...(reflection.trim() || editing === "own" ? [{ id: "own" as const, label: "It helps me most when the people I work with…", text: reflection.trim(), sources: [] }] : []),
  ]

  const setEdit = (id: string, text: string) =>
    updateState((state) => {
      const guideEdits = { ...state.guideEdits }
      if (text.trim()) guideEdits[id] = text.slice(0, MAX_EDIT_LENGTH)
      else delete guideEdits[id]
      return { ...state, guideEdits }
    })

  const announce = (message: string) => {
    setStatus(message)
    setTimeout(() => setStatus(""), 3500)
  }

  const run = async (action: () => Promise<void> | void, done: string) => {
    setBusy(true)
    try {
      await action()
      announce(done)
    } catch {
      announce("That didn’t work. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ws-stack">
      <ol className="ws-guide">
        {effective.map((statement) => {
          const isOwn = statement.id === "own"
          const edited = !isOwn && !!edits[statement.id]?.trim()
          const open = editing === statement.id
          return (
            <li key={statement.id}>
              <p className="ws-guide-label">
                {statement.label} {edited ? <span className="ws-edited">(edited)</span> : null}
              </p>
              {open ? (
                <div className="ws-field">
                  <label className="ws-sr" htmlFor={`edit-${statement.id}`}>
                    Edit: {statement.label}
                  </label>
                  <textarea
                    id={`edit-${statement.id}`}
                    className="ws-textarea"
                    value={draft ?? (isOwn ? reflection : (edits[statement.id] ?? statement.text))}
                    maxLength={isOwn ? MAX_REFLECTION_LENGTH : MAX_EDIT_LENGTH}
                    onChange={(event) => {
                      setDraft(event.target.value)
                      if (isOwn) updateState((state) => ({ ...state, reflection: event.target.value.slice(0, MAX_REFLECTION_LENGTH) }))
                      else setEdit(statement.id, event.target.value)
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <p className="ws-guide-text">{statement.text}</p>
              )}
              <div className="ws-guide-actions">
                <button type="button" className="ws-btn ws-btn--quiet ws-btn--small" onClick={() => {
                    setEditing(open ? null : statement.id)
                    setDraft(null)
                  }}
                  aria-expanded={open}
                >
                  {open ? "Done" : "Edit"}
                  <span className="ws-sr"> {statement.label}</span>
                </button>
                {edited ? (
                  <button
                    type="button"
                    className="ws-btn ws-btn--quiet ws-btn--small"
                    onClick={() => {
                      setEdit(statement.id, "")
                      setEditing(null)
                      setDraft(null)
                    }}
                  >
                    Reset to suggested<span className="ws-sr"> {statement.label}</span>
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
      {!reflection.trim() && editing !== "own" ? (
        <p style={{ margin: 0 }}>
          <button
            type="button"
            className="ws-btn ws-btn--quiet ws-btn--small"
            onClick={() => {
              setEditing("own")
              setDraft(null)
            }}
          >
            + Add a line in your own words
          </button>
        </p>
      ) : null}
      <div className="ws-share-buttons">
        <button type="button" className="ws-btn ws-btn--primary ws-btn--small" disabled={busy} onClick={() => run(() => downloadGuidePdf(profile, effective), "Guide downloaded.")}>
          Download guide (PDF)
        </button>
        <button type="button" className="ws-btn ws-btn--small" onClick={() => run(async () => { if (!(await copyText(guideText(profile, effective)))) throw new Error("copy") }, "Copied. Paste it into a doc, a Slack bio or an email.")}>
          Copy as text
        </button>
        <button type="button" className="ws-btn ws-btn--small" onClick={() => run(() => downloadMarkdown(profile, effective), "Markdown downloaded.")}>
          Download full profile (Markdown)
        </button>
      </div>
      <p className="ws-toast" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}
