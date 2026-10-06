import { PercentageToolPage, percentageMetadata } from "@/app/calculators/percentage-page"

export const metadata = percentageMetadata("decrease")

export default function PercentageDecreaseCalculatorPage() {
  return <PercentageToolPage mode="decrease" />
}
