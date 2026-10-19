// Share links carry a profile code in the path. Page-view analytics should record that someone visited a
// shared profile, never the code itself, so it is replaced before an event leaves the browser. Anything
// else on the product paths loses its query string and hash too; other paths are left alone.

const SHARE_PATH = /^(\/how-i-work\/(?:p|compare)\/)[^/]+/

export function stripShareCodes<T extends { url: string }>(event: T): T | null {
  try {
    const url = new URL(event.url)
    if (url.pathname !== "/how-i-work" && !url.pathname.startsWith("/how-i-work/")) return event
    url.pathname = url.pathname.replace(SHARE_PATH, "$1[code]")
    url.search = ""
    url.hash = ""
    return { ...event, url: url.toString() }
  } catch {
    return null
  }
}
