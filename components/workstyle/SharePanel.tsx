"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { brand } from "@/lib/workstyle/brand"
import { dimensionIds, dimensions } from "@/lib/workstyle/dimensions"
import type { Profile } from "@/lib/workstyle/profile"
import { MAX_NAME_LENGTH, absoluteUrl, cardPath, cardSizes, encodeShare, profilePath, sanitizeName, shareText, type CardFormat } from "@/lib/workstyle/share"
import { scoreResponses, toProfileSummary } from "@/lib/workstyle/scoring"
import { inVoice } from "@/lib/workstyle/voice"
import type { DimensionId, Responses } from "@/lib/workstyle/types"
import { copyText, downloadCard, fetchCard } from "./exports"
import { updateState } from "./store"

type Props = { profile: Profile; responses: Responses; name: string; shareDimensions: DimensionId[] }

export function SharePanel({ profile, responses, name, shareDimensions }: Props) {
  const [nameDraft, setNameDraft] = useState(name)
  const [format, setFormat] = useState<CardFormat>("og")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  // Browser-only facts, read without an effect so the first client render is already correct.
  const noSubscribe = () => () => {}
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "")
  const canShare = useSyncExternalStore(noSubscribe, () => typeof navigator.share === "function", () => false)

  // Names are saved a moment after typing stops, so the preview card isn't rebuilt on every key.
  useEffect(() => {
    if (nameDraft === name) return
    const timer = setTimeout(() => updateState((state) => ({ ...state, name: sanitizeName(nameDraft) ?? "" })), 450)
    return () => clearTimeout(timer)
  }, [nameDraft, name])

  const score = useMemo(() => scoreResponses(responses), [responses])
  const available = dimensionIds.filter((id) => profile.dimensions[id])
  const chosen = shareDimensions.filter((id) => profile.dimensions[id])
  const summary = useMemo(() => toProfileSummary(score, { name: sanitizeName(name), include: chosen }), [score, name, chosen])
  const code = useMemo(() => encodeShare(summary), [summary])
  const path = profilePath(code)
  const url = origin ? absoluteUrl(origin, path) : path
  const title = profile.headline.title
  const statement = inVoice(profile.headline.statement, "first")
  const text = shareText({ title, statement, url, name: summary.name })
  const inviteText = shareText({ title, statement, url, name: summary.name, invite: true })

  const announce = (message: string) => {
    setStatus(message)
    setTimeout(() => setStatus(""), 4000)
  }

  const toggle = (id: DimensionId) =>
    updateState((state) => {
      const next = state.shareDimensions.includes(id) ? state.shareDimensions.filter((candidate) => candidate !== id) : dimensionIds.filter((candidate) => candidate === id || state.shareDimensions.includes(candidate))
      return next.length ? { ...state, shareDimensions: next } : state
    })

  const copy = async (value: string, done: string) => announce((await copyText(value)) ? done : "Couldn’t copy automatically. Select the link and copy it by hand.")

  const nativeShare = async () => {
    try {
      // Prefer sharing the image itself where the browser allows it; otherwise share the link.
      const blob = await fetchCard(cardPath(code, format)).catch(() => null)
      const file = blob ? new File([blob], `${brand.fileSlug}-card.png`, { type: "image/png" }) : null
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text })
      } else {
        await navigator.share({ title, text, url })
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") announce("Sharing didn’t work here. Try copying the link instead.")
    }
  }

  const download = async () => {
    try {
      await downloadCard(cardPath(code, format), format)
      announce("Card downloaded.")
    } catch {
      announce("The card couldn’t be prepared. Please try again.")
    }
  }

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const mailto = `mailto:?subject=${encodeURIComponent(`${summary.name ? `${summary.name}’s` : "My"} work style`)}&body=${encodeURIComponent(text)}`

  return (
    <div className="ws-share">
      <div className="ws-stack">
        <div className="ws-share-card" data-format={format} data-loading={loading && !failed ? "" : undefined}>
          {failed ? (
            <p style={{ color: "#f4efe6", padding: "1.5rem", margin: 0 }}>The preview couldn’t load. Your link and text still work.</p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${code}-${format}`}
              src={cardPath(code, format)}
              alt={`Share card for ${title}`}
              width={cardSizes[format].width}
              height={cardSizes[format].height}
              onLoad={() => {
                setLoading(false)
                setFailed(false)
              }}
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <div className="ws-segmented" role="radiogroup" aria-label="Card shape">
          {(Object.keys(cardSizes) as CardFormat[]).map((key) => (
            <label key={key}>
              <input
                type="radio"
                name="card-format"
                value={key}
                checked={format === key}
                onChange={() => {
                  setFormat(key)
                  setLoading(true)
                  setFailed(false)
                }}
              />
              {key === "og" ? "Wide" : key === "square" ? "Square" : "Portrait"}
            </label>
          ))}
        </div>
        <p className="ws-muted ws-small" style={{ margin: 0 }}>
          {cardSizes[format].label}. The card is drawn from the same signature and headline as your result.
        </p>
      </div>

      <div className="ws-stack">
        <div className="ws-field">
          <label className="ws-label" htmlFor="share-name">
            Name on the card <span className="ws-muted">(optional)</span>
          </label>
          <input id="share-name" className="ws-input" value={nameDraft} maxLength={MAX_NAME_LENGTH} onChange={(event) => setNameDraft(event.target.value)} autoComplete="given-name" placeholder="Leave blank to stay anonymous" />
        </div>

        <fieldset className="ws-stack-sm" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ws-label">What to include</legend>
          <p className="ws-muted ws-small" style={{ margin: 0 }}>
            Anything you untick is left out of the link altogether. It isn’t hidden; it simply isn’t there. Your answers are never included.
          </p>
          <div className="ws-checks">
            {available.map((id) => (
              <label key={id} className="ws-check">
                <input type="checkbox" checked={chosen.includes(id)} onChange={() => toggle(id)} disabled={chosen.length === 1 && chosen.includes(id)} />
                {dimensions[id].title}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="ws-field">
          <label className="ws-label" htmlFor="share-link">
            Your link
          </label>
          <input id="share-link" className="ws-input" readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
          <span className="ws-muted ws-small">The page shows your headline, signature and chosen dimensions. Search engines are asked not to index it. Anyone with the link can see it, so share it as you would a photo.</span>
        </div>

        <div className="ws-share-buttons">
          {canShare ? (
            <button type="button" className="ws-btn ws-btn--primary" onClick={nativeShare}>
              Share…
            </button>
          ) : null}
          <button type="button" className={`ws-btn${canShare ? "" : " ws-btn--primary"}`} onClick={() => copy(url, "Link copied.")}>
            Copy link
          </button>
          <button type="button" className="ws-btn" onClick={download}>
            Download card
          </button>
        </div>
        <div className="ws-share-buttons">
          <button type="button" className="ws-btn ws-btn--small" onClick={() => copy(text, "Text copied.")}>
            Copy as text
          </button>
          <a className="ws-btn ws-btn--small" href={linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a className="ws-btn ws-btn--small" href={mailto}>
            Email
          </a>
          <a className="ws-btn ws-btn--small" href={path} target="_blank" rel="noopener noreferrer">
            Preview public page
          </a>
        </div>
        <div className="ws-card ws-stack-sm">
          <h3 className="ws-h3">Compare with a colleague</h3>
          <p className="ws-muted ws-small" style={{ margin: 0 }}>
            Send this invitation. When they open your link they can take the assessment and see the two of you side by side. There’s no score and no ranking, only questions worth asking each other.
          </p>
          <div>
            <button type="button" className="ws-btn ws-btn--small" onClick={() => copy(inviteText, "Invitation copied.")}>
              Copy invitation
            </button>
          </div>
        </div>
        <p className="ws-toast" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </div>
  )
}
