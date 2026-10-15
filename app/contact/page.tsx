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
      title="Say hello. Or say “that looks wrong.”"
      lede="A result that looks off, a tool you wish existed, or a step that tripped you up: tell us what you were trying to do and we’ll take it from there."
    >
      <ContactForm />
      <InfoSection title="What helps">
        <p>Name the tool, the figures you typed and the result you expected. That’s usually all we need to check a calculation.</p>
        <p>Suggesting a tool? Tell us the job you’re trying to get done, not just the name of the tool. It helps us work out what to build.</p>
      </InfoSection>
    </InfoPage>
  )
}
