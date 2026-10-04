import { ContactForm } from "@/components/site/ContactForm"
import { InfoPage, InfoSection } from "@/components/site/InfoPage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact — Nice Build",
  description: "Send a note about a tool, a wrong result, or something that was unclear.",
}

export default function ContactPage() {
  return (
    <InfoPage
      current="/contact"
      eyebrow="Contact"
      title="Send a note."
      lede="A result that looks wrong, a tool you wish was here, or a step that was hard to follow. Say what you were trying to do."
    >
      <ContactForm />
      <InfoSection title="What helps">
        <p>Name the tool, the figures you typed, and the result you expected. That is enough to check a calculation.</p>
        <p>The form on this page does not send yet. Your note stays in the browser until you leave.</p>
      </InfoSection>
    </InfoPage>
  )
}
