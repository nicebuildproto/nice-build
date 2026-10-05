import { runScan } from "@/lib/crypto/scan"
import { SORTS, TIMEFRAMES, type SortBy, type Timeframe } from "@/lib/crypto/types"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 30

function isTimeframe(value: string): value is Timeframe {
  return (TIMEFRAMES as readonly string[]).includes(value)
}

function isSort(value: string): value is SortBy {
  return (SORTS as readonly string[]).includes(value)
}

function parseBounded(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value === "") return fallback
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  return Math.min(max, Math.max(min, amount))
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const timeframeRaw = params.get("timeframe") ?? "15m"
  const sortRaw = params.get("sortBy") ?? "score"
  if (!isTimeframe(timeframeRaw)) {
    return NextResponse.json({ error: "timeframe must be 5m, 15m, 1h, 4h, or 24h." }, { status: 400 })
  }
  if (!isSort(sortRaw)) {
    return NextResponse.json({ error: "sortBy must be score, volume, or change." }, { status: 400 })
  }
  const minVolume = parseBounded(params.get("minVolume"), 0, 0, 1e12)
  const minChange = parseBounded(params.get("minChange"), 0, -100, 100)
  if (minVolume === null || minChange === null) {
    return NextResponse.json({ error: "minVolume and minChange must be numbers." }, { status: 400 })
  }

  try {
    const result = await runScan({
      timeframe: timeframeRaw,
      minVolume,
      minChange,
      sortBy: sortRaw,
    })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }
    return NextResponse.json(result.data, {
      headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=30" },
    })
  } catch {
    return NextResponse.json({ error: "The scan failed. Try again in a minute." }, { status: 500 })
  }
}
