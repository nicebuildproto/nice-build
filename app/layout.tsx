import { siteName } from "@/lib/site"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Contentsquare } from "./contentsquare"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// viewportFit "cover" lets fixed bars pad themselves with env(safe-area-inset-*);
// "resizes-content" shrinks the layout when the on-screen keyboard opens, so fixed bars stay above it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
}

export const metadata: Metadata = {
  title: siteName,
  description:
    "Calculators, converters, and small utilities. Open a tool, enter your numbers, and copy the result. No account.",
}

const themeBoot = `(function(){try{if(localStorage.getItem("nb-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${geistSans.className} flex min-h-full flex-col`}>
        <Contentsquare />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
