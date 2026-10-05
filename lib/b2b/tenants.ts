export type B2BLogo = {
  src: string
  alt: string
  width: number
  height: number
}

export type B2BTenant = {
  id: string
  customerName: string
  productName: string
  hosts: string[]
  logo: B2BLogo
}

export const b2bTenants: B2BTenant[] = [
  {
    id: "fielders",
    customerName: "Fielders",
    productName: "Flashing Designer",
    hosts: ["fielders.nicetools.co", "fielders.localhost"],
    logo: {
      src: "/b2b/fielders/logo.png",
      alt: "Fielders",
      width: 1023,
      height: 283,
    },
  },
]

export function matchB2BHost(hostHeader: string | null): B2BTenant | null {
  if (!hostHeader) return null
  const host = hostHeader.split(":")[0]?.toLowerCase()
  if (!host) return null
  return b2bTenants.find((tenant) => tenant.hosts.includes(host)) ?? null
}

export function getB2BTenant(id: string): B2BTenant | null {
  return b2bTenants.find((tenant) => tenant.id === id) ?? null
}
