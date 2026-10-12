"use client"

import { B2BAppHeader } from "@/components/b2b/B2BAppHeader"
import { FlashingDesigner } from "@/components/flashing/FlashingDesigner"
import type { B2BTenant } from "@/lib/b2b/tenants"
import Image from "next/image"
import Link from "next/link"

export function B2BFlashingApp({ tenant }: { tenant: B2BTenant }) {
  return (
    <FlashingDesigner
      mark={
        <Link
          href="/"
          className="shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={tenant.customerName}
        >
          <Image
            src={tenant.logo.src}
            alt={tenant.logo.alt}
            width={tenant.logo.width}
            height={tenant.logo.height}
            priority
            className="h-7 w-auto max-w-[34vw] object-contain object-left sm:max-w-44"
          />
        </Link>
      }
      // Contact is hidden until it is configured in a future release.
      actions={null}
      chrome={({ startOver }) => (
        <B2BAppHeader
          logo={tenant.logo}
          customerName={tenant.customerName}
          productName={tenant.productName}
          trailing={startOver}
        />
      )}
    />
  )
}
