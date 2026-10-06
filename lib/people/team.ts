export function meetingCost(people: number, hourly: number, minutes: number, perMonth: number) {
  if (![people, hourly, minutes, perMonth].every(Number.isFinite)) return null
  if (people <= 0 || minutes < 0 || hourly < 0 || perMonth < 0) return null
  const hours = minutes / 60
  const meeting = people * hourly * hours
  const month = meeting * perMonth
  const year = month * 12
  const hoursYear = people * hours * perMonth * 12
  return { meeting, month, year, hoursYear, hours }
}

export function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export const raciRoles = ["", "R", "A", "C", "I"] as const
export type RaciRole = (typeof raciRoles)[number]

export const raciLegend: { id: Exclude<RaciRole, "">; label: string; meaning: string }[] = [
  { id: "R", label: "Responsible", meaning: "Does the work" },
  { id: "A", label: "Accountable", meaning: "Owns the outcome — usually one person" },
  { id: "C", label: "Consulted", meaning: "Asked before it happens" },
  { id: "I", label: "Informed", meaning: "Told after it happens" },
]

export function nextRaci(current: string) {
  const index = raciRoles.indexOf((current || "") as RaciRole)
  return raciRoles[(index < 0 ? 0 : index + 1) % raciRoles.length]
}

export function taskIssues(task: string, people: string[], grid: Record<string, string>) {
  const cells = people.map((person) => grid[`${task}|${person}`] || "")
  if (!cells.some(Boolean)) return []
  const accountable = cells.filter((cell) => cell === "A").length
  const responsible = cells.filter((cell) => cell === "R").length
  const issues: string[] = []
  if (accountable === 0) issues.push("No one is accountable")
  if (accountable > 1) issues.push("More than one accountable")
  if (responsible === 0) issues.push("No one is responsible")
  return issues
}

export function raciRows(tasks: string[], people: string[], grid: Record<string, string>) {
  return tasks.map((task) => ({
    task,
    cells: people.map((person) => grid[`${task}|${person}`] || ""),
    issues: taskIssues(task, people, grid),
  }))
}

export function raciTsv(tasks: string[], people: string[], grid: Record<string, string>) {
  return [
    ["Task", ...people].join("\t"),
    ...tasks.map((task) => [task, ...people.map((person) => grid[`${task}|${person}`] || "")].join("\t")),
  ].join("\n")
}

export function raciCsv(tasks: string[], people: string[], grid: Record<string, string>) {
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`
  return [
    ["Task", ...people].map(cell).join(","),
    ...tasks.map((task) => [task, ...people.map((person) => grid[`${task}|${person}`] || "")].map(cell).join(",")),
  ].join("\n")
}

export function workingAgreement(values: { team: string; hours: string; response: string; decisions: string }) {
  const team = values.team.trim() || "Team"
  return `${team} working agreement\n\nHours\n${values.hours.trim() || "—"}\n\nResponse\n${values.response.trim() || "—"}\n\nDecisions\n${values.decisions.trim() || "—"}`
}

export function meetingAgenda(title: string, when: string, items: string) {
  const heading = title.trim() || "Agenda"
  const numbered = splitLines(items).map((item, index) => `${index + 1}. ${item}`)
  return `${heading}\n${when.trim()}\n\n${numbered.join("\n") || "1. Add an item"}`.trim()
}

export function oneOnOneAgenda(person: string, wins: string, blockers: string, actions: string) {
  const who = person.trim()
  return `1:1${who ? ` with ${who}` : ""}\n\nSince last time\n${wins.trim() || "—"}\n\nBlockers\n${blockers.trim() || "—"}\n\nActions\n${actions.trim() || "—"}`
}

export function nextFromBag(pool: string[], recent: string[]) {
  const available = pool.filter((item) => !recent.includes(item))
  const source = available.length ? available : pool
  if (!source.length) return ""
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return source[bytes[0] % source.length]
}
