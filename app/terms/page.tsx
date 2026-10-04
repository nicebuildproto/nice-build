import { InfoPage, InfoSection } from "@/components/site/InfoPage"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms — Nice Build",
  description: "How to use Nice Tools, and what a result does and does not mean.",
}

export default function TermsPage() {
  return (
    <InfoPage
      current="/terms"
      eyebrow="Terms"
      title="Use the tools. Read the result for what it is."
      lede="Nice Tools is free. These terms describe what you can expect from a page, and what a number on that page is not."
    >
      <InfoSection title="Using the tools">
        <p>You can use the tools for your own work. Don’t use the site to break into a system, or to present a result as something it is not.</p>
        <p>A tool marked coming soon has no page yet. The link in a category is a label, not a working tool.</p>
      </InfoSection>
      <InfoSection title="Results">
        <p>
          A result is the formula on that page, applied to the figures you enter. Tax, health, building, fee, and crypto tools are estimates. They are not advice, a diagnosis, a quote, or a live market price.
        </p>
        <p>Check a result before you rely on it. The site is provided as it is, without a promise that a number is fit for a particular job.</p>
      </InfoSection>
      <InfoSection title="Your material">
        <p>Text and files you bring to a tool stay yours. Nice Tools does not take them, and does not claim a licence over them.</p>
      </InfoSection>
      <InfoSection title="The site">
        <p>Tools, copy, and these terms can change. The date below is when this page was last updated.</p>
        <p>
          Questions can go through the <Link href="/contact" className="underline-offset-4 hover:underline">contact page</Link>. That form does not send yet.
        </p>
        <p>Last updated 4 October 2026.</p>
      </InfoSection>
    </InfoPage>
  )
}