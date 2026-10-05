import { B2BFlashingApp } from "@/components/b2b/B2BFlashingApp"
import { getB2BTenant } from "@/lib/b2b/tenants"

const tenant = getB2BTenant("fielders")!

export default function FieldersFlashingDesignerPage() {
  return <B2BFlashingApp tenant={tenant} />
}
