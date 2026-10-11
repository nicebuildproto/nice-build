"use client"

import { createContext, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

export type StageMode = "desktop" | "tablet" | "phone"
export type SheetSnap = "peek" | "half" | "full"
export type StagePoint = { x: number; y: number }

export type StageSafeArea = {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

export const StageZoomContext = createContext(1)

const STORAGE = "nb-stage"
const TOOLBAR = 44
const TAB = 40
const INSET = 16

function readStored(toolId: string, panel: "data" | "style"): boolean | null {
  try {
    const value = localStorage.getItem(`${STORAGE}:${toolId}:${panel}`)
    if (value === "1") return true
    if (value === "0") return false
  } catch {
    return null
  }
  return null
}

function writeStored(toolId: string, panel: "data" | "style", open: boolean) {
  try {
    localStorage.setItem(`${STORAGE}:${toolId}:${panel}`, open ? "1" : "0")
  } catch {
    /* layout still works when storage is unavailable */
  }
}

export function stageMode(width: number): StageMode {
  if (width >= 1280) return "desktop"
  if (width >= 1024) return "tablet"
  return "phone"
}

export function clampStageZoom(value: number) {
  return Math.min(2.5, Math.max(0.4, Math.round(value * 100) / 100))
}

function subscribeMode(onChange: () => void) {
  window.addEventListener("resize", onChange)
  return () => window.removeEventListener("resize", onChange)
}

export function useStageLayout(
  toolId: string,
  topInset = 16,
  options?: {
    dataOpen?: boolean
    header?: boolean
    hasLeft?: boolean
    /** Extra space on the left for a tool-owned rail. Ignored on phone. Data visualisation leaves this unset. */
    leftGutter?: number
    /** Keep the right span open. Data visualisation leaves this unset. */
    lockRight?: boolean
    /** Override the right span width. Data visualisation leaves this unset. */
    rightWidth?: number
    /** Skip the phone sheet and reserve this many pixels at the bottom instead. */
    hideSheet?: boolean
    /** Extra bottom inset. Data visualisation leaves this unset. */
    bottomReserve?: number
  }
) {
  const stageRef = useRef<HTMLDivElement>(null)
  const mode = useSyncExternalStore(subscribeMode, () => stageMode(window.innerWidth), () => "desktop" as StageMode)
  const [overrides, setOverrides] = useState<{ left: boolean | null; right: boolean | null }>({ left: null, right: null })
  const [grid, setGrid] = useState(true)
  const [zoom, setZoomState] = useState(1)
  const [pan, setPan] = useState<StagePoint>({ x: 0, y: 0 })
  const [panOn, setPanOn] = useState(false)
  const [sheet, setSheet] = useState<SheetSnap>("peek")
  const [sheetTab, setSheetTab] = useState<"data" | "style">("data")
  const showHeader = options?.header !== false
  const hasLeft = options?.hasLeft !== false
  const [headerHeight, setHeaderHeight] = useState(showHeader ? 44 : 0)
  const [stageSize, setStageSize] = useState({ width: 1440, height: 800 })

  useEffect(() => {
    setOverrides({ left: readStored(toolId, "data"), right: readStored(toolId, "style") })
  }, [toolId])

  const dataOpen = options?.dataOpen ?? true
  const leftOpen = overrides.left ?? dataOpen
  const rightOpen = options?.lockRight ? true : (overrides.right ?? mode === "desktop")

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      setStageSize({ width: box.width, height: box.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const toggleLeft = useCallback(() => {
    setOverrides((current) => {
      const next = !(current.left ?? dataOpen)
      writeStored(toolId, "data", next)
      return { ...current, left: next }
    })
  }, [dataOpen, toolId])

  const toggleRight = useCallback(() => {
    setOverrides((current) => {
      const next = !(current.right ?? mode === "desktop")
      writeStored(toolId, "style", next)
      return { ...current, right: next }
    })
  }, [mode, toolId])

  const setZoom = useCallback((value: number | ((current: number) => number)) => {
    setZoomState((current) => clampStageZoom(typeof value === "function" ? value(current) : value))
  }, [])

  const leftWidth = mode === "tablet" ? 320 : 360
  const rightWidth = options?.rightWidth ?? (mode === "tablet" ? 280 : 300)
  const phone = mode === "phone"
  const leftSpan = !hasLeft || phone ? 0 : leftOpen ? leftWidth : TAB
  const rightSpan = phone ? 0 : rightOpen ? rightWidth : TAB
  const sheetHeight =
    sheet === "peek" ? 64 : sheet === "half" ? Math.round(stageSize.height * 0.5) : Math.round(stageSize.height * 0.85)

  const safe: StageSafeArea = {
    top: topInset + (showHeader ? headerHeight + 8 : 0),
    left: phone ? INSET : INSET + leftSpan + 12 + (options?.leftGutter ?? 0),
    right: phone ? INSET + TOOLBAR + 12 : INSET + rightSpan + 8 + TOOLBAR + 12,
    bottom: phone
      ? options?.hideSheet
        ? Math.max(INSET, options.bottomReserve ?? 0)
        : sheetHeight
      : INSET + (options?.bottomReserve ?? 0),
    width: 0,
    height: 0,
  }
  safe.width = Math.max(0, stageSize.width - safe.left - safe.right)
  safe.height = Math.max(0, stageSize.height - safe.top - safe.bottom)

  const fit = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setPanOn(false)
  }, [setZoom])

  return {
    stageRef,
    mode,
    leftOpen,
    rightOpen,
    toggleLeft,
    toggleRight,
    leftWidth,
    rightWidth,
    leftSpan,
    rightSpan,
    grid,
    setGrid,
    zoom,
    setZoom,
    pan,
    setPan,
    panOn,
    setPanOn,
    fit,
    sheet,
    setSheet,
    sheetTab,
    setSheetTab,
    sheetHeight,
    headerHeight,
    setHeaderHeight,
    safe,
    showHow: mode === "desktop" && safe.width >= 220,
    stageSize,
  }
}
