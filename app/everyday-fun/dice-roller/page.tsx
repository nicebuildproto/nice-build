import { DiceRoller } from "@/components/dice/DiceRoller"
import { SoftwareApplicationJsonLd } from "@/components/seo/SoftwareApplicationJsonLd"
import { PageShell } from "@/components/site/PageShell"
import { ToolGuide } from "@/components/tools/ToolGuide"
import { titleSuffix } from "@/lib/site"
import type { Metadata } from "next"

const title = "Dice Roller"
const description = "Roll a handful of dice — tap one to throw it again, or roll the lot."

export const metadata: Metadata = {
  title: `${title}${titleSuffix}`,
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
