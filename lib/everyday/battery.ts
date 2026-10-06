export type BatteryOption = { label: string; rest: boolean }
export type BatteryQuestion = { prompt: string; options: BatteryOption[] }

export const batteryQuestions: BatteryQuestion[] = [
  {
    prompt: "After a long social day, you want…",
    options: [
      { label: "Quiet, and an early night", rest: true },
      { label: "A short pause, then you are fine", rest: false },
      { label: "Another plan", rest: false },
    ],
  },
  {
    prompt: "Someone asks to hang out tonight.",
    options: [
      { label: "It feels like too much", rest: true },
      { label: "You could, if it stays small", rest: false },
      { label: "That sounds good", rest: false },
    ],
  },
  {
    prompt: "This week’s plans have felt…",
    options: [
      { label: "Stacked", rest: true },
      { label: "About right", rest: false },
      { label: "A bit thin", rest: false },
    ],
  },
]

export function batteryRead(rests: number) {
  if (rests >= 2) {
    return {
      title: "You’re probably due for some downtime.",
      note: "Two or three of those answers lean toward rest. A light prompt, not a diagnosis.",
    }
  }
  if (rests === 1) {
    return {
      title: "A quieter evening would not hurt.",
      note: "One rest-leaning answer. Keep it light — this is not a score.",
    }
  }
  return {
    title: "You sound like you still have some charge.",
    note: "None of the answers leaned toward rest. Still only a nudge, not advice.",
  }
}
