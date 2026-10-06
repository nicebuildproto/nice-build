import assert from "node:assert/strict"
import test from "node:test"
import { convertCase } from "./case.ts"
import { diffLines, diffSummary, unifiedDiff } from "./diff.ts"
import { countText, formatReading, readingClock } from "./stats.ts"
import { markdownTable, tidyText, uniqueLines } from "./transform.ts"

test("countText splits words, lines, and sentences", () => {
  const stats = countText("Nice Build is a quiet place for useful tools.")
  assert.equal(stats.words, 9)
  assert.equal(stats.characters, 45)
  assert.equal(stats.withoutSpaces, 37)
  assert.equal(stats.sentences, 1)
  assert.equal(stats.readingMinutes, 1)
})

test("countText treats empty input as zeros", () => {
  const stats = countText("")
  assert.equal(stats.words, 0)
  assert.equal(stats.lines, 0)
  assert.equal(stats.readingMinutes, 0)
})

test("readingClock uses the requested pace", () => {
  const clock = readingClock(44, 220)
  assert.equal(clock.minutes, 0)
  assert.equal(clock.seconds, 12)
})

test("convertCase covers sentence, title, and identifier forms", () => {
  assert.equal(convertCase("nice build is a toolkit.", "sentence"), "Nice build is a toolkit.")
  assert.equal(
    convertCase("nice build is a toolkit. it stays local.", "sentence"),
    "Nice build is a toolkit. It stays local.",
  )
  assert.equal(convertCase("nice build of tools", "title"), "Nice Build of Tools")
  assert.equal(convertCase("the quick brown fox", "upper"), "THE QUICK BROWN FOX")
  assert.equal(convertCase("the quick brown fox", "camel"), "theQuickBrownFox")
  assert.equal(convertCase("the quick brown fox", "pascal"), "TheQuickBrownFox")
  assert.equal(convertCase("the quick brown fox", "snake"), "the_quick_brown_fox")
  assert.equal(convertCase("the quick brown fox", "kebab"), "the-quick-brown-fox")
})

test("formatReading shows seconds for short text", () => {
  assert.equal(formatReading(9, 200), "3s")
  assert.equal(formatReading(0, 200), "0s")
})

test("diffLines marks added and removed lines", () => {
  const rows = diffLines("The quiet toolkit.\nBuilt nicely.", "The quiet toolkit.\nBuilt carefully.")
  const summary = diffSummary(rows)
  assert.equal(summary.unchanged, 1)
  assert.equal(summary.removed, 1)
  assert.equal(summary.added, 1)
  assert.ok(unifiedDiff(rows).includes("- Built nicely."))
  assert.ok(unifiedDiff(rows).includes("+ Built carefully."))
})

test("uniqueLines keeps first copies in order", () => {
  const result = uniqueLines("oak\nash\noak\npine")
  assert.equal(result.text, "oak\nash\npine")
  assert.equal(result.dropped, 1)
})

test("tidyText trims, collapses blanks, and can sort", () => {
  const cleaned = tidyText("  Hello   there  \n\n\nNext line  ", {
    trim: true,
    spaces: true,
    blanks: true,
    quotes: false,
    empty: false,
    sort: false,
    dedupe: false,
  })
  assert.equal(cleaned, "Hello there\n\nNext line")
  assert.equal(
    tidyText("Windows\r\n\r\n  line  ", {
      trim: true,
      spaces: true,
      blanks: true,
      quotes: false,
      empty: false,
      sort: false,
      dedupe: false,
    }),
    "Windows\n\nline",
  )
  const sorted = tidyText("b\na\nb", {
    trim: true,
    spaces: false,
    blanks: false,
    quotes: false,
    empty: false,
    sort: true,
    dedupe: true,
  })
  assert.equal(sorted, "a\nb")
})

test("markdownTable builds a header, divider, and rows", () => {
  const table = markdownTable("Name, Role", "Ada, Design\nLin, Build")
  assert.equal(table, "| Name | Role |\n| --- | --- |\n| Ada | Design |\n| Lin | Build |")
})
