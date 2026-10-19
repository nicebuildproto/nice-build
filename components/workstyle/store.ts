"use client"

import { useSyncExternalStore } from "react"
import { emptyState, parseStoredState, serializeState, STORAGE_KEY, type Recovery, type StoredState } from "@/lib/workstyle/persistence"

// A tiny external store over localStorage. The server (and the first client render) sees `null`, so
// hydration always matches; after that every component reads one shared, defensively parsed copy.

export type Snapshot = { state: StoredState; recovery: Recovery; saveFailed: boolean }

export const REVEAL_KEY = "ws.revealed"

let snapshot: Snapshot | null = null
let storageListening = false
const listeners = new Set<() => void>()

function load(): Snapshot {
  let raw: string | null = null
  let saveFailed = false
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    saveFailed = true
  }
  const { state, recovery } = parseStoredState(raw)
  return { state, recovery, saveFailed }
}

function emit() {
  listeners.forEach((listener) => listener())
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  snapshot = null
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!storageListening) {
    window.addEventListener("storage", onStorage)
    storageListening = true
  }
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null
  if (!snapshot) snapshot = load()
  return snapshot
}

export function getState(): StoredState {
  return getSnapshot()?.state ?? emptyState()
}

export function updateState(change: (state: StoredState) => StoredState) {
  const current = getSnapshot()
  if (!current) return
  const next = { ...change(current.state), updatedAt: new Date().toISOString() }
  let saveFailed = false
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeState(next))
  } catch {
    saveFailed = true
  }
  snapshot = { state: next, recovery: "none", saveFailed }
  emit()
}

/** Removes everything this product has stored on this device. */
export function clearAll() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(REVEAL_KEY)
  } catch {
    // Nothing to remove if storage is unavailable.
  }
  snapshot = { state: emptyState(), recovery: "none", saveFailed: false }
  emit()
}

export function useWorkstyle(): Snapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}

// ───────────────────────── Motion preference ─────────────────────────

function subscribeMotion(listener: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)")
  query.addEventListener("change", listener)
  return () => query.removeEventListener("change", listener)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}
