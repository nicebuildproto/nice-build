import { categories, getLiveTools } from "@/lib/registry"
import { siteUrl } from "@/lib/site"
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const home = {
    url: siteUrl,
    lastModified: new Date(),
  }

  const categoryPages = categories.map((category) => ({
    url: `${siteUrl}/category/${category.key}`,
    lastModified: new Date(),
  }))

  const liveTools = getLiveTools().map((tool) => ({
    url: `${siteUrl}${tool.route}`,
    lastModified: new Date(),
  }))

  return [home, ...categoryPages, ...liveTools]
}
