// Regenerates docs/workstyle/question-bank-audit.md and docs/workstyle/questions-and-responses.txt.
// Run with `npm run workstyle:audit`.
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { renderAudit, renderQuestionsExport } from "../lib/workstyle/audit.ts"

const targets: [URL, string][] = [
  [new URL("../docs/workstyle/question-bank-audit.md", import.meta.url), renderAudit()],
  [new URL("../docs/workstyle/questions-and-responses.txt", import.meta.url), renderQuestionsExport()],
]
for (const [url, contents] of targets) {
  const target = fileURLToPath(url)
  writeFileSync(target, contents)
  console.log(`Wrote ${target}`)
}
