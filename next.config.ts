import type { NextConfig } from "next"
import { registry } from "./lib/registry"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...registry.map((tool) => ({
        source: `/${tool.slug}`,
        destination: `/${tool.category}/${tool.slug}`,
        permanent: true,
      })),
      {
        source: "/sankey",
        destination: "/design-creative/sankey-generator",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
