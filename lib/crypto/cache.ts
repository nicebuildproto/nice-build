type MemoryEntry = { expires: number; value: unknown }

const memory = new Map<string, MemoryEntry>()

export function memoryGet<T>(key: string): T | null {
  const hit = memory.get(key)
  if (!hit || hit.expires <= Date.now()) {
    if (hit) memory.delete(key)
    return null
  }
  return hit.value as T
}

export function memorySet<T>(key: string, value: T, ttlMs: number) {
  memory.set(key, { value, expires: Date.now() + ttlMs })
}

export async function cachedJson<T>(
  key: string,
  url: string,
  ttlSeconds: number,
  init: RequestInit = {},
): Promise<{ ok: true; data: T; status: number } | { ok: false; status: number; error: string }> {
  const cached = memoryGet<{ data: T; status: number }>(key)
  if (cached) return { ok: true, data: cached.data, status: cached.status }

  try {
    const response = await fetch(url, {
      ...init,
      cache: "force-cache",
      next: { revalidate: ttlSeconds },
      signal: init.signal ?? AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      const error = `Upstream ${response.status}`
      return { ok: false, status: response.status, error }
    }
    const data = (await response.json()) as T
    memorySet(key, { data, status: response.status }, ttlSeconds * 1000)
    return { ok: true, data, status: response.status }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed"
    return { ok: false, status: 0, error: message }
  }
}

export async function mapPool<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  async function run() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      out[index] = await worker(items[index], index)
    }
  }
  const workers = Math.min(Math.max(1, limit), items.length)
  await Promise.all(Array.from({ length: workers }, () => run()))
  return out
}
