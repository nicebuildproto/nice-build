import type { NextConfig } from "next"
import { registry } from "./lib/registry"

const nextConfig: NextConfig = {
  transpilePackages: ["pdfjs-dist", "tesseract.js", "gifenc"],
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
      {
        source: "/flashing-designer",
        destination: "/category/home-trade",
        permanent: true,
      },
      {
        source: "/home-trade/flashing-designer",
        destination: "/category/home-trade",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
