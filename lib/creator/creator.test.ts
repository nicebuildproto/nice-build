import assert from "node:assert/strict"
import test from "node:test"
import { engagementRate, quoteTotal, readAmount, suggestedRate } from "./rates.ts"
import { threadPosts, safeHref } from "./thread.ts"

test("suggested reel rate shows the USD base and the engagement band", () => {
  const result = suggestedRate(25000, 2.4, "instagram", "reel")
  assert.ok(result)
  assert.equal(result.base, 20)
  assert.ok(Math.abs(result.adjust - 1.6) < 1e-9)
  assert.ok(Math.abs(result.mid - 800) < 1e-6)
  assert.ok(Math.abs(result.low - 560) < 1e-6)
  assert.ok(Math.abs(result.high - 1040) < 1e-6)
  assert.equal(result.clamped, false)
  assert.equal(suggestedRate(0, 2, "instagram", "post"), null)
})

test("engagement adjustment stays inside 0.6 to 1.8", () => {
  const low = suggestedRate(1000, 0, "instagram", "post")
  const high = suggestedRate(1000, 50, "instagram", "post")
  assert.equal(low?.adjust, 0.6)
  assert.equal(low?.clamped, true)
  assert.equal(high?.adjust, 1.8)
  assert.equal(high?.clamped, true)
})

test("a quote is rate times quantity plus the extras you typed", () => {
  assert.deepEqual(quoteTotal(800, 2, [100, 0, 40]), { service: 1600, extra: 140, total: 1740 })
  assert.equal(quoteTotal(-1, 1, [0]), null)
  assert.equal(readAmount(""), null)
  assert.equal(readAmount("0"), 0)
})

test("follower and view engagement stay separate", () => {
  const followers = engagementRate("followers", { followers: 12000, likes: 240, comments: 18, shares: 90, views: 4000 })
  assert.ok(followers)
  assert.ok(Math.abs(followers.rate - 2.15) < 0.001)
  assert.match(followers.used, /not in this definition/)
  const views = engagementRate("views", { followers: 12000, likes: 240, comments: 18, shares: 42, views: 4000 })
  assert.ok(views)
  assert.equal(views.interactions, 300)
  assert.equal(engagementRate("views", { followers: 10, likes: 1, comments: 1, shares: 0, views: 0 }), null)
})

test("thread posts count the number prefix and flag an over-long word", () => {
  const posts = threadPosts("one two three", 12)
  assert.ok(posts.length >= 2)
  assert.ok(posts.every((post, index) => post.text.startsWith(`${index + 1}/${posts.length}`)))
  const long = threadPosts("supercalifragilistic", 12)
  assert.equal(long.length, 1)
  assert.equal(long[0]?.over, true)
  assert.deepEqual(threadPosts("   ", 280), [])
})

test("bio links only keep http and mailto", () => {
  assert.equal(safeHref("https://example.com"), "https://example.com")
  assert.equal(safeHref("javascript:alert(1)"), null)
  assert.equal(safeHref(""), null)
})
