"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getSearch() {
  return window.location.search
}

function emptySearch() {
  return ""
}

function applyParams(defaults: Record<string, string>, search: string) {
  const params = new URLSearchParams(search)
  const next = { ...defaults }
  for (const key of Object.keys(defaults)) {
    const found = params.get(key)
    if (found !== null) next[key] = found
  }
  return next
}

function writeParams(values: Record<string, string>, defaults: Record<string, string>) {
  const url = new URL(window.location.href)
  for (const key of Object.keys(defaults)) {
    const value = values[key] ?? ""
    if (value && value !== defaults[key]) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  const next = `${url.pathname}${url.search}${url.hash}`
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
    window.history.replaceState(null, "", next)
  }
}

export function useQueryFields(defaults: Record<string, string>) {
  const search = useSyncExternalStore(subscribe, getSearch, emptySearch)
  const fromUrl = useMemo(() => applyParams(defaults, search), [defaults, search])
  const [local, setLocal] = useState<Record<string, string> | null>(null)
  const values = local ?? fromUrl

  useEffect(() => {
    if (!local) return
    writeParams(local, defaults)
  }, [local, defaults])

  const set = useCallback((key: string, value: string) => {
    setLocal((current) => ({ ...(current ?? fromUrl), [key]: value }))
  }, [fromUrl])

  const setAll = useCallback((patch: Record<string, string>) => {
    setLocal((current) => ({ ...(current ?? fromUrl), ...patch }))
  }, [fromUrl])

  const reset = useCallback(() => {
    setLocal(defaults)
  }, [defaults])

  const dirty = Object.keys(defaults).some((key) => (values[key] ?? "") !== defaults[key])

  return { values, set, setAll, reset, dirty }
}
