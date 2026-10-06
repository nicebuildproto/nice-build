import assert from "node:assert/strict"
import test from "node:test"
import {
  leadingStyles,
  parseQuizState,
  questions,
  resultText,
  scoreAnswers,
} from "./quiz.ts"
import {
  meetingAgenda,
  meetingCost,
  nextRaci,
  oneOnOneAgenda,
  raciCsv,
  taskIssues,
  workingAgreement,
} from "./team.ts"

test("scoreAnswers totals each style", () => {
  const scores = scoreAnswers(["maker", "maker", "planner", "closer", "maker"])
  assert.equal(scores.maker, 3)
  assert.deepEqual(leadingStyles(scores), ["maker"])
})

test("leadingStyles reports a tie instead of picking a winner", () => {
  const scores = scoreAnswers(["maker", "planner", "maker", "planner", "connector"])
  assert.deepEqual(leadingStyles(scores), ["maker", "planner"])
  assert.match(resultText(scores), /Maker and Planner/)
  assert.match(resultText(scores), /not a type/)
})

test("quiz state rejects unknown styles", () => {
  assert.equal(parseQuizState(`{"step":1,"answers":["wizard"]}`), null)
  assert.equal(parseQuizState(`{"step":1,"answers":["maker"]}`)?.step, 1)
  assert.equal(questions.length, 5)
})

test("meetingCost uses people × rate × hours", () => {
  const result = meetingCost(6, 85, 45, 4)
  assert.ok(result)
  assert.equal(result.meeting, 6 * 85 * 0.75)
  assert.equal(result.month, result.meeting * 4)
  assert.equal(result.year, result.month * 12)
  assert.equal(result.hoursYear, 6 * 0.75 * 4 * 12)
  assert.equal(meetingCost(0, 85, 45, 4), null)
})

test("RACI flags missing and duplicate accountable", () => {
  const people = ["Alex", "Sam"]
  assert.deepEqual(taskIssues("Publish", people, {}), ["No one is accountable", "No one is responsible"])
  assert.deepEqual(taskIssues("Publish", people, { "Publish|Alex": "A", "Publish|Sam": "A" }), [
    "More than one accountable",
    "No one is responsible",
  ])
  assert.equal(nextRaci(""), "R")
  assert.equal(nextRaci("I"), "")
  assert.equal(raciCsv(["Brief"], ["Alex"], { "Brief|Alex": "R" }), `"Task","Alex"\n"Brief","R"`)
})

test("documents keep the existing shape", () => {
  assert.match(workingAgreement({ team: "Studio", hours: "10–15", response: "Same day", decisions: "Propose, then commit" }), /Studio working agreement/)
  assert.equal(
    meetingAgenda("Weekly studio", "Monday 10:00", "What shipped\n\nWhat is stuck"),
    "Weekly studio\nMonday 10:00\n\n1. What shipped\n2. What is stuck",
  )
  assert.match(oneOnOneAgenda("Sam", "", "Blocked on review", "Send notes"), /1:1 with Sam/)
  assert.match(oneOnOneAgenda("Sam", "", "Blocked on review", "Send notes"), /Since last time\n—/)
})
