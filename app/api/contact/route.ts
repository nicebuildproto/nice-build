export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_FROM = "Nice Tools <onboarding@resend.dev>"
const MIN_FORM_AGE_MS = 2000
const SEND_TIMEOUT_MS = 8000
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

type Field = "name" | "email" | "message"

function json(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } })
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function oneLine(value: string) {
  return value.replace(/[\r\n\u2028\u2029]+/g, " ").trim()
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  const host = request.headers.get("host") ?? new URL(request.url).host
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ ok: false }, 403)

  let data: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ ok: false }, 400)
    data = parsed as Record<string, unknown>
  } catch {
    return json({ ok: false }, 400)
  }

  const name = text(data.name)
  const email = text(data.email)
  const message = text(data.message)
  const company = text(data.company)
  const startedAt = typeof data.startedAt === "number" ? data.startedAt : Number.NaN

  // Bots get the same answer a person would, and nothing is sent.
  if (company || !Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FORM_AGE_MS) {
    return json({ ok: true }, 200)
  }

  const errors: Partial<Record<Field, string>> = {}
  if (name.length < 1 || name.length > 100) errors.name = "Add your name."
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = "Add your email so we can reply."
  if (message.length < 10 || message.length > 5000) errors.message = "Pop a message in first."
  if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 400)

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) {
    console.error("contact: missing env")
    return json({ ok: false }, 500)
  }
  const from = process.env.CONTACT_FROM || DEFAULT_FROM

  const safeName = oneLine(name)
  const body = [
    `Name: ${safeName}`,
    `Email: ${email}`,
    `Sent: ${new Date().toISOString()}`,
    "Page: /contact",
    "",
    message,
  ].join("\n")

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS)
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Nice Tools: note from ${safeName}`,
        text: body,
      }),
      signal: controller.signal,
      cache: "no-store",
    })
    if (!response.ok) {
      console.error("contact: send failed")
      return json({ ok: false }, 502)
    }
    return json({ ok: true }, 200)
  } catch (error) {
    console.error(error instanceof Error && error.name === "AbortError" ? "contact: send timeout" : "contact: send error")
    return json({ ok: false }, 502)
  } finally {
    clearTimeout(timer)
  }
}
