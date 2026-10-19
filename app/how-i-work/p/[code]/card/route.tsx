import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { brand } from "@/lib/workstyle/brand"
import { patternLinks } from "@/lib/workstyle/export/model"
import { buildProfile } from "@/lib/workstyle/profile"
import { cardSizes, decodeShare, type CardFormat } from "@/lib/workstyle/share"
import { inVoice } from "@/lib/workstyle/voice"
import { buildSignature, signatureSvg } from "@/lib/workstyle/signature"

// The share card is drawn on request from the share code alone — the same data the public page uses.
// It contains the headline, the signature and an optional name; never answers.

const INK = "#15130F"
const PAPER = "#F4EFE6"
const MUTED = "#B9B1A2"

// Fraunces (SIL Open Font License, see _fonts/OFL-Fraunces.txt). Two small Latin subsets keep the bundle well under ImageResponse's 500KB limit.
// Read from disk on first use (not fetched at import time) and included in the route's file trace in next.config.ts.
const fontDirectory = path.join(process.cwd(), "app", "how-i-work", "_fonts")
let fonts: Promise<[Buffer, Buffer]> | null = null
const loadFonts = () => (fonts ??= Promise.all([readFile(path.join(fontDirectory, "fraunces-latin-600-normal.woff")), readFile(path.join(fontDirectory, "fraunces-latin-400-italic.woff"))]))
const toArrayBuffer = (buffer: Buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer

const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
// The bundled font only covers Latin. Names in other scripts stay on the web page but are left off the card rather than drawn as empty boxes.
const drawable = (text: string) => !/[^\u0000-\u024F\u2000-\u206F]/.test(text)

function titleSize(title: string, base: number) {
  if (title.length <= 22) return base
  if (title.length <= 34) return Math.round(base * 0.8)
  return Math.round(base * 0.64)
}

export async function GET(request: Request, context: RouteContext<"/how-i-work/p/[code]/card">) {
  const { code } = await context.params
  const decoded = decodeShare(code)
  if (!decoded.ok) return new Response("This card link isn’t valid.", { status: 404 })

  const url = new URL(request.url)
  const requested = url.searchParams.get("format")
  const format: CardFormat = requested === "square" || requested === "story" ? requested : "og"
  const { width, height } = cardSizes[format]
  const profile = buildProfile(decoded.summary)
  const name = decoded.summary.name && drawable(decoded.summary.name) ? decoded.summary.name : undefined
  const host = url.host

  const wide = format === "og"
  const artSize = wide ? 500 : format === "square" ? 560 : 700
  const signature = dataUri(signatureSvg(buildSignature(profile.summary.dimensions, patternLinks(profile)), { theme: "dark", size: artSize }))
  const title = profile.headline.title
  // On the card the person is speaking for themselves.
  const statement = inVoice(profile.headline.statement, "first")
  const pad = wide ? 64 : 72

  const wordmark = (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: "Fraunces", fontSize: wide ? 36 : 40, color: PAPER }}>
      <span style={{ fontWeight: 600 }}>{brand.wordmark.lead}</span>
      <span style={{ fontStyle: "italic", fontWeight: 400 }}>{brand.wordmark.tail}</span>
    </div>
  )
  const footer = (
    <div style={{ display: "flex", flexDirection: "column", color: MUTED, fontFamily: "Fraunces", fontSize: wide ? 26 : 30 }}>
      {name ? <span style={{ color: PAPER, fontStyle: "italic", marginBottom: 6 }}>{name}</span> : null}
      <span>
        {brand.cardInvite} {host}
        {brand.basePath}
      </span>
    </div>
  )
  const text = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: titleSize(title, wide ? 84 : 76), lineHeight: 1.04, color: PAPER, letterSpacing: -2 }}>{title}</div>
      <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontSize: wide ? 32 : 36, lineHeight: 1.3, color: MUTED, marginTop: 24, maxWidth: wide ? 560 : 880 }}>{statement}</div>
    </div>
  )

  const element = wide ? (
    <div style={{ width, height, display: "flex", background: INK, padding: pad, justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
        {wordmark}
        {text}
        {footer}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 520 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={signature} width={artSize} height={artSize} alt="" />
      </div>
    </div>
  ) : (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: INK, padding: pad, justifyContent: "space-between" }}>
      {wordmark}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={signature} width={artSize} height={artSize} alt="" />
      </div>
      {text}
      {footer}
    </div>
  )

  const [bold, italic] = await loadFonts()
  return new ImageResponse(element, {
    width,
    height,
    fonts: [
      { name: "Fraunces", data: toArrayBuffer(bold), weight: 600, style: "normal" },
      { name: "Fraunces", data: toArrayBuffer(italic), weight: 400, style: "italic" },
    ],
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  })
}
