"use client"

import Link from "next/link"
import { useMemo } from "react"
import { productPath } from "@/lib/workstyle/brand"
import { compareProfiles, type ComparisonItem } from "@/lib/workstyle/compare"
import { dimensions } from "@/lib/workstyle/dimensions"
import { patternLinks } from "@/lib/workstyle/export/model"
import { readResult } from "@/lib/workstyle/persistence"
import { buildProfile } from "@/lib/workstyle/profile"
import { glyphPath } from "@/lib/workstyle/signature"
import type { ProfileSummary } from "@/lib/workstyle/types"
import { Glyph } from "./Brand"
import { SectionHead } from "./ResultSections"
import { SignatureArt } from "./SignatureArt"
import { updateState, useWorkstyle } from "./store"

function MiniTrack({ item, who }: { item: ComparisonItem; who: "mine" | "theirs" }) {
  const spec = dimensions[item.dimension]
  const reading = item[who]
  return (
    <div>
      <span className="ws-compare-who">{who === "mine" ? "You" : "Them"}</span>
      <div>
        <div className="ws-spectrum-track" aria-hidden="true">
          <span className="ws-spectrum-mid" />
          <svg className="ws-spectrum-mark" style={{ left: `${((reading.position + 1) / 2) * 100}%`, width: "1.3rem", height: "1.3rem" }} viewBox="-10 -10 20 20" focusable="false">
            <path d={glyphPath(spec.glyph, 0, 0, 6.5)} fill={who === "mine" ? spec.colour : "none"} stroke={spec.colour} strokeWidth={who === "mine" ? 0 : 2} />
          </svg>
        </div>
        <span className="ws-muted ws-small">{reading.label}</span>
      </div>
    </div>
  )
}

function Item({ item, detail }: { item: ComparisonItem; detail: boolean }) {
  return (
    <li className="ws-compare-item">
      <div className="ws-dim-title">
        <Glyph id={item.dimension} />
        <h3 className="ws-eyebrow">{item.title}</h3>
      </div>
      <p>{item.headline}</p>
      <div className="ws-compare-readings">
        <MiniTrack item={item} who="mine" />
        <MiniTrack item={item} who="theirs" />
      </div>
      <div className="ws-spectrum-ends ws-small" aria-hidden="true">
        <span>{dimensions[item.dimension].a.label}</span>
        <span>{dimensions[item.dimension].b.label}</span>
      </div>
      {detail ? (
        <>
          <p className="ws-compare-q">{item.question}</p>
          <p className="ws-muted ws-small">{item.assumption}</p>
          <p className="ws-small">
            <strong>Worth agreeing:</strong> {item.agreement}
          </p>
        </>
      ) : null}
    </li>
  )
}

export function CompareView({ code, summary }: { code: string; summary: ProfileSummary }) {
  const snapshot = useWorkstyle()
  const theirs = useMemo(() => buildProfile(summary), [summary])
  const result = snapshot ? readResult(snapshot.state) : null
  const mine = useMemo(() => (result ? buildProfile(result.summary) : null), [result])
  const comparison = useMemo(() => (mine ? compareProfiles(mine, theirs) : null), [mine, theirs])
  const them = summary.name ?? "them"

  if (!snapshot) return <div className="ws-loading">Loading…</div>

  if (!mine || !comparison) {
    return (
      <div className="ws-narrow" style={{ padding: "3rem 1.25rem" }}>
        <div className="ws-stack">
          <p className="ws-eyebrow">Compare</p>
          <h1 className="ws-h2">To compare, you need your own result first.</h1>
          <p className="ws-lede">It takes about eight minutes. When you finish, you’ll see how you and {summary.name ?? "this person"} line up, with questions worth asking each other.</p>
          <p className="ws-muted ws-small" style={{ margin: 0 }}>
            The comparison happens in your browser. {summary.name ?? "They"} won’t see your answers or your result.
          </p>
          <div className="ws-cta-row">
            <Link className="ws-btn ws-btn--primary" href={productPath("/start")} onClick={() => updateState((state) => ({ ...state, pendingCompare: code }))}>
              Take the assessment
            </Link>
            <Link className="ws-btn" href={productPath(`/p/${code}`)}>
              Back to {summary.name ? `${summary.name}’s` : "their"} profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ws-wrap">
      <section className="ws-result-hero" aria-labelledby="compare-title">
        <div className="ws-stack">
          <p className="ws-eyebrow">Side by side</p>
          <h1 className="ws-h1" id="compare-title" style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
            You and {summary.name ?? "them"}
          </h1>
          <p className="ws-lede">
            {comparison.shared.length} thing{comparison.shared.length === 1 ? "" : "s"} you share, {comparison.different.length} to talk through, {comparison.flexible.length} where someone can flex.
          </p>
          <p className="ws-muted" style={{ margin: 0, maxWidth: "52ch" }}>
            There’s no score and no “compatibility” here. Two people who work differently can work well together once they’ve said so out loud. This is a way to start that conversation.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <figure style={{ margin: 0 }}>
            <SignatureArt input={mine.summary.dimensions} links={patternLinks(mine)} label="Your signature" />
            <figcaption className="ws-small ws-muted" style={{ textAlign: "center" }}>You</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            <SignatureArt input={theirs.summary.dimensions} links={patternLinks(theirs)} label={`${summary.name ?? "Their"} signature`} />
            <figcaption className="ws-small ws-muted" style={{ textAlign: "center" }}>{summary.name ?? "Them"}</figcaption>
          </figure>
        </div>
      </section>

      {comparison.different.length ? (
        <section className="ws-section" aria-labelledby="diff-title">
          <SectionHead id="diff-title" eyebrow="Worth talking through" title="Where you may differ" intro="Differences like these cause friction mostly when nobody mentions them. Each comes with a question to ask and something you could agree." />
          <ul className="ws-compare-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {comparison.different.map((item) => (
              <Item key={item.dimension} item={item} detail />
            ))}
          </ul>
        </section>
      ) : null}

      {comparison.shared.length ? (
        <section className="ws-section" aria-labelledby="shared-title">
          <SectionHead id="shared-title" eyebrow="In common" title="What you share" intro="Shared preferences are easy to assume and rarely said. Naming them makes them dependable." />
          <ul className="ws-compare-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {comparison.shared.map((item) => (
              <Item key={item.dimension} item={item} detail={false} />
            ))}
          </ul>
        </section>
      ) : null}

      {comparison.flexible.length ? (
        <section className="ws-section" aria-labelledby="flex-title">
          <SectionHead id="flex-title" eyebrow="Room to flex" title="Where one of you is flexible" intro="A middle reading means ‘it depends’, which is useful: the more flexible person can usually meet the other where they are, if they’re told what helps." />
          <ul className="ws-compare-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {comparison.flexible.map((item) => (
              <Item key={item.dimension} item={item} detail={false} />
            ))}
          </ul>
        </section>
      ) : null}

      {comparison.questions.length ? (
        <section className="ws-section" aria-labelledby="questions-title">
          <SectionHead id="questions-title" eyebrow="Start here" title="Questions to ask each other" />
          <ol className="ws-list" style={{ listStyle: "none" }}>
            {comparison.questions.map((question, index) => (
              <li key={question}>
                <span className="ws-rank-n" aria-hidden="true" style={{ fontSize: "1.2rem" }}>
                  {index + 1}
                </span>
                <p className="ws-compare-q">{question}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {comparison.notCompared.length ? (
        <p className="ws-muted ws-small" style={{ marginTop: "2.5rem", maxWidth: "62ch" }}>
          {comparison.notCompared.length} dimension{comparison.notCompared.length === 1 ? " wasn’t" : "s weren’t"} compared: {comparison.notCompared.map((entry) => `${dimensions[entry.dimension].short.toLowerCase()} (${entry.reason === "private" ? "not shared by one of you" : "not enough evidence on one side"})`).join(", ")}.
        </p>
      ) : null}

      <p className="ws-muted ws-small" style={{ marginTop: "2rem", maxWidth: "62ch" }}>
        Everything on this page was worked out in your browser from your saved result and {them === "them" ? "the shared link" : `${them}’s shared link`}. Neither result was uploaded.
      </p>
    </div>
  )
}
