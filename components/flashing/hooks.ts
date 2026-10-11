"use client"

import { useEffect, useRef, useState } from "react"

export function useDebouncedValue<T>(value: T, delayMs: number): [T, boolean] {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return [debounced, debounced !== value]
}

export function useAnimatedNumber(target: number, durationMs = 450): number {
  const [value, setValue] = useState(target)
  const current = useRef(target)

  useEffect(() => {
    const from = current.current
    if (from === target) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (target - from) * eased
      current.current = next
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}

export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  )
}

import { useLayoutEffect, useSyncExternalStore, type RefObject } from "react"

/** Subscribes to a media query. Server and first paint report `false`; callers render after hydration. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

/** Border-box size of an element. Updates only when the rounded size changes, so it cannot feed back into layout. */
export function useElementSize(ref: RefObject<HTMLElement | null>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      setSize((current) => (current.w === w && current.h === h ? current : { w, h }))
    }
    read()
    const observer = new ResizeObserver(() => requestAnimationFrame(read))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}

const flagListeners = new Set<() => void>()
const flagMemory = new Map<string, boolean>()

/** A boolean remembered in localStorage (or sessionStorage), shared by every component that reads the key. */
export function useStoredFlag(key: string, initial: boolean, area: "local" | "session" = "local") {
  const value = useSyncExternalStore(
    (onChange) => {
      flagListeners.add(onChange)
      window.addEventListener("storage", onChange)
      return () => {
        flagListeners.delete(onChange)
        window.removeEventListener("storage", onChange)
      }
    },
    () => {
      const remembered = flagMemory.get(key)
      if (remembered !== undefined) return remembered
      try {
        const raw = (area === "local" ? localStorage : sessionStorage).getItem(key)
        return raw === null ? initial : raw === "1"
      } catch {
        return initial
      }
    },
    () => initial
  )
  const set = (next: boolean) => {
    flagMemory.set(key, next)
    try {
      ;(area === "local" ? localStorage : sessionStorage).setItem(key, next ? "1" : "0")
    } catch {}
    flagListeners.forEach((listener) => listener())
  }
  return [value, set] as const
}
