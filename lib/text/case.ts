export type CaseMode = "sentence" | "title" | "upper" | "lower" | "camel" | "pascal" | "snake" | "kebab"

const small = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "but", "nor", "as", "at", "by", "vs"])

export function convertCase(text: string, mode: CaseMode) {
  if (mode === "upper") return text.toLocaleUpperCase()
  if (mode === "lower") return text.toLocaleLowerCase()
  if (mode === "sentence") {
    const lower = text.toLocaleLowerCase()
    return lower.replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (match) => match.toLocaleUpperCase())
  }
  if (mode === "title") {
    const parts = text.toLocaleLowerCase().split(/(\s+)/)
    let first = -1
    let last = -1
    parts.forEach((part, index) => {
      if (!part.trim()) return
      if (first < 0) first = index
      last = index
    })
    return parts
      .map((part, index) => {
        const word = part.trim()
        if (!word) return part
        if (index !== first && index !== last && small.has(word)) return part
        return part.replace(word, word.charAt(0).toLocaleUpperCase() + word.slice(1))
      })
      .join("")
  }
  const tokens = identifierWords(text)
  if (!tokens.length) return ""
  if (mode === "camel") return tokens[0].toLocaleLowerCase() + tokens.slice(1).map(cap).join("")
  if (mode === "pascal") return tokens.map(cap).join("")
  if (mode === "snake") return tokens.map((token) => token.toLocaleLowerCase()).join("_")
  return tokens.map((token) => token.toLocaleLowerCase()).join("-")
}

function identifierWords(text: string) {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
}

function cap(word: string) {
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
}
