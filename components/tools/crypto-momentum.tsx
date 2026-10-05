"use client"

import { ErrorNote, Field, selectClass, ToolNote } from "@/components/tools/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ScanFlag, ScanResponse, ScanRow, SortBy, Timeframe } from "@/lib/crypto/types"
import { SORTS, TIMEFRAMES } from "@/lib/crypto/types"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const VOLUME_OPTIONS = [
  { value: "0", label: "Any 24h volume" },
  { value: "500000", label: "≥ $500k" },
  { value: "1000000", label: "≥ $1M" },
  { value: "5000000", label: "≥ $5M" },
  { value: "10000000", label: "≥ $10M" },
  { value: "25000000", label: "≥ $25M" },
] as const

const SORT_LABEL: Record<SortBy, string> = {
  score: "Score",
  volume: "24h volume",
  change: "Window change",
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "—"
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (value >= 1) return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 })
}

function formatVolume(value: number) {
  if (!Number.isFinite(value)) return "—"
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${value.toFixed(0)}`
}

function formatChange(value: number) {
  const text = `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
  return text
}

function formatUpdated(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function flagVariant(flag: ScanFlag): "secondary" | "outline" | "destructive" {
  if (flag === "Extended") return "destructive"
  if (flag === "Low liquidity") return "outline"
  return "secondary"
}

export function CryptoMomentumScanner() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m")
  const [minVolume, setMinVolume] = useState("1000000")
  const [sortBy, setSortBy] = useState<SortBy>("score")
  const [auto, setAuto] = useState(true)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ScanResponse | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function run() {
      try {
        const params = new URLSearchParams({
          timeframe,
          minVolume,
          sortBy,
          minChange: "0",
        })
        const response = await fetch(`/api/crypto-scan?${params.toString()}`, { signal: controller.signal })
        const body = (await response.json()) as ScanResponse & { error?: string }
        if (controller.signal.aborted) return
        if (!response.ok) {
          setData(null)
          setError(body.error ?? "The scan failed.")
        } else {
          setData(body)
          setError(null)
        }
      } catch (cause) {
        if (controller.signal.aborted) return
        const aborted = cause instanceof DOMException && cause.name === "AbortError"
        if (aborted) return
        setData(null)
        setError("Couldn't reach the scanner. Check the connection and try again.")
      } finally {
        if (!controller.signal.aborted) setPending(false)
      }
    }
    void run()
    return () => controller.abort()
  }, [timeframe, minVolume, sortBy, refresh])

  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return
      setRefresh((value) => value + 1)
    }, 60_000)
    const onVis = () => {
      if (document.visibilityState === "visible") setRefresh((value) => value + 1)
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [auto])

  const rows = data?.results ?? []

  return (
    <div className="flex flex-col gap-8">
      <ToolNote>
        Ranks USDT pairs by a short-window momentum score: volume versus the last 20 candles, the move on the last closed candle, and whether price is breaking that window&apos;s high. CoinGecko trending is a multiplier, not a trigger.
      </ToolNote>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <fieldset className="flex min-w-0 flex-1 flex-col gap-2">
            <legend className="text-[13px] text-[var(--nb-primary)]">Timeframe</legend>
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-[3px]">
              {TIMEFRAMES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setTimeframe(item)
                    setPending(true)
                  }}
                  className={cn(
                    "h-8 rounded-md px-2.5 text-sm transition-colors",
                    item === timeframe
                      ? "bg-background text-[var(--nb-primary)] shadow-sm"
                      : "text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Min 24h volume" className="w-40">
            <select
              className={selectClass}
              value={minVolume}
              onChange={(event) => {
                setMinVolume(event.target.value)
                setPending(true)
              }}
            >
              {VOLUME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort" className="w-40">
            <select
              className={selectClass}
              value={sortBy}
              onChange={(event) => {
                const value = event.target.value
                if (value === "score" || value === "volume" || value === "change") {
                  setSortBy(value)
                  setPending(true)
                }
              }}
            >
              {SORTS.map((item) => (
                <option key={item} value={item}>
                  {SORT_LABEL[item]}
                </option>
              ))}
            </select>
          </Field>
          <Button
            type="button"
            className="h-10"
            disabled={pending}
            onClick={() => {
              setPending(true)
              setRefresh((value) => value + 1)
            }}
          >
            {pending ? "Scanning" : "Refresh"}
          </Button>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[var(--nb-secondary)]">
          <Switch checked={auto} onCheckedChange={(checked) => setAuto(checked)} size="sm" />
          Auto-refresh every 60s
        </label>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          Momentum signals only, not financial advice. Crypto is volatile and short-term moves can reverse quickly.
        </p>
        <p className="text-[12px] text-[var(--nb-secondary)]">
          Last updated {data ? formatUpdated(data.updatedAt) : "—"}
          {data?.source === "coingecko" ? " · CoinGecko fallback" : data ? " · Binance" : ""}
        </p>
      </div>

      {data?.notice ? <p className="rounded-xl border border-border px-3 py-2 text-[13px] text-[var(--nb-secondary)]">{data.notice}</p> : null}
      {error ? (
        <div className="flex flex-col gap-3">
          <ErrorNote>{error}</ErrorNote>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-fit"
            onClick={() => {
              setPending(true)
              setRefresh((value) => value + 1)
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {pending && !data ? <ScanSkeleton /> : null}

      {!pending && !error && rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-[var(--nb-secondary)]">
          Nothing cleared the filters on this timeframe. Drop the minimum volume or pick a longer window.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="hidden md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Coin</th>
                  <th className="py-2 pr-3 font-medium">Price</th>
                  <th className="py-2 pr-3 font-medium">{timeframe}</th>
                  <th className="py-2 pr-3 font-medium">Vol</th>
                  <th className="min-w-28 py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 pr-3 font-medium">Flags</th>
                  <th className="py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <ScanTableRow
                    key={row.symbol}
                    row={row}
                    open={open === row.symbol}
                    onToggle={() => setOpen((current) => (current === row.symbol ? null : row.symbol))}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.symbol}>
                <ScanCard
                  row={row}
                  timeframe={timeframe}
                  open={open === row.symbol}
                  onToggle={() => setOpen((current) => (current === row.symbol ? null : row.symbol))}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <details className="rounded-xl border border-border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[var(--nb-primary)]">How the score works</summary>
        <div className="mt-3 flex flex-col gap-2 text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          <p>Each coin uses the last closed candle against the previous 20 on the timeframe you pick.</p>
          <p>Volume score is how far the last candle&apos;s quote volume sits above that 20-candle average (8× averages maps to 100). Price score is the candle&apos;s percent change, capped at +8%. Breakout is 100 if the close is above the prior 20 highs, otherwise 0.</p>
          <p>Those three mix as 50% volume, 30% price, 20% breakout. CoinGecko trending (and Reddit mentions, if enabled) then lift that base by up to 25%. A coin that is not moving stays near zero even if it is trending.</p>
          <p>Badges are not part of the score. Extended means the window move is over 15%. Low liquidity means 24h USDT volume is under $1M.</p>
        </div>
      </details>

      <section className="flex max-w-2xl flex-col gap-3" aria-labelledby="momentum-what">
        <h2 id="momentum-what" className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          What a momentum scanner is
        </h2>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          A crypto momentum scanner, or breakout screener, ranks coins that are trading unusual volume and pushing through a recent high. It is a watchlist, not a prediction. Use it to see what is moving on 5 minutes, 15 minutes, 1 hour, 4 hours, or the daily candle, then check the book and the chart yourself.
        </p>
      </section>
      <section className="flex max-w-2xl flex-col gap-3" aria-labelledby="momentum-use">
        <h2 id="momentum-use" className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          How to use it
        </h2>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          Pick a timeframe, set a 24h volume floor so thin pairs drop out, and sort by score, volume, or the window change. Open a row for the three score legs. Auto-refresh keeps the table inside a minute while this tab is visible. Pair it with the profit, position-size, and liquidation calculators in Crypto if you then size a trade — those pages still use numbers you type, not this feed.
        </p>
      </section>
      <section className="flex max-w-2xl flex-col gap-3" aria-labelledby="momentum-score">
        <h2 id="momentum-score" className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          How the score is calculated
        </h2>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">
          Volume, price, and breakout are normalised to 0–100, then mixed 50/30/20. An 8× volume spike or an +8% candle maps to 100 on that leg. CoinGecko trending multiplies the mixed base by up to 1.25. Social attention never creates a high score on a quiet coin. Flags such as Extended and Low liquidity sit beside the rank; they are not inputs to the number.
        </p>
      </section>
    </div>
  )
}

function ScanSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-[var(--nb-accent)]" />
      ))}
    </div>
  )
}

function FlagList({ flags }: { flags: ScanFlag[] }) {
  if (flags.length === 0) return <span className="text-[var(--nb-secondary)]">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <Badge key={flag} variant={flagVariant(flag)}>
          {flag}
        </Badge>
      ))}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--nb-accent)]">
        <span className="block h-full rounded-full bg-[var(--nb-primary)]" style={{ width: `${Math.max(2, score)}%` }} />
      </span>
      <span className="tabular-nums">{score.toFixed(0)}</span>
    </span>
  )
}

function Detail({ row }: { row: ScanRow }) {
  return (
    <dl className="grid gap-2 text-[13px] text-[var(--nb-secondary)] sm:grid-cols-3">
      <div>
        <dt>Volume leg</dt>
        <dd className="text-[var(--nb-primary)] tabular-nums">{row.volScore.toFixed(0)}</dd>
      </div>
      <div>
        <dt>Price leg</dt>
        <dd className="text-[var(--nb-primary)] tabular-nums">{row.priceScore.toFixed(0)}</dd>
      </div>
      <div>
        <dt>Breakout leg</dt>
        <dd className="text-[var(--nb-primary)] tabular-nums">{row.breakoutScore.toFixed(0)}</dd>
      </div>
      <div>
        <dt>Attention</dt>
        <dd className="text-[var(--nb-primary)] tabular-nums">{(row.social * 100).toFixed(0)}%</dd>
      </div>
      <div>
        <dt>24h quote volume</dt>
        <dd className="text-[var(--nb-primary)] tabular-nums">{formatVolume(row.quoteVolume24h)}</dd>
      </div>
      <div>
        <dt>Pair</dt>
        <dd className="text-[var(--nb-primary)]">{row.symbol}</dd>
      </div>
    </dl>
  )
}

function ScanTableRow({
  row,
  open,
  onToggle,
}: {
  row: ScanRow
  open: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr className="cursor-pointer border-b border-border hover:bg-[var(--nb-accent)]/60" onClick={onToggle}>
        <td className="py-3 pr-3 tabular-nums text-[var(--nb-secondary)]">{row.rank}</td>
        <td className="py-3 pr-3">
          <span className="font-medium text-[var(--nb-primary)]">{row.base}</span>
          {row.name ? <span className="ml-2 text-[var(--nb-secondary)]">{row.name}</span> : null}
        </td>
        <td className="py-3 pr-3 tabular-nums">{formatPrice(row.price)}</td>
        <td className={cn("py-3 pr-3 tabular-nums", row.priceChangePct >= 0 ? "text-[var(--nb-primary)]" : "text-[var(--nb-secondary)]")}>
          {formatChange(row.priceChangePct)}
        </td>
        <td className="py-3 pr-3 tabular-nums">{row.volRatio.toFixed(1)}x</td>
        <td className="py-3 pr-3">
          <ScoreBar score={row.score} />
        </td>
        <td className="py-3 pr-3">
          <FlagList flags={row.flags} />
        </td>
        <td className="max-w-xs py-3 text-[13px] text-[var(--nb-secondary)]">{row.reason}</td>
      </tr>
      {open ? (
        <tr className="border-b border-border bg-[var(--nb-accent)]/40">
          <td colSpan={8} className="px-3 py-4">
            <Detail row={row} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

function ScanCard({
  row,
  timeframe,
  open,
  onToggle,
}: {
  row: ScanRow
  timeframe: Timeframe
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full flex-col gap-2 rounded-xl border border-border p-4 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-[var(--nb-secondary)] tabular-nums">#{row.rank}</p>
          <p className="text-base font-medium text-[var(--nb-primary)]">{row.base}</p>
          {row.name ? <p className="text-[13px] text-[var(--nb-secondary)]">{row.name}</p> : null}
        </div>
        <ScoreBar score={row.score} />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-[13px]">
        <div>
          <dt className="text-[var(--nb-secondary)]">Price</dt>
          <dd className="tabular-nums">{formatPrice(row.price)}</dd>
        </div>
        <div>
          <dt className="text-[var(--nb-secondary)]">{timeframe}</dt>
          <dd className="tabular-nums">{formatChange(row.priceChangePct)}</dd>
        </div>
        <div>
          <dt className="text-[var(--nb-secondary)]">Volume ratio</dt>
          <dd className="tabular-nums">{row.volRatio.toFixed(1)}x</dd>
        </div>
        <div>
          <dt className="text-[var(--nb-secondary)]">24h volume</dt>
          <dd className="tabular-nums">{formatVolume(row.quoteVolume24h)}</dd>
        </div>
      </dl>
      <FlagList flags={row.flags} />
      <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">{row.reason}</p>
      {open ? <Detail row={row} /> : null}
    </button>
  )
}
