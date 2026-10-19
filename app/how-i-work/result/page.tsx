import type { Metadata } from "next"
import { ResultView } from "@/components/workstyle/ResultView"

export const metadata: Metadata = {
  title: "Your result",
  robots: { index: false },
}

export default function ResultPage() {
  return <ResultView />
}
