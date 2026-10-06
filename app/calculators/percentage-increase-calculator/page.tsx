import { PercentageToolPage, percentageMetadata } from "@/app/calculators/percentage-page"

export const metadata = percentageMetadata("increase")

export default function PercentageIncreaseCalculatorPage() {
  return <PercentageToolPage mode="increase" />
}
