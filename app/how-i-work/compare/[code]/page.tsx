import type { Metadata } from "next"
import Link from "next/link"
import { CompareView } from "@/components/workstyle/CompareView"
import { productPath } from "@/lib/workstyle/brand"
import { decodeShare } from "@/lib/workstyle/share"

export const metadata: Metadata = {
  title: "Compare",
  robots: { index: false, follow: false },
}

export default async function ComparePage({ params }: PageProps<"/how-i-work/compare/[code]">) {
  const { code } = await params
  const decoded = decodeShare(code)
  if (!decoded.ok) {
    return (
      <div className="ws-narrow" style={{ padding: "4rem 1.25rem" }}>
        <div className="ws-stack">
          <p className="ws-eyebrow">Link not recognised</p>
          <h1 className="ws-h2">This comparison link looks incomplete or has been changed.</h1>
          <div className="ws-cta-row">
            <Link className="ws-btn ws-btn--primary" href={productPath("/start")}>
              Take the assessment
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return <CompareView code={code} summary={decoded.summary} />
}
