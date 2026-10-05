import { ContactForm } from "@/components/site/ContactForm"
import { InfoPage, InfoSection } from "@/components/site/InfoPage"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Contact${titleSuffix}`,
  description: "Send a note about a tool, a result that looks off, or something that was hard to follow.",
}

export default function ContactPage() {
  return (
    <InfoPage
      current="/contact"
      eyebrow="Contact"
      title="Send a note."
      lede="A result that looks off, a tool you wish was here, or a step that was hard to follow — tell us what you were trying to do."
    >
      <ContactForm />
      <InfoSection title="What helps">
        <p>Name the tool, the figures you typed, and the result you expected. That’s enough for us to check a calculation.</p>
        <p>The form on this page doesn’t send yet. Your note stays in the browser until you leave.</p>
      </InfoSection>
    </InfoPage>
  )
}
