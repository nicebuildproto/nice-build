import { B2BAppHeader } from "@/components/b2b/B2BAppHeader"
import { getB2BTenant } from "@/lib/b2b/tenants"
import Link from "next/link"

const tenant = getB2BTenant("fielders")!

export default function FieldersHelpPage() {
  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col">
      <header className="shrink-0 border-b border-border text-sm">
        <B2BAppHeader
          logo={tenant.logo}
          customerName={tenant.customerName}
          productName={tenant.productName}
          help={tenant.help}
        />
      </header>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--nb-primary)]">Help</h1>
        <p className="text-sm leading-relaxed text-[var(--nb-secondary)]">
          Contact details for this designer will be supplied by Fielders. Use this page as a placeholder until that
          information is confirmed.
        </p>
        <Link
          href="/"
          className="w-fit text-sm font-medium text-[var(--nb-primary)] underline-offset-4 hover:underline"
        >
          Back to designer
        </Link>
      </div>
    </main>
  )
}
