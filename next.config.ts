import type { NextConfig } from "next"
import { registry } from "./lib/registry"

const nextConfig: NextConfig = {
  transpilePackages: ["pdfjs-dist", "tesseract.js", "gifenc"],
  async redirects() {
    return [
      ...registry
        .filter((tool) => tool.slug !== "sankey-generator")
        .map((tool) => ({
          source: `/${tool.slug}`,
          destination: tool.route,
          permanent: true,
        })),
      {
        source: "/sankey-generator",
        destination: "/design-creative/sankey-generator",
        permanent: true,
      },
      {
        source: "/data-viz/sankey-generator",
        destination: "/design-creative/sankey-generator",
        permanent: true,
      },
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
