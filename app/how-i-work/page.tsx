import type { Metadata } from "next"
import Link from "next/link"
import { Glyph } from "@/components/workstyle/Brand"
import { HeroSignature, StartButton } from "@/components/workstyle/Landing"
import { brand, productPath } from "@/lib/workstyle/brand"
import { dimensionIds, dimensions } from "@/lib/workstyle/dimensions"
import { questions } from "@/lib/workstyle/questions"

export const metadata: Metadata = {
  title: { absolute: brand.metaTitle },
  alternates: { canonical: brand.basePath },
}

export default function LandingPage() {
  return (
    <>
      <div className="ws-wrap">
        <section className="ws-hero" aria-labelledby="hero-title">
          <div className="ws-hero-copy">
            <p className="ws-eyebrow">A work-style guide</p>
            <h1 className="ws-h1" id="hero-title">
              Understand how you work. <em>Help others work with you.</em>
            </h1>
            <p className="ws-lede">
              {questions.length} short questions about how you think, decide, focus and talk. You get a picture of your working style, a guide you can edit and hand to a colleague, and a card to share if you want to.
            </p>
            <StartButton />
          </div>
          <HeroSignature />
        </section>
      </div>

      <div className="ws-wrap">
        <section className="ws-band" aria-labelledby="how-title">
          <p className="ws-eyebrow">How it works</p>
          <h2 className="ws-h2" id="how-title" style={{ marginTop: "0.6rem" }}>
            Eight minutes, four chapters, one clear page.
          </h2>
          <ol className="ws-steps">
            <li>
              <h3 className="ws-h3">Answer honestly</h3>
              <p>Choices, sliders, rankings and a few trade-offs. There are no right answers, and no better end of any scale.</p>
            </li>
            <li>
              <h3 className="ws-h3">See your signature</h3>
              <p>Your answers shape a picture that’s unique to you, with a plain-language reading of every dimension and how sure we are about it.</p>
            </li>
            <li>
              <h3 className="ws-h3">Make it useful</h3>
              <p>Edit your “how to work with me” guide, try a small experiment, and share a card or PDF. You decide what leaves your device.</p>
            </li>
          </ol>
        </section>

        <section className="ws-band" aria-labelledby="dims-title">
          <div className="ws-grid-2">
            <div className="ws-stack">
              <p className="ws-eyebrow">What it looks at</p>
              <h2 className="ws-h2" id="dims-title">
                Eight everyday ways of working
              </h2>
              <p className="ws-muted" style={{ margin: 0, maxWidth: "46ch" }}>
                Each one is a spectrum, and neither end is better. Plenty of people sit in the middle or shift with the work and the people, and your result says so when that’s what your answers show.
              </p>
            </div>
            <ul className="ws-dim-grid" style={{ listStyle: "none", padding: 0, margin: 0, gridTemplateColumns: "1fr" }}>
              {dimensionIds.map((id) => (
                <li key={id} className="ws-dim-item">
                  <Glyph id={id} />
                  <div>
                    <h3 className="ws-h3">{dimensions[id].title}</h3>
                    <p>{dimensions[id].asks}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ws-band" aria-labelledby="honest-title">
          <div className="ws-grid-2">
            <div className="ws-stack">
              <p className="ws-eyebrow">What this is, and isn’t</p>
              <h2 className="ws-h2" id="honest-title">
                A conversation starter, not a verdict
              </h2>
            </div>
            <div className="ws-prose">
              <p>
                {brand.name} describes preferences you report about yourself. It can help you notice patterns and put words to them. It isn’t a clinical assessment, an ability test or a hiring tool, and it isn’t a validated psychometric instrument. Please don’t use it to judge, select or rank people.
              </p>
              <p>
                Everything runs in your browser, with no account and nothing sent anywhere. If you share a link, it carries only the dimensions you pick, never your answers.{" "}
                <Link href={productPath("/about#privacy")}>How privacy works</Link> · <Link href={productPath("/about")}>How it’s built</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="ws-band ws-center ws-stack" aria-labelledby="cta-title" style={{ justifyItems: "center", textAlign: "center" }}>
          <h2 className="ws-h2" id="cta-title">
            Ready when you are.
          </h2>
          <StartButton />
        </section>
      </div>
    </>
  )
}
