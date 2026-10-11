export function threadPosts(text: string, limit: number) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length || limit < 8) return []
  let total = 1
  let bodies = pack(words, limit, total)
  let guard = 0
  while (bodies.length !== total && guard < 20) {
    total = bodies.length
    bodies = pack(words, limit, total)
    guard += 1
  }
  return bodies.map((body, index) => {
    const post = `${index + 1}/${bodies.length} ${body}`
    return { text: post, over: post.length > limit }
  })
}

function pack(words: string[], limit: number, total: number) {
  const chunks: string[] = []
  let current: string[] = []
  const prefix = (index: number) => `${index}/${total} `.length
  let index = 1
  for (const word of words) {
    const next = [...current, word].join(" ")
    if (prefix(index) + next.length > limit && current.length) {
      chunks.push(current.join(" "))
      current = [word]
      index += 1
    } else current.push(word)
  }
  if (current.length) chunks.push(current.join(" "))
  return chunks
}

export function safeHref(value: string) {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed
  return null
}
