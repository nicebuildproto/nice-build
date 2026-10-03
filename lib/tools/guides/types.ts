export type ToolGuideCopy = {
  example: string
  faqs: { question: string; answer: string }[]
}

export function guide(example: string, ...pairs: [string, string][]): ToolGuideCopy {
  return {
    example,
    faqs: pairs.map(([question, answer]) => ({ question, answer })),
  }
}
