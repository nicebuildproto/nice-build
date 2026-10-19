import type { Metadata } from "next"
import Link from "next/link"
import { SignatureArt } from "@/components/workstyle/SignatureArt"
import { DimensionList, GuideReadOnly, Patterns, SectionHead, SignatureLegend } from "@/components/workstyle/ResultSections"
import { brand, productPath } from "@/lib/workstyle/brand"
import { patternLinks } from "@/lib/workstyle/export/model"
import { buildProfile } from "@/lib/workstyle/profile"
import { cardPath, comparePath, decodeShare } from "@/lib/workstyle/share"
import { profileInVoice } from "@/lib/workstyle/voice"

// A public profile is rendered entirely from the share code in the URL: the headline, signature and the
// dimensions the person chose to include. It holds no answers and fetches nothing.

export async function generateMetadata({ params }: PageProps<"/how-i-work/p/[code]">): Promise<Metadata> {
  const { code } = await params
  const decoded = decodeShare(code)
  if (!decoded.ok) return { title: "Link not recognised", robots: { index: false, follow: false } }
  const profile = profileInVoice(buildProfile(decoded.summary), "third")
  const owner = decoded.summary.name ? `${decoded.summary.name}’s work style` : "A work style"
  const title = `${owner}: ${profile.headline.title}`
  return {
    title,
    description: profile.headline.statement,
    robots: { index: false, follow: false },
    openGraph: { title, description: profile.headline.statement, type: "profile", images: [{ url: cardPath(code), width: 1200, height: 630, alt: `${profile.headline.title} — ${brand.name}` }] },
    twitter: { card: "summary_large_image", title, description: profile.headline.statement, images: [cardPath(code)] },
  }
}

export default async function PublicProfilePage({ params }: PageProps<"/how-i-work/p/[code]">) {
  const { code } = await params
  const decoded = decodeShare(code)

  if (!decoded.ok) {
    return (
      <div className="ws-narrow" style={{ padding: "4rem 1.25rem" }}>
        <div className="ws-stack">
          <p className="ws-eyebrow">Link not recognised</p>
          <h1 className="ws-h2">This link looks incomplete or has been changed.</h1>
          <p className="ws-lede">Ask the person to send it again, or find out how you like to work yourself.</p>
          <div className="ws-cta-row">
            <Link className="ws-btn ws-btn--primary" href={productPath("/start")}>
              Take the assessment
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // The same words the person read about themselves, re-voiced so they make sense to someone else.
  const profile = profileInVoice(buildProfile(decoded.summary), "third")
  const name = decoded.summary.name
  const links = patternLinks(profile)

  return (
    <div className="ws-wrap">
      <section className="ws-result-hero" aria-labelledby="headline">
        <div className="ws-stack">
          <p className="ws-eyebrow">{name ? `${name}’s work style` : "A shared work style"}</p>
          <h1 className="ws-h1" id="headline">
            {profile.headline.title}
          </h1>
          <p className="ws-lede">{profile.headline.statement}</p>
          <p className="ws-muted" style={{ margin: 0, maxWidth: "52ch" }}>
            {profile.headline.lead}
          </p>
          <div className="ws-cta-row">
            <Link className="ws-btn ws-btn--primary" href={comparePath(code)}>
              Compare with how you work
            </Link>
            <Link className="ws-btn" href={productPath("/start")}>
              Find out yours
            </Link>
          </div>
        </div>
        <div className="ws-hero-art">
          <SignatureArt input={profile.summary.dimensions} links={links} intro duration={1400} label={`Work signature. ${profile.headline.title}.`} />
        </div>
      </section>

      <section className="ws-section" aria-labelledby="sig-title">
        <SectionHead id="sig-title" eyebrow="Signature" title="How to read it" intro="Each mark sits between two ways of working. Distance from the centre is where they sit, size is how clear the lean is, and the halo shows how much evidence there was." />
        <div style={{ maxWidth: 360, marginBottom: "1rem" }}>
          <SignatureArt input={profile.summary.dimensions} links={links} labels decorative label="" duration={0} />
        </div>
        <SignatureLegend profile={profile} />
        <Patterns profile={profile} />
      </section>

      <section className="ws-section" aria-labelledby="dims-title">
        <SectionHead id="dims-title" eyebrow="Dimensions" title="What they chose to share" />
        <DimensionList profile={profile} hiddenNote="Some dimensions aren’t shown. People choose what to include, and a missing one says nothing either way." />
      </section>

      <section className="ws-section" aria-labelledby="guide-title">
        <SectionHead id="guide-title" eyebrow="How to work with them" title={name ? `Working with ${name}` : "Working with this person"} intro="In their own voice, written from the dimensions they shared. It’s a starting point; it’s worth asking them how well it fits." />
        <GuideReadOnly guide={profile.guide} />
      </section>

      <section className="ws-closing" aria-label="Make your own">
        <blockquote>A shared work style is a place to start a conversation, not a verdict.</blockquote>
        <div className="ws-cta-row">
          <Link className="ws-btn ws-btn--primary" href={comparePath(code)}>
            Compare with how you work
          </Link>
          <Link className="ws-btn" href={productPath("/start")}>
            Find out yours: {brand.estimatedMinutesLabel}
          </Link>
        </div>
        <p className="ws-muted ws-small" style={{ maxWidth: "58ch" }}>
          {brand.disclaimer} Comparing happens in your browser; nothing is sent to {name ?? "them"}.
        </p>
      </section>
    </div>
  )
}
