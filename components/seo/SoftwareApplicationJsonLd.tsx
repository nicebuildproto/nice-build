import { siteUrl } from "@/lib/site"

export function SoftwareApplicationJsonLd({
  name,
  description,
  path,
  webApplication = false,
}: {
  name: string
  description: string
  path: string
  webApplication?: boolean
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": webApplication ? ["SoftwareApplication", "WebApplication"] : "SoftwareApplication",
    name,
    description,
    url: `${siteUrl}${path}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AUD",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
