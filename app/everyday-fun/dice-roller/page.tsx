import { DiceRoller } from "@/components/dice/DiceRoller"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { PageShell } from "@/components/site/PageShell"
import { ToolGuide } from "@/components/tools/ToolGuide"
import type { Metadata } from "next"

const title = "Dice Roller"
const description = "Roll a handful of dice."

export const metadata: Metadata = {
  title: `${title} — Nice Build`,
  description,
}

export default function DiceRollerPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={title}
        description={description}
        path="/everyday-fun/dice-roller"
      />
      <PageShell backHref="/category/everyday-fun" width="narrow">
        <DiceRoller />
        <ToolGuide slug="dice-roller" />
      </PageShell>
    </>
  )
}
