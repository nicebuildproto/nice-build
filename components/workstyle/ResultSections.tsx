import { dimensionIds, dimensions } from "@/lib/workstyle/dimensions"
import type { DimensionView, GuideStatement, Insight, Profile } from "@/lib/workstyle/profile"
import { glyphPath } from "@/lib/workstyle/signature"
import type { DimensionId, GlyphKind } from "@/lib/workstyle/types"
import { Glyph } from "./Brand"

// Presentational sections shared by your own result and by a public share page. Nothing here reads
// storage or answers; it only draws a Profile, so a shared page can never show more than the profile holds.

const evidenceWords = { good: "Good evidence", some: "Some evidence", thin: "Thin evidence" } as const

function pct(position: number) {
  return `${((position + 1) / 2) * 100}%`
}

export function Spectrum({ id, view }: { id: DimensionId; view: DimensionView }) {
  const spec = dimensions[id]
  const [low, high] = view.range
  return (
    <div className="ws-spectrum">
      <div className="ws-spectrum-track" aria-hidden="true">
        <span className="ws-spectrum-mid" />
        <span className="ws-spectrum-range" style={{ left: pct(low), width: `${((high - low) / 2) * 100}%`, background: spec.colour }} />
        <svg className="ws-spectrum-mark" style={{ left: pct(view.position) }} viewBox="-10 -10 20 20" focusable="false">
          <path d={glyph(spec.glyph)} fill={spec.colour} />
        </svg>
      </div>
      <div className="ws-spectrum-ends" aria-hidden="true">
        <span>{spec.a.label}</span>
        <span>{spec.b.label}</span>
      </div>
    </div>
  )
}

// Marks in the spectrum reuse the signature glyph shapes so one visual language runs through the product.
const glyph = (kind: GlyphKind) => glyphPath(kind, 0, 0, 6.5)

export function DimensionList({ profile, why, hiddenNote }: { profile: Profile; why?: Partial<Record<DimensionId, string[]>>; hiddenNote?: string }) {
  const shown = dimensionIds.filter((id) => profile.dimensions[id])
  const hidden = dimensionIds.length - shown.length
  return (
    <>
      <ol className="ws-dims">
        {dimensionIds.map((id) => {
          const view = profile.dimensions[id]
          if (!view) return null
          const spec = dimensions[id]
          const reasons = why?.[id]
          return (
            <li key={id} className="ws-dim" id={`dimension-${id}`}>
              <div className="ws-dim-head">
                <h3 className="ws-dim-title">
                  <Glyph id={id} />
                  <span className="ws-eyebrow">{spec.title}</span>
                </h3>
                <span className="ws-chip">{evidenceWords[view.evidence]}</span>
              </div>
              <p className="ws-dim-label">{view.label}</p>
              <Spectrum id={id} view={view} />
              <p>{view.summary}</p>
              <div className="ws-dim-notes">
                <span>{view.strengthNote}</span>
                {view.rangeNote ? <span>{view.rangeNote}</span> : null}
                <span>{view.evidenceNote}</span>
              </div>
              {reasons && reasons.length ? (
                <details className="ws-details">
                  <summary>Which of your answers shaped this</summary>
                  <ul>
                    {reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          )
        })}
      </ol>
      {hidden > 0 && hiddenNote ? <p className="ws-muted ws-small">{hiddenNote}</p> : null}
    </>
  )
}

export function InsightList({ items, badge }: { items: (Insight & { support?: "supported" | "tentative" })[]; badge?: boolean }) {
  return (
    <ul className="ws-list">
      {items.map((item) => (
        <li key={item.id}>
          <Glyph id={item.sources[0]?.dimension ?? "thinking"} size={18} />
          <div>
            <p>{item.text}</p>
            {badge && item.support ? (
              <span className={`ws-badge ${item.support === "supported" ? "ws-badge--solid" : "ws-badge--soft"}`}>{item.support === "supported" ? "Well supported by your answers" : "A tentative guess"}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Patterns({ profile }: { profile: Profile }) {
  if (!profile.patterns.length) return null
  return (
    <div className="ws-patterns">
      {profile.patterns.map((pattern) => (
        <article key={pattern.id} className="ws-pattern">
          <div className="ws-pattern-dots" aria-hidden="true">
            {pattern.sources.map((source) => (
              <Glyph key={source.dimension} id={source.dimension} size={16} />
            ))}
          </div>
          <h3 className="ws-h3">{pattern.title}</h3>
          <p>{pattern.text}</p>
        </article>
      ))}
    </div>
  )
}

export function GuideReadOnly({ guide }: { guide: GuideStatement[] }) {
  return (
    <ol className="ws-guide">
      {guide.map((statement) => (
        <li key={statement.id}>
          <p className="ws-guide-label">{statement.label}</p>
          <p className="ws-guide-text">{statement.text}</p>
        </li>
      ))}
    </ol>
  )
}

export function SectionHead({ id, eyebrow, title, intro }: { id?: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="ws-section-head">
      <p className="ws-eyebrow">{eyebrow}</p>
      <h2 className="ws-h2" id={id}>
        {title}
      </h2>
      {intro ? <p>{intro}</p> : null}
    </div>
  )
}

export function SignatureLegend({ profile }: { profile: Profile }) {
  return (
    <ul className="ws-legend">
      {dimensionIds.map((id) => {
        const view = profile.dimensions[id]
        return (
          <li key={id}>
            <Glyph id={id} size={16} />
            <span>
              {dimensions[id].short}
              {view ? `: ${view.label}` : ": not shown"}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
