"use client"

import { Analytics } from "@vercel/analytics/next"
import { stripShareCodes } from "@/lib/workstyle/analytics"

export function SiteAnalytics() {
  return <Analytics beforeSend={stripShareCodes} />
}
