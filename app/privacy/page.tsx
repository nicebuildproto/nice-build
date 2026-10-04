import { InfoPage, InfoSection } from "@/components/site/InfoPage"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy — Nice Build",
  description: "What Nice Tools stores, and what stays in your browser.",
}

export default function PrivacyPage() {
  return (
    <InfoPage
      current="/privacy"
      eyebrow="Privacy"
      title="What stays on your device."
      lede="Nice Tools is built to do the work in your browser. This page says what leaves that browser, and what does not."
    >
      <InfoSection title="Tools and files">
        <p>
          Figures you type into a calculator stay in the page. Image tools read a file locally, redraw it, and offer a download. Those files are not uploaded.
        </p>
        <p>Closing the tab clears the figures, unless your own browser has kept the page.</p>
      </InfoSection>
      <InfoSection title="On this device">
        <p>
          Light or dark mode is saved in local storage, under the name nb-theme. Tools you pin in the workspace are saved the same way, on this device. Clearing site data in the browser removes both.
        </p>
      </InfoSection>
      <InfoSection title="Visits">
        <p>
          The production site uses Vercel Web Analytics and Speed Insights. A page view and a performance measurement can be recorded when you visit the live site. Local development does not record those visits.
        </p>
        <p>There is no account attached to a visit. Log in on this site is a preview. It does not create an account or store a password.</p>
      </InfoSection>
      <InfoSection title="Contact">
        <p>
          The note on the <Link href="/contact" className="underline-offset-4 hover:underline">contact page</Link> is not sent or stored. It remains in the browser until you leave the page.
        </p>
      </InfoSection>
      <InfoSection title="Changes">
        <p>This page was last updated on 4 October 2026. If the way visits are recorded changes, this page will change with it.</p>
      </InfoSection>
    </InfoPage>
  )
}
