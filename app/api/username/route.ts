import { NextResponse } from "next/server"

type Status = "taken" | "available" | "unknown"

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("u")?.replace(/^@/, "").trim() ?? ""
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
    return NextResponse.json({ error: "Use letters, numbers, dots, or underscores." }, { status: 400 })
  }

  const results = await Promise.all([
    probe("instagram", "Instagram", () => checkInstagram(username)),
    probe("tiktok", "TikTok", () => checkTikTok(username)),
    probe("x", "X", () => checkX(username)),
  ])

  return NextResponse.json({ username, results })
}

async function probe(id: string, label: string, check: () => Promise<Status>) {
  try {
    return { id, label, status: await check() }
  } catch {
    return { id, label, status: "unknown" as const }
  }
}

async function checkInstagram(username: string): Promise<Status> {
  const response = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: { "user-agent": "Mozilla/5.0", accept: "text/html" },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  })
  if (response.status === 404) return "available"
  if (!response.ok) return "unknown"
  const text = (await response.text()).slice(0, 80_000)
  if (/page isn.t available|sorry, this page/i.test(text)) return "available"
  if (new RegExp(`"username"\\s*:\\s*"${username}"`, "i").test(text)) return "taken"
  return "unknown"
}

async function checkTikTok(username: string): Promise<Status> {
  const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(`https://www.tiktok.com/@${username}`)}`, {
    headers: { "user-agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  })
  if (response.status === 400 || response.status === 404) return "available"
  if (!response.ok) return "unknown"
  const data = (await response.json()) as { author_name?: string }
  return data.author_name ? "taken" : "unknown"
}

async function checkX(username: string): Promise<Status> {
  const response = await fetch(
    `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(username)}`,
    { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) },
  )
  if (!response.ok) return "unknown"
  const data = (await response.json()) as unknown
  if (!Array.isArray(data)) return "unknown"
  return data.length > 0 ? "taken" : "available"
}
