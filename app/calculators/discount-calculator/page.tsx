import { PercentageToolPage, percentageMetadata } from "@/app/calculators/percentage-page"

export const metadata = percentageMetadata("discount")

export default function DiscountCalculatorPage() {
  return <PercentageToolPage mode="discount" />
}
