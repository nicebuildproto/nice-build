"use client"

import { B2BAppHeader } from "@/components/b2b/B2BAppHeader"
import { B2BContactButton } from "@/components/b2b/B2BContactButton"
import { FieldersIntroNotice } from "@/components/b2b/FieldersIntroNotice"
import { FlashingDesigner } from "@/components/flashing/FlashingDesigner"
import type { B2BTenant } from "@/lib/b2b/tenants"

export function B2BFlashingApp({ tenant }: { tenant: B2BTenant }) {
  return (
    <FlashingDesigner
      introNotice={tenant.id === "fielders" ? <FieldersIntroNotice /> : null}
      chrome={({ startOver }) => (
        <B2BAppHeader
          logo={tenant.logo}
          customerName={tenant.customerName}
          productName={tenant.productName}
          trailing={startOver}
          actions={<B2BContactButton />}
        />
      )}
    />
  )
}
