import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Flashing Designer · Fielders",
  description: "Configure a flashing profile, finish and dimensions, then review your design before ordering.",
  robots: { index: false, follow: false },
}

export default function FieldersLayout({ children }: { children: ReactNode }) {
  return children
}
