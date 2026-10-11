"use client"

import { CopyButton, Field, NumberField, selectClass, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { postingPlatforms, postingWindows } from "@/lib/creator/posting"
import {
  engagementRate,
  instagramFollowerBand,
  moneyIn,
  quoteCurrencies,
  quoteTotal,
  rateContent,
  ratePlatforms,
  readAmount,
  suggestedRate,
  type EngagementMethod,
} from "@/lib/creator/rates"
import { downloadText } from "@/lib/tools/download"
import { num } from "@/lib/tools/format"
import { useMemo, useState } from "react"

const basisOptions = [
  ["project", "Per project", "Projects"],
  ["hour", "Per hour", "Hours"],
  ["day", "Per day", "Days"],
] as const

export function RateCardCalculator() {
  const [followers, setFollowers] = useState("25000")
  const [engagement, setEngagement] = useState("2.4")
  const [platform, setPlatform] = useState("instagram")
  const [content, setContent] = useState("reel")
  const [basis, setBasis] = useState<(typeof basisOptions)[number][0]>("project")
  const [quantity, setQuantity] = useState("1")
  const [currency, setCurrency] = useState<(typeof quoteCurrencies)[number]>("USD")
  const [rate, setRate] = useState("")
  const [usage, setUsage] = useState("0")
  const [rush, setRush] = useState("0")
  const [expenses, setExpenses] = useState("0")
  const [notes, setNotes] = useState("")

  const suggestion = useMemo(() => {
    const people = readAmount(followers)
    const ratePct = readAmount(engagement)
    if (people === null || ratePct === null) return null
    return suggestedRate(people, ratePct, platform, content)
  }, [content, engagement, followers, platform])

  const quote = useMemo(() => {
    const price = readAmount(rate)
    const count = readAmount(quantity)
    const extras = [usage, rush, expenses].map(readAmount)
    if (price === null || count === null || extras.some((value) => value === null)) return null
    return quoteTotal(price, count, extras as number[])
  }, [expenses, quantity, rate, rush, usage])

  const platformName = ratePlatforms.find(([value]) => value === platform)?.[1] ?? platform
  const contentName = rateContent.find(([value]) => value === content)?.[1] ?? content
  const basisName = basisOptions.find(([value]) => value === basis)?.[1] ?? "Per project"
  const quantityName = basisOptions.find(([value]) => value === basis)?.[2] ?? "Quantity"

  const card = useMemo(() => {
    const lines = [
      `${platformName} · ${contentName}`,
      `${basisName} × ${quantity || "—"}`,
      quote ? `Service: ${moneyIn(quote.service, currency)}` : "Service: type a rate",
      `Usage rights: ${moneyIn(readAmount(usage) ?? 0, currency)}`,
      `Rush: ${moneyIn(readAmount(rush) ?? 0, currency)}`,
      `Expenses: ${moneyIn(readAmount(expenses) ?? 0, currency)}`,
      quote ? `Total: ${moneyIn(quote.total, currency)}` : "Total: —",
      notes.trim() ? `Notes: ${notes.trim()}` : "",
      suggestion
        ? `Starting range, not this quote: ${moneyIn(suggestion.low, "USD")}–${moneyIn(suggestion.high, "USD")} (USD ${suggestion.base} per 1,000 followers, adjustment ${num(suggestion.adjust, 2)}).`
        : "",
    ]
    return lines.filter(Boolean).join("\n")
  }, [basisName, contentName, currency, expenses, notes, platformName, quantity, quote, rush, suggestion, usage])

  function reset() {
    setFollowers("25000")
    setEngagement("2.4")
    setPlatform("instagram")
    setContent("reel")
    setBasis("project")
    setQuantity("1")
    setCurrency("USD")
    setRate("")
    setUsage("0")
    setRush("0")
    setExpenses("0")
    setNotes("")
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Build a card from a rate you choose. The range underneath is a separate USD starting guess from followers and a content type. It is not the quote, and it is not what a brand will pay.
      </p>

      <section className="flex flex-col gap-4" aria-labelledby="rate-quote">
        <h2 id="rate-quote" className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          Your quote
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform">
            <select className={selectClass} value={platform} onChange={(event) => setPlatform(event.target.value)}>
              {ratePlatforms.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service">
            <select className={selectClass} value={content} onChange={(event) => setContent(event.target.value)}>
              {rateContent.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priced">
            <select className={selectClass} value={basis} onChange={(event) => setBasis(event.target.value as typeof basis)}>
              {basisOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <select className={selectClass} value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)}>
              {quoteCurrencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
          <NumberField label="Rate" value={rate} onChange={setRate} suffix={currency} placeholder="Your number" min={0} />
          <NumberField label={quantityName} value={quantity} onChange={setQuantity} min={0} />
          <NumberField label="Usage rights" value={usage} onChange={setUsage} suffix={currency} min={0} />
          <NumberField label="Rush" value={rush} onChange={setRush} suffix={currency} min={0} />
          <NumberField label="Expenses" value={expenses} onChange={setExpenses} suffix={currency} min={0} />
        </div>
        <TextArea label="Notes" value={notes} onChange={setNotes} rows={3} />
        {quote ? (
          <div className="flex flex-col gap-3">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-[var(--nb-secondary)]">Service</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{moneyIn(quote.service, currency)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--nb-secondary)]">Optional costs</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{moneyIn(quote.extra, currency)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--nb-secondary)]">Total</dt>
                <dd className="mt-1 text-3xl font-semibold tabular-nums">{moneyIn(quote.total, currency)}</dd>
              </div>
            </dl>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
              Total = rate × {quantityName.toLowerCase()} + usage rights + rush + expenses. Nothing here is converted between currencies.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--nb-secondary)]">Type a rate, a quantity, and costs that are zero or above. A blank rate is not a free quote.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <CopyButton text={card} label="Copy card" />
          <Button type="button" variant="outline" className="h-10" onClick={() => downloadText(card, "rate-card.txt")}>
            Download
          </Button>
          <Button type="button" variant="outline" className="h-10" onClick={reset}>
            Reset
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6" aria-labelledby="rate-start">
        <h2 id="rate-start" className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          Starting range, in USD
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
          A rough amount per 1,000 followers for this platform and service, nudged by how the engagement you type compares with a typical rate for that platform. Low is 70% of the middle. High is 130%. The adjustment is held between 0.6 and 1.8 so one strong month does not multiply the range without limit.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Followers" value={followers} onChange={setFollowers} min={0} />
          <NumberField label="Engagement rate" value={engagement} onChange={setEngagement} suffix="%" min={0} />
        </div>
        {suggestion ? (
          <div className="flex flex-col gap-3">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-[var(--nb-secondary)]">Low</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{moneyIn(suggestion.low, "USD")}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--nb-secondary)]">Middle</dt>
                <dd className="mt-1 text-3xl font-semibold tabular-nums">{moneyIn(suggestion.mid, "USD")}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--nb-secondary)]">High</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{moneyIn(suggestion.high, "USD")}</dd>
              </div>
            </dl>
            <p className="max-w-xl font-mono text-[13px] text-[var(--nb-secondary)]">
              ({followers || "0"} ÷ 1,000) × USD {suggestion.base} × {num(suggestion.adjust, 2)}
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
              USD {suggestion.base} per 1,000 followers for {platformName} {contentName.toLowerCase()}. Typical engagement used for the nudge is {suggestion.typical}%. Your rate ÷ that typical is the adjustment
              {suggestion.clamped ? ", and it was held at the 0.6–1.8 limit" : ""}. Usage rights, exclusivity, and production time are not in this range.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-fit"
              onClick={() => {
                setRate(String(Math.round(suggestion.mid)))
                setCurrency("USD")
              }}
            >
              Use the middle as my rate, in USD
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[var(--nb-secondary)]">Followers need to be above zero. Engagement can be zero.</p>
        )}
      </section>
    </div>
  )
}

export function EngagementRateCalculator() {
  const [method, setMethod] = useState<EngagementMethod>("followers")
  const [followers, setFollowers] = useState("12000")
  const [likes, setLikes] = useState("240")
  const [comments, setComments] = useState("18")
  const [shares, setShares] = useState("0")
  const [views, setViews] = useState("4000")

  const result = useMemo(() => {
    const likesN = readAmount(likes)
    const commentsN = readAmount(comments)
    const followersN = readAmount(followers)
    const sharesN = readAmount(shares)
    const viewsN = readAmount(views)
    if (likesN === null || commentsN === null) return null
    if (method === "followers") {
      if (followersN === null) return null
      return engagementRate(method, { followers: followersN, likes: likesN, comments: commentsN, shares: 0, views: 0 })
    }
    if (sharesN === null || viewsN === null) return null
    return engagementRate(method, { followers: 0, likes: likesN, comments: commentsN, shares: sharesN, views: viewsN })
  }, [comments, followers, likes, method, shares, views])

  function reset() {
    setMethod("followers")
    setFollowers("12000")
    setLikes("240")
    setComments("18")
    setShares("0")
    setViews("4000")
  }

  const copy = result ? `${num(result.rate)}% via ${result.formula}. ${result.used}` : ""

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Pick one definition. Followers uses likes and comments over followers. Views uses likes, comments, and shares over views. The other inputs are not mixed in.
      </p>
      <Field label="Method" className="max-w-xs">
        <select className={selectClass} value={method} onChange={(event) => setMethod(event.target.value as EngagementMethod)}>
          <option value="followers">By followers</option>
          <option value="views">By views</option>
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {method === "followers" ? <NumberField label="Followers" value={followers} onChange={setFollowers} min={0} /> : <NumberField label="Views" value={views} onChange={setViews} min={0} />}
        <NumberField label="Average likes" value={likes} onChange={setLikes} min={0} />
        <NumberField label="Average comments" value={comments} onChange={setComments} min={0} />
        {method === "views" ? <NumberField label="Average shares" value={shares} onChange={setShares} min={0} /> : null}
      </div>
      {result ? (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-[var(--nb-secondary)]">Engagement</div>
          <p className="text-4xl font-semibold tabular-nums">{num(result.rate)}%</p>
          <p className="font-mono text-[13px] text-[var(--nb-secondary)]">{result.formula}</p>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
            {num(result.interactions, 0)} interactions. {result.used}
            {method === "followers" ? ` ${instagramFollowerBand(result.rate)}` : " The Instagram quiet / ordinary / strong bands are not used here, because those bands are for a followers rate."}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">
          {method === "followers" ? "Followers need to be above zero. Likes and comments can be zero." : "Views need to be above zero. Likes, comments, and shares can be zero."}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {copy ? <CopyButton text={copy} label="Copy result" /> : null}
        <Button type="button" variant="outline" className="h-10" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  )
}

export function PostingTime() {
  const [platform, setPlatform] = useState("instagram")
  const window = postingWindows[platform] ?? postingWindows.instagram
  const name = postingPlatforms.find(([value]) => value === platform)?.[1] ?? platform
  const summary = `${name}: ${window.when}, about ${window.hours}, in the audience's local time. A starting window, not a measured best hour.`

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        A starting window from general weekday patterns. It is not your best time to post, and it is not read from your account. Individual audience data can differ, especially if people are online at night.
      </p>
      <Field label="Platform" className="max-w-xs">
        <select className={selectClass} value={platform} onChange={(event) => setPlatform(event.target.value)}>
          {postingPlatforms.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div>
        <div className="text-xs font-medium text-[var(--nb-secondary)]">Starting window</div>
        <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{window.hours}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{window.when}. Read these hours on the audience&apos;s local clock. This page does not shift them for a city, because it does not have a separate dataset per country.</p>
      </div>
      <CopyButton text={summary} label="Copy window" />
    </div>
  )
}
