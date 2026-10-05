export type HeaderField = { name: string; value: string }

export type ReceivedHop = { raw: string; from?: string; by?: string; with?: string; date?: string }

export type AuthSignals = {
  spf?: string
  dkim?: string
  dmarc?: string
  receivedSpf?: string
  authenticationResults: string[]
}

export type ParsedHeaders = {
  fields: HeaderField[]
  from?: string
  to?: string
  cc?: string
  bcc?: string
  subject?: string
  date?: string
  messageId?: string
  returnPath?: string
  replyTo?: string
  received: ReceivedHop[]
  auth: AuthSignals
}

export function parseEmailHeaders(raw: string): ParsedHeaders | { error: string } {
  const trimmed = raw.replace(/^\uFEFF/, "").trim()
  if (!trimmed) return { error: "Paste the raw headers from the message source." }
  const unfolded = unfold(trimmed)
  if (!unfolded.some((line) => line.includes(":"))) {
    return { error: "Those lines don’t look like email headers. Each field should look like Name: value." }
  }

  const fields: HeaderField[] = []
  for (const line of unfolded) {
    const index = line.indexOf(":")
    if (index <= 0) continue
    fields.push({ name: line.slice(0, index).trim(), value: line.slice(index + 1).trim() })
  }
  if (!fields.length) return { error: "No header fields were found." }

  const pick = (name: string) => fields.find((field) => field.name.toLowerCase() === name.toLowerCase())?.value
  const all = (name: string) => fields.filter((field) => field.name.toLowerCase() === name.toLowerCase()).map((field) => field.value)
  const authenticationResults = all("Authentication-Results")
  const auth: AuthSignals = {
    authenticationResults,
    receivedSpf: pick("Received-SPF"),
    spf: findAuthToken(authenticationResults, "spf"),
    dkim: findAuthToken(authenticationResults, "dkim"),
    dmarc: findAuthToken(authenticationResults, "dmarc"),
  }

  return {
    fields,
    from: pick("From"),
    to: pick("To"),
    cc: pick("Cc"),
    bcc: pick("Bcc"),
    subject: pick("Subject"),
    date: pick("Date"),
    messageId: pick("Message-ID"),
    returnPath: pick("Return-Path"),
    replyTo: pick("Reply-To"),
    received: all("Received").map(parseReceived),
    auth,
  }
}

function unfold(raw: string) {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
  const out: string[] = []
  for (const line of lines) {
    if (/^[ \t]/.test(line) && out.length) out[out.length - 1] += ` ${line.trim()}`
    else if (line.trim() !== "") out.push(line)
  }
  return out
}

function parseReceived(raw: string): ReceivedHop {
  const from = raw.match(/\bfrom\s+([^\s;]+)/i)?.[1]
  const by = raw.match(/\bby\s+([^\s;]+)/i)?.[1]
  const withProto = raw.match(/\bwith\s+([^\s;]+)/i)?.[1]
  const date = raw.includes(";") ? raw.slice(raw.lastIndexOf(";") + 1).trim() : undefined
  return { raw, from, by, with: withProto, date }
}

function findAuthToken(results: string[], key: string) {
  const pattern = new RegExp(`\\b${key}\\s*=\\s*([a-z0-9-]+)`, "i")
  for (const result of results) {
    const match = result.match(pattern)
    if (match) return match[1].toLowerCase()
  }
  return undefined
}
