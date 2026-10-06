import { PercentageToolPage, percentageMetadata } from "@/app/calculators/percentage-page"

export const metadata = percentageMetadata("basic")

export default function PercentageCalculatorPage() {
  return <PercentageToolPage mode="basic" />
}
