"use client"

import { CopyButton, FileDrop, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

const selectClass =
  "h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export { BracketGenerator } from "@/components/gaming/views"

export function ThreadFormatter() {
  const [platform, setPlatform] = useState<"x" | "threads">("x")
  const [text, setText] = useState("A longer note that should break into numbered posts so each one stays inside the platform limit, with the count included.")
  const limit = platform === "x" ? 280 : 500
  const chunks = useMemo(() => splitThread(text, limit), [limit, text])
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Paste a long note and split it into posts. X uses 280 characters and Threads uses 500. Each card is numbered 1/N, and that prefix counts toward the limit. Copy a card when you are ready to paste it.
      </p>
      <label className="flex max-w-xs flex-col gap-2 text-[13px]">
        Platform
        <select className={selectClass} value={platform} onChange={(event) => setPlatform(event.target.value as "x" | "threads")}>
          <option value="x">X, 280</option>
          <option value="threads">Threads, 500</option>
        </select>
      </label>
      <TextArea label="Text" value={text} onChange={setText} rows={8} />
      <div className="flex flex-col gap-3">
        {chunks.map((chunk) => (
          <article key={chunk} className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{chunk}</p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--nb-secondary)] tabular-nums">{chunk.length} characters</span>
              <CopyButton text={chunk} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function splitThread(text: string, limit: number) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  let total = 1
  let chunks = pack(words, limit, total)
  let guard = 0
  while (chunks.length !== total && guard < 20) {
    total = chunks.length
    chunks = pack(words, limit, total)
    guard += 1
  }
  return chunks.map((body, index) => `${index + 1}/${chunks.length} ${body}`)
}

function pack(words: string[], limit: number, total: number) {
  const chunks: string[] = []
  let current: string[] = []
  const prefix = (index: number) => `${index}/${total} `.length
  let index = 1
  for (const word of words) {
    const next = [...current, word].join(" ")
    if (prefix(index) + next.length > limit && current.length) {
      chunks.push(current.join(" "))
      current = [word]
      index += 1
    } else current.push(word)
  }
  if (current.length) chunks.push(current.join(" "))
  return chunks
}

export function ThumbnailPreview() {
  const [title, setTitle] = useState("Saturday build log")
  const [channel, setChannel] = useState("Nice Tools")
  const [views, setViews] = useState("12K")
  const [left, setLeft] = useState<string | null>(null)
  const [right, setRight] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (left) URL.revokeObjectURL(left)
      if (right) URL.revokeObjectURL(right)
    }
  }, [left, right])

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Upload two images and see them side by side in a plain video-feed mock. The title, channel, and view count are placeholders you can edit. Nothing is uploaded.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-[13px]">
          Title
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Channel
          <Input value={channel} onChange={(event) => setChannel(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Views
          <Input value={views} onChange={(event) => setViews(event.target.value)} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FileDrop accept="image/*" idle="Thumbnail A" onFile={(file) => setLeft((current) => replaceUrl(current, file))} />
        <FileDrop accept="image/*" idle="Thumbnail B" onFile={(file) => setRight((current) => replaceUrl(current, file))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FeedCard src={left} title={title} channel={channel} views={views} label="A" />
        <FeedCard src={right} title={title} channel={channel} views={views} label="B" />
      </div>
    </div>
  )
}

function replaceUrl(current: string | null, file: File) {
  if (current) URL.revokeObjectURL(current)
  return URL.createObjectURL(file)
}

function FeedCard({ src, title, channel, views, label }: { src: string | null; title: string; channel: string; views: string; label: string }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border">
      <div className="grid aspect-video place-items-center bg-[var(--nb-accent)] text-sm text-[var(--nb-secondary)]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Thumbnail ${label}`} className="h-full w-full object-cover" />
        ) : (
          `Thumbnail ${label}`
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h2 className="text-sm font-medium text-[var(--nb-primary)]">{title || "Video title"}</h2>
        <p className="text-xs text-[var(--nb-secondary)]">
          {channel || "Channel"} · {views || "0"} views
        </p>
      </div>
    </article>
  )
}

type CheckStatus = "taken" | "available" | "unknown"

export function UsernameChecker() {
  const [name, setName] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{ id: string; label: string; status: CheckStatus }[] | null>(null)

  async function check() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/username?u=${encodeURIComponent(name.trim())}`)
      const data = (await response.json()) as { error?: string; results?: { id: string; label: string; status: CheckStatus }[] }
      if (!response.ok) {
        setResults(null)
        setError(data.error ?? "Couldn't check")
      } else setResults(data.results ?? [])
    } catch {
      setResults(null)
      setError("Couldn't check")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Check a username against Instagram, TikTok, and X from this site’s server, because those sites block a browser directly. A result can be taken, free, or couldn’t check when the platform refuses the lookup. It is a signal, not a reservation.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-2 text-[13px]">
          Username
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="nicebuild" />
        </label>
        <Button type="button" className="h-10" disabled={pending} onClick={() => void check()}>
          {pending ? "Checking" : "Check"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--nb-secondary)]">{error}</p> : null}
      {results ? (
        <ul className="flex flex-col gap-2 text-sm">
          {results.map((row) => (
            <li key={row.id} className="flex justify-between gap-4 border-b border-border py-2">
              <span>{row.label}</span>
              <span className="text-[var(--nb-secondary)]">{row.status === "unknown" ? "Couldn't check" : row.status === "taken" ? "Taken" : "Looks free"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function BioLinkBuilder() {
  const [title, setTitle] = useState("Nice Tools")
  const [links, setLinks] = useState([
    { id: uid(), label: "Site", href: "https://example.com" },
    { id: uid(), label: "Newsletter", href: "https://example.com/news" },
  ])
  const html = bioHtml(title, links)
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Add a title and a few links. The preview updates as you type. This version does not host a public URL. Copy the HTML or download it and open the file, or put it on a host you already have.
      </p>
      <label className="flex flex-col gap-2 text-[13px]">
        Title
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      {links.map((link) => (
        <div key={link.id} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
          <Input value={link.label} placeholder="Label" onChange={(event) => setLinks((current) => current.map((item) => (item.id === link.id ? { ...item, label: event.target.value } : item)))} />
          <Input value={link.href} placeholder="https://" onChange={(event) => setLinks((current) => current.map((item) => (item.id === link.id ? { ...item, href: event.target.value } : item)))} />
          <Button type="button" variant="outline" className="h-10" onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))}>
            Remove
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-10" onClick={() => setLinks((current) => [...current, { id: uid(), label: "", href: "" }])}>
          Add link
        </Button>
        <CopyButton text={html} label="Copy HTML" />
        <Button type="button" variant="outline" className="h-10" onClick={() => downloadHtml(html)}>
          Download HTML
        </Button>
      </div>
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-[var(--nb-accent)] p-6">
        <h2 className="text-center text-xl font-semibold">{title || "Links"}</h2>
        <div className="mt-4 flex flex-col gap-2">
          {links.filter((link) => link.label.trim()).map((link) => (
            <a key={link.id} href={link.href || "#"} className="rounded-xl border border-border bg-background px-3 py-3 text-center text-sm">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function bioHtml(title: string, links: { label: string; href: string }[]) {
  const items = links
    .filter((link) => link.label.trim())
    .map((link) => `<a href="${escapeAttr(link.href)}">${escapeText(link.label)}</a>`)
    .join("\n")
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>${escapeText(title || "Links")}</title>
<style>
  body { font-family: sans-serif; background: #f4f4f4; display: grid; place-items: center; min-height: 100vh; margin: 0; }
  main { width: min(24rem, calc(100% - 2rem)); background: #fff; border-radius: 16px; padding: 24px; }
  h1 { text-align: center; font-size: 1.4rem; }
  a { display: block; margin: 8px 0; padding: 12px; border: 1px solid #ddd; border-radius: 12px; text-align: center; color: #111; text-decoration: none; }
</style>
<main>
  <h1>${escapeText(title || "Links")}</h1>
  ${items}
</main>
</html>`
}

function escapeText(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function escapeAttr(value: string) {
  return escapeText(value).replaceAll('"', "&quot;")
}

function downloadHtml(html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "bio-links.html"
  link.click()
  URL.revokeObjectURL(url)
}

const PROMPT_KEY = "nb-prompt-library"
type SavedPrompt = { id: string; title: string; body: string }
let savedPrompts: SavedPrompt[] = []
let promptsLoaded = false
const promptListeners = new Set<() => void>()

function readPrompts() {
  if (!promptsLoaded && typeof window !== "undefined") {
    promptsLoaded = true
    try {
      const stored = JSON.parse(localStorage.getItem(PROMPT_KEY) ?? "[]") as SavedPrompt[]
      savedPrompts = Array.isArray(stored) ? stored : []
    } catch {
      savedPrompts = []
    }
  }
  return savedPrompts
}

function writePrompts(next: SavedPrompt[]) {
  savedPrompts = next
  localStorage.setItem(PROMPT_KEY, JSON.stringify(next))
  promptListeners.forEach((listener) => listener())
}

function subscribePrompts(listener: () => void) {
  promptListeners.add(listener)
  return () => promptListeners.delete(listener)
}

export function PromptLibrary() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const items = useSyncExternalStore(subscribePrompts, readPrompts, () => [])

  function save(next: SavedPrompt[]) {
    writePrompts(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Save prompts in this browser. They stay in local storage on this device and are not synced to an account. Clearing site data removes them.
      </p>
      <Input value={title} placeholder="Title" onChange={(event) => setTitle(event.target.value)} />
      <TextArea label="Prompt" value={body} onChange={setBody} rows={5} />
      <Button
        type="button"
        className="h-10 w-fit"
        onClick={() => {
          if (!body.trim()) return
          save([{ id: uid(), title: title.trim() || "Untitled", body: body.trim() }, ...items])
          setTitle("")
          setBody("")
        }}
      >
        Save prompt
      </Button>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-medium">{item.title}</h2>
              <Button type="button" variant="outline" className="h-8" onClick={() => save(items.filter((row) => row.id !== item.id))}>
                Delete
              </Button>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--nb-secondary)]">{item.body}</p>
            <div className="mt-3">
              <CopyButton text={item.body} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TokenCounter() {
  const [text, setText] = useState("Count the tokens in this prompt.")
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancel = false
    import("gpt-tokenizer")
      .then((mod) => {
        if (!cancel) setCount(mod.countTokens(text))
      })
      .catch(() => {
        if (!cancel) setCount(null)
      })
    return () => {
      cancel = true
    }
  }, [text])

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Paste a prompt and count tokens with gpt-tokenizer’s o200k_base encoding, the one used by recent OpenAI models. It is an approximation. Claude, Gemini, and other models split the same text differently.
      </p>
      <TextArea label="Text" value={text} onChange={setText} rows={8} />
      <div>
        <div className="text-xs font-medium text-[var(--nb-secondary)]">Tokens</div>
        <div className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{count ?? "—"}</div>
      </div>
    </div>
  )
}

const quiz = [
  {
    prompt: "Where do you want the assistant?",
    options: [
      { label: "In the editor, beside the file", tool: "cursor" },
      { label: "In the terminal, on the repo", tool: "claude" },
      { label: "In GitHub and the IDE I already use", tool: "copilot" },
    ],
  },
  {
    prompt: "What do you mostly want from it?",
    options: [
      { label: "Completions and an agent in the editor", tool: "cursor" },
      { label: "An agent I can leave on a task", tool: "claude" },
      { label: "Suggestions that stay on the line I am writing", tool: "copilot" },
    ],
  },
  {
    prompt: "How do you want to pay?",
    options: [
      { label: "An editor plan with a choice of models", tool: "cursor" },
      { label: "A Claude plan I also use for chat", tool: "claude" },
      { label: "A GitHub plan", tool: "copilot" },
    ],
  },
  {
    prompt: "Where does the work happen?",
    options: [
      { label: "Locally, and I switch models", tool: "cursor" },
      { label: "Locally, and the agent should run commands", tool: "claude" },
      { label: "On GitHub, including pull requests", tool: "copilot" },
    ],
  },
] as const

const quizResults = {
  cursor: {
    title: "Cursor",
    copy: "You want the assistant inside the editor, with room to switch models. Start with Cursor if that is the loop you already like.",
  },
  claude: {
    title: "Claude Code",
    copy: "You want an agent in the terminal that can stay with a task and run commands. Claude Code matches that more closely than a line-by-line completer.",
  },
  copilot: {
    title: "GitHub Copilot",
    copy: "You want suggestions close to the code, and you already live in GitHub. Copilot is the lighter fit.",
  },
}

export function AiToolFitQuiz() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const done = answers.length >= quiz.length
  const winner = useMemo(() => {
    if (!done) return null
    const scores: Record<string, number> = { cursor: 0, claude: 0, copilot: 0 }
    for (const answer of answers) scores[answer] += 1
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as keyof typeof quizResults
  }, [answers, done])

  if (winner) {
    const result = quizResults[winner]
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <p className="text-xs font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">A light read</p>
        <h2 className="text-4xl font-semibold tracking-[-0.03em]">{result.title}</h2>
        <p className="text-sm leading-relaxed text-[var(--nb-secondary)]">{result.copy}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={`${result.title}\n${result.copy}`} label="Copy result" />
          <Button type="button" variant="outline" className="w-fit" onClick={() => { setAnswers([]); setStep(0) }}>
            Start again
          </Button>
        </div>
      </div>
    )
  }

  const question = quiz[step]
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Four questions about where you write and what you want the tool to do. The result is a lean toward Cursor, Claude Code, or GitHub Copilot. It is a preference read, not a benchmark.
      </p>
      <p className="text-sm text-[var(--nb-secondary)]">
        {step + 1} of {quiz.length}
      </p>
      <h2 className="text-2xl font-semibold tracking-[-0.03em]">{question.prompt}</h2>
      <div className="flex flex-col gap-2">
        {question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            className="rounded-xl border border-border px-4 py-3 text-left text-[15px] transition-colors hover:bg-[var(--nb-accent)]"
            onClick={() => {
              setAnswers((current) => [...current, option.tool])
              setStep((value) => value + 1)
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { SocialBatteryCheckin } from "@/components/everyday/views"

