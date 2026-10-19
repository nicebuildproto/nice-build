import type { Metadata } from "next"
import { Assessment } from "@/components/workstyle/Assessment"

export const metadata: Metadata = {
  title: "The assessment",
  robots: { index: false },
}

export default function StartPage() {
  return <Assessment />
}
