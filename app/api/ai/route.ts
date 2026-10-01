import { generateText } from "@/lib/ai/client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const prompt =
    typeof body === "object" &&
    body !== null &&
    "prompt" in body &&
    typeof body.prompt === "string"
      ? body.prompt.trim()
      : ""

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  try {
    const text = await generateText(prompt)
    return NextResponse.json({ text })
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
