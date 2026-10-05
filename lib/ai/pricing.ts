export type ModelPrice = {
  id: string
  label: string
  input: number
  output: number
  href: string
  context: number
}

/** USD per 1M tokens. Update this file when provider pages change. */
export const PRICES_CHECKED = "5 October 2026"

export const modelPrices: ModelPrice[] = [
  {
    id: "claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    input: 1,
    output: 5,
    href: "https://platform.claude.com/docs/en/about-claude/pricing",
    context: 200_000,
  },
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    input: 2,
    output: 10,
    href: "https://platform.claude.com/docs/en/about-claude/pricing",
    context: 200_000,
  },
  {
    id: "claude-opus-4.5",
    label: "Claude Opus 4.5",
    input: 5,
    output: 25,
    href: "https://platform.claude.com/docs/en/about-claude/pricing",
    context: 200_000,
  },
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    input: 2,
    output: 8,
    href: "https://developers.openai.com/api/docs/pricing",
    context: 1_047_576,
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    input: 1.25,
    output: 10,
    href: "https://developers.openai.com/api/docs/pricing",
    context: 400_000,
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    input: 0.3,
    output: 2.5,
    href: "https://ai.google.dev/gemini-api/docs/pricing",
    context: 1_048_576,
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro (prompts up to 200k)",
    input: 1.25,
    output: 10,
    href: "https://ai.google.dev/gemini-api/docs/pricing",
    context: 1_048_576,
  },
]

export const modelPriceMap: Record<string, ModelPrice> = Object.fromEntries(modelPrices.map((model) => [model.id, model]))

export const contextWindows = [
  { id: "8k", label: "8k", tokens: 8_192 },
  { id: "16k", label: "16k", tokens: 16_384 },
  { id: "32k", label: "32k", tokens: 32_768 },
  { id: "128k", label: "128k", tokens: 128_000 },
  { id: "200k", label: "200k", tokens: 200_000 },
  { id: "1m", label: "1M", tokens: 1_048_576 },
] as const

export function promptCost(inputTokens: number, outputTokens: number, inputRate: number, outputRate: number, requests: number) {
  const perRequest = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000
  const total = perRequest * requests
  return { perRequest, total }
}

export function estimateTokensFromChars(chars: number) {
  return Math.max(0, Math.round(chars / 4))
}

export function contextUsage(inputTokens: number, outputTokens: number, windowTokens: number) {
  const used = inputTokens + outputTokens
  return {
    used,
    remaining: windowTokens - used,
    ratio: windowTokens <= 0 ? 0 : used / windowTokens,
  }
}
