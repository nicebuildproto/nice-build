import type { Metadata } from "next"
import Link from "next/link"
import { Glyph } from "@/components/workstyle/Brand"
import { SectionHead } from "@/components/workstyle/ResultSections"
import { brand, productPath } from "@/lib/workstyle/brand"
import { dimensionIds, dimensions } from "@/lib/workstyle/dimensions"
import { MAX_FOLLOW_UPS, questions } from "@/lib/workstyle/questions"

export const metadata: Metadata = {
  title: "How it works",
  description: "How the questions, scoring, results and privacy work, and where the limits are.",
}

export default function AboutPage() {
  return (
    <div className="ws-narrow" style={{ paddingTop: "2rem" }}>
      <div className="ws-stack" style={{ gap: "1rem" }}>
        <p className="ws-eyebrow">How it works</p>
        <h1 className="ws-h1" style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)" }}>
          How it works, in plain language.
        </h1>
        <p className="ws-lede" style={{ maxWidth: "46ch" }}>
          {brand.name} is a self-reflection tool. Here’s what it measures, how results are produced, what it can’t tell you and what happens to your data.
        </p>
      </div>

      <section className="ws-section" aria-labelledby="measures">
        <SectionHead id="measures" eyebrow="What it looks at" title="Eight dimensions of working" intro={`${questions.length} questions across four chapters, in several formats (choices, sliders, rankings, trade-offs). Each dimension is a spectrum; neither end is better.`} />
        <ul className="ws-dim-grid" style={{ listStyle: "none", padding: 0, margin: 0, gridTemplateColumns: "1fr" }}>
          {dimensionIds.map((id) => (
            <li key={id} className="ws-dim-item">
              <Glyph id={id} />
              <div>
                <h3 className="ws-h3">{dimensions[id].title}</h3>
                <p>
                  {dimensions[id].a.label} ↔ {dimensions[id].b.label}. {dimensions[id].asks}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="ws-muted ws-small" style={{ marginTop: "1.25rem" }}>
          These eight were chosen because they’re things teams talk about every day. They’re our own working framework, informed by research on cognitive style, uncertainty, feedback and communication, but they are not a copy of any published test.
        </p>
      </section>

      <section className="ws-section ws-prose" aria-labelledby="scoring">
        <SectionHead id="scoring" eyebrow="Scoring" title="Fixed rules, no guesswork" />
        <p>Every answer moves one or two dimensions a little towards one end or the other. Your position on a dimension is the weighted average of the answers about it. That is a calculation, not a judgement, and the same answers always give the same result.</p>
        <p>
          We also keep track of two things separately from where you sit: how much your answers <em>disagreed</em> (a wide spread means “it depends”), and how much <em>evidence</em> there is (skipped or few answers mean a lower-confidence reading). Both show up in your result, so a middle reading isn’t mistaken for a lack of preference, and a thin one isn’t presented as fact.
        </p>
        <p>
          Up to {MAX_FOLLOW_UPS} optional follow-up questions appear when your answers suggest a context matters, such as “alone then together” or “depends on the stakes”. They add detail to the wording of your results and never change a score.
        </p>
        <p>The words in your results are written by us in advance, then assembled from your scores by rules. No AI model is involved in scoring or in writing your result.</p>
      </section>

      <section className="ws-section ws-prose" aria-labelledby="limits">
        <SectionHead id="limits" eyebrow="Limits" title="What this can’t tell you" />
        <p>{brand.disclaimer}</p>
        <p>
          The eight dimensions are exploratory. We haven’t yet tested the questions on large groups of people to check that they measure what they’re meant to, or that results are stable over time. Until that’s done, treat your result as a well-structured prompt for reflection, and check it against how colleagues actually experience working with you. It shouldn’t be used to hire, promote, rank or make decisions about other people, and it’s no substitute for talking to them.
        </p>
      </section>

      <section className="ws-section ws-prose" aria-labelledby="privacy">
        <SectionHead id="privacy" eyebrow="Privacy" title="Your answers stay with you" />
        <p>
          <strong>No account, no email.</strong> We don’t ask who you are.
        </p>
        <p>
          <strong>Saved only in your browser.</strong> Progress and results are kept in this browser’s local storage so you can come back. We never receive them. Clearing your browser data, or using the “Delete my answers and result” button on your result page, removes them.
        </p>
        <p>
          <strong>Sharing is opt-in and limited.</strong> A share link contains a short code with the dimensions you chose, an optional name and nothing else, never your answers. Anything you untick isn’t in the code at all. The shared page asks search engines not to index it, but anyone you give the link to can open it, so treat it like a photo you’re posting.
        </p>
        <p>
          <strong>No behavioural tracking on your answers.</strong> Session-replay tools are switched off for these pages, and the link code is stripped from page-view analytics.
        </p>
        <p>
          <strong>Comparing</strong> happens in your browser: it combines your saved result with the link someone sent you. They don’t see yours.
        </p>
      </section>

      <section className="ws-section ws-prose" aria-labelledby="access">
        <SectionHead id="access" eyebrow="Accessibility" title="Built to be used any way you work" />
        <p>
          Everything can be done with a keyboard (arrow keys move between choices, number keys pick them, Enter continues). Rankings use buttons rather than drag-and-drop, and trade-offs use steppers. Animation stops if your device asks for reduced motion, and nothing relies on colour alone. If something doesn’t work for you, please tell us.
        </p>
      </section>

      <div className="ws-cta-row" style={{ marginTop: "3rem" }}>
        <Link className="ws-btn ws-btn--primary" href={productPath("/start")}>
          Take it: {brand.estimatedMinutesLabel}
        </Link>
      </div>
    </div>
  )
}
