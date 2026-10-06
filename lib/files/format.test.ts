import assert from "node:assert/strict"
import test from "node:test"
import { describeAccept, fileMatchesAccept, fileStem, formatBytes, percentChange, rejectReason, withSuffix } from "./format.ts"

test("fileStem drops the last extension", () => {
  assert.equal(fileStem("photo.jpg"), "photo")
  assert.equal(fileStem("document.final.pdf"), "document.final")
  assert.equal(fileStem(".gitignore"), ".gitignore")
})

test("withSuffix builds predictable download names", () => {
  assert.equal(withSuffix("photo.jpg", "-compressed", "jpg"), "photo-compressed.jpg")
  assert.equal(withSuffix("document.pdf", "-merged", "pdf"), "document-merged.pdf")
  assert.equal(withSuffix("clip.mp4", "-trim", "webm"), "clip-trim.webm")
})

test("formatBytes uses compact units", () => {
  assert.equal(formatBytes(0), "0 B")
  assert.equal(formatBytes(512), "512 B")
  assert.equal(formatBytes(2048), "2 KB")
  assert.equal(formatBytes(1_572_864), "1.50 MB")
})

test("percentChange reports reduction and growth", () => {
  assert.equal(percentChange(1000, 400), 60)
  assert.equal(percentChange(400, 1000), -150)
  assert.equal(percentChange(0, 10), 0)
})

test("fileMatchesAccept covers mime wildcards and extensions", () => {
  const jpeg = new File([""], "shot.jpg", { type: "image/jpeg" })
  const pdf = new File([""], "contract.pdf", { type: "application/pdf" })
  assert.equal(fileMatchesAccept(jpeg, "image/*"), true)
  assert.equal(fileMatchesAccept(jpeg, "application/pdf,.pdf"), false)
  assert.equal(fileMatchesAccept(pdf, "application/pdf,.pdf"), true)
  assert.equal(fileMatchesAccept(pdf, "image/png"), false)
})

test("rejectReason explains size and type", () => {
  const huge = new File([new Uint8Array(3)], "huge.png", { type: "image/png" })
  Object.defineProperty(huge, "size", { value: 40_000_000 })
  const reason = rejectReason(huge, "image/*", 12_000_000)
  assert.ok(reason?.includes("larger"))
  const txt = new File(["hi"], "notes.txt", { type: "text/plain" })
  assert.ok(rejectReason(txt, "image/jpeg,.jpg")?.includes("supported"))
})

test("describeAccept lists friendly types", () => {
  assert.ok(describeAccept("image/jpeg,.jpg,image/png").includes("JPEG"))
  assert.ok(describeAccept("application/pdf,.pdf").includes("PDF"))
})
