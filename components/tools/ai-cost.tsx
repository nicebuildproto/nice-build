"use client"

import { CopyButton, NumberField, ResetButton, Stat, TextArea, ToolNote, parseAmount, selectClass } from "@/components/tools/ui"
import { contextUsage, contextWindows, estimateTokensFromChars, modelPrices, promptCost, PRICES_CHECKED, type ModelPrice } from "@/lib/ai/pricing"
import { useEffect, useState } from "react"

function usd(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "USD" }).format(value)
}

export function AiContextWindowCalculator() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [inputTokens, setInputTokens] = useState("")
  const [outputTokens, setOutputTokens] = useState("")
  const [windowId, setWindowId] = useState("128k")
  const [custom, setCustom] = useState("200000")
  const [counted, setCounted] = useState<{ input: number | null; output: number | null }>({ input: null, output: null })

  useEffect(() => {
    let cancel = false
    if (!inputText && !outputText) return
    import("gpt-tokenizer")
      .then((mod) => {
        if (cancel) return
        setCounted({
          input: inputText ? mod.countTokens(inputText) : null,
          output: outputText ? mod.countTokens(outputText) : null,
        })
      })
      .catch(() => {
        if (!cancel) setCounted({ input: null, output: null })
      })
    return () => {
      cancel = true
    }
  }, [inputText, outputText])

  const windowTokens = windowTokensFor(windowId, custom)
  const input = (inputText ? counted.input : null) ?? parseAmount(inputTokens) ?? (inputText ? estimateTokensFromChars(inputText.length) : 0)
  const output = (outputText ? counted.output : null) ?? parseAmount(outputTokens) ?? (outputText ? estimateTokensFromChars(outputText.length) : 0)
  const usage = contextUsage(input, output, windowTokens)
  const tokenised = (inputText && counted.input !== null) || (outputText && counted.output !== null)

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>
        {tokenised
          ? "Input and output are counted with gpt-tokenizer (o200k_base). Other models split text differently."
          : "Paste text to count with a tokenizer, or type token numbers. Character ÷ 4 is only a rough stand-in."}
      </ToolNote>
      <label className="flex max-w-xs flex-col gap-2 text-[13px]">
        Context window
        <select className={selectClass} value={windowId} onChange={(event) => setWindowId(event.target.value)}>
          {contextWindows.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} ({item.tokens.toLocaleString("en-AU")} tokens)
            </option>
          ))}
          {modelPrices.map((model) => (
            <option key={model.id} value={`m-${model.id}`}>
              {model.label} ({model.context.toLocaleString("en-AU")})
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </label>
      {windowId === "custom" ? (
        <div className="max-w-xs">
          <NumberField label="Custom window" value={custom} onChange={setCustom} suffix="tokens" min={1} step="1" />
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="Input text (optional)" value={inputText} onChange={setInputText} rows={6} />
        <TextArea label="Expected output (optional)" value={outputText} onChange={setOutputText} rows={6} />
        <NumberField label="Input tokens" value={inputTokens} onChange={setInputTokens} min={0} step="1" />
        <NumberField label="Output tokens" value={outputTokens} onChange={setOutputTokens} min={0} step="1" />
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Used" value={usage.used.toLocaleString("en-AU")} />
          <Stat label="Remaining" value={usage.remaining.toLocaleString("en-AU")} />
          <Stat label="Of window" value={`${Math.round(usage.ratio * 1000) / 10}%`} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-[var(--nb-primary)]" style={{ width: `${Math.min(100, Math.max(0, usage.ratio * 100))}%` }} />
        </div>
        <p className="text-sm text-[var(--nb-secondary)]">
          {tokenised ? "Tokenizer counts are shown where text was pasted." : "Typed token counts, or a character-based estimate if you only pasted text and the tokenizer is still loading."}
        </p>
        <CopyButton text={`Used ${usage.used} of ${windowTokens} tokens; ${usage.remaining} remaining.`} label="Copy result" />
        <ResetButton
          onClick={() => {
            setInputText("")
            setOutputText("")
            setInputTokens("")
            setOutputTokens("")
          }}
        />
      </div>
    </div>
  )
}

function windowTokensFor(id: string, custom: string) {
  if (id === "custom") return parseAmount(custom) ?? 0
  if (id.startsWith("m-")) return modelPrices.find((model) => model.id === id.slice(2))?.context ?? 128000
  return contextWindows.find((item) => item.id === id)?.tokens ?? 128000
}

export function PromptCostCalculator() {
  const [modelId, setModelId] = useState("claude-sonnet-5")
  const [input, setInput] = useState("800")
  const [output, setOutput] = useState("300")
  const [requests, setRequests] = useState("40")
  const [customIn, setCustomIn] = useState("2")
  const [customOut, setCustomOut] = useState("10")
  const model: ModelPrice | undefined = modelPrices.find((item) => item.id === modelId)
  const inputRate = modelId === "custom" ? parseAmount(customIn) ?? 0 : model?.input ?? 0
  const outputRate = modelId === "custom" ? parseAmount(customOut) ?? 0 : model?.output ?? 0
  const inTok = parseAmount(input)
  const outTok = parseAmount(output)
  const req = parseAmount(requests)
  const daily = inTok !== null && outTok !== null && req !== null ? promptCost(inTok, outTok, inputRate, outputRate, req) : null
  const monthly = daily ? daily.total * 30 : null

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>
        Prices were copied from provider pages on {PRICES_CHECKED} and live in one file, so they can lag. Standard input and output rates only — no cache, batch, or long-context uplift. Confirm on the provider page before you budget.
      </ToolNote>
      <label className="flex max-w-lg flex-col gap-2 text-[13px]">
        Model
        <select className={selectClass} value={modelId} onChange={(event) => setModelId(event.target.value)}>
          {modelPrices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
          <option value="custom">Custom USD / 1M tokens</option>
        </select>
      </label>
      {modelId === "custom" ? (
        <div className="grid max-w-lg gap-4 sm:grid-cols-2">
          <NumberField label="Input / 1M" value={customIn} onChange={setCustomIn} suffix="USD" min={0} />
          <NumberField label="Output / 1M" value={customOut} onChange={setCustomOut} suffix="USD" min={0} />
        </div>
      ) : model ? (
        <p className="text-sm text-[var(--nb-secondary)]">
          {usd(model.input)} in / {usd(model.output)} out per 1M tokens.{" "}
          <a className="underline-offset-4 hover:underline" href={model.href} target="_blank" rel="noreferrer">
            Provider page
          </a>
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Input tokens" value={input} onChange={setInput} min={0} step="1" />
        <NumberField label="Output tokens" value={output} onChange={setOutput} min={0} step="1" />
        <NumberField label="Requests per day" value={requests} onChange={setRequests} min={0} step="1" />
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Per request" value={daily ? usd(daily.perRequest) : "—"} />
          <Stat label="Per day" value={daily ? usd(daily.total) : "—"} />
          <Stat label="Per 30 days" value={monthly !== null ? usd(monthly) : "—"} />
        </div>
        {daily ? (
          <CopyButton
            text={`Per request: ${usd(daily.perRequest)}\nPer day: ${usd(daily.total)}\nPer 30 days: ${usd(monthly ?? 0)}`}
            label="Copy result"
          />
        ) : null}
        <ResetButton
          onClick={() => {
            setInput("")
            setOutput("")
            setRequests("")
          }}
        />
      </div>
    </div>
  )
}
