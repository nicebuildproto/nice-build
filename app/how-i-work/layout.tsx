import type { Metadata } from "next"
import { Fraunces } from "next/font/google"
import Link from "next/link"
import { Wordmark } from "@/components/workstyle/Brand"
import { brand, productPath } from "@/lib/workstyle/brand"
import { siteUrl } from "@/lib/site"
import "./workshape.css"

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-ws-display",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: brand.metaTitle, template: `%s — ${brand.name}` },
  description: brand.metaDescription,
  openGraph: { siteName: brand.name, type: "website", title: brand.metaTitle, description: brand.metaDescription },
  twitter: { card: "summary_large_image" },
}

export default function WorkshapeLayout({ children }: LayoutProps<"/how-i-work">) {
  return (
    // data-cs-mask: asks Contentsquare (if it were ever loaded here) to mask all text. The tag is also skipped on these paths.
    <div className={`ws ${display.variable}`} data-cs-mask>
      <a className="ws-skip" href="#main">
        Skip to content
      </a>
      <header className="ws-header">
        <div className="ws-header-inner">
          <Wordmark />
          <nav className="ws-nav" aria-label="Main">
            <Link href={productPath("/about")}>How it works</Link>
            <Link href={productPath("/start")}>Take it</Link>
          </nav>
        </div>
      </header>
      <main id="main" className="ws-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="ws-footer">
        <div className="ws-footer-inner">
          <p>{brand.disclaimer}</p>
          <p>
            Your answers stay in this browser. Nothing is sent anywhere until you choose to share, and then only what you pick.{" "}
            <Link href={productPath("/about#privacy")}>How privacy works</Link>.
          </p>
        </div>
      </footer>
    </div>
  )
}
