const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

type AnthropicTextBlock = {
  type: string
  text?: string
}

type AnthropicMessageResponse = {
  content?: AnthropicTextBlock[]
  error?: { message?: string }
}

export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set")
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = (await response.json()) as AnthropicMessageResponse

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Anthropic request failed (${response.status})`)
  }

  const text = data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim()

  if (!text) {
    throw new Error("Anthropic returned an empty response")
  }

  return text
}
