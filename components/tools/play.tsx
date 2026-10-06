"use client"

import { TextArea } from "@/components/tools/ui"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import QRCode from "qrcode"
import { useEffect, useState } from "react"

export function QrCodeGenerator() {
  const [text, setText] = useState("https://nice-build-ten.vercel.app")
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    QRCode.toDataURL(text || " ", { margin: 1, width: 280, color: { dark: "#111111", light: "#ffffff" } })
      .then((next) => {
        if (!cancel) {
          setUrl(next)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancel) setError("That text is too long for a QR code.")
      })
    return () => {
      cancel = true
    }
  }, [text])

  return (
    <div className="flex flex-col gap-6">
      <TextArea label="Text or URL" value={text} onChange={setText} rows={3} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {url ? (
        <div className="flex flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-56 rounded-xl border border-border" />
          <a href={url} download="qr-code.png" className={cn(buttonVariants(), "w-fit")}>
            Download
          </a>
        </div>
      ) : null}
    </div>
  )
}

export { MarkdownPreview } from "@/components/text/views"
export { CookingTimer, StopwatchTool, WheelSpinner, WorldClock } from "@/components/everyday/views"
export {
  CpsTest,
  DeadZoneTester,
  GamepadTester,
  KeyboardTester,
  MouseTester,
  ReactionTimeTest,
  RefreshRateTester,
  ScreenPpiCalculator,
} from "@/components/gaming/views"

export function BitcoinHalvingCountdown() {
  const target = Date.UTC(2028, 3, 20)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  const left = now === null ? null : Math.max(0, target - now)
  const days = left === null ? "—" : String(Math.floor(left / 86400000))
  return (
    <div className="flex flex-col gap-4">
      <p className="text-5xl font-semibold tabular-nums">{days}<span className="ml-2 text-lg font-medium text-[var(--nb-secondary)]">days</span></p>
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Estimated for 20 April 2028, from the April 2024 halving and a 10 minute block. The network moves the real date.
      </p>
    </div>
  )
}
