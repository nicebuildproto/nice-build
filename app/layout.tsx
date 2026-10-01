import { niceBuildTheme } from "@/lib/theme"
import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Nice Build",
  description: "A small collection of useful tools.",
}

const themeStyle = {
  "--nb-primary": niceBuildTheme.colors.primary,
  "--nb-secondary": niceBuildTheme.colors.secondary,
  "--nb-accent": niceBuildTheme.colors.accent,
  "--primary": niceBuildTheme.colors.primary,
  "--muted-foreground": niceBuildTheme.colors.secondary,
  "--accent": niceBuildTheme.colors.accent,
} as CSSProperties

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={themeStyle}
    >
      <body className="min-h-full flex flex-col bg-white text-[var(--nb-primary)]">
        {children}
      </body>
    </html>
  )
}
