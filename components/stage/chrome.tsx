"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { StageSafeArea } from "@/components/stage/useStageLayout"

export const StageInsetContext = createContext<StageSafeArea>({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
})

export { stageControl, stageFloat, stageHeaderOffset } from "@/components/stage/tokens"

export const StageBackContext = createContext<string | null>(null)

export function StageBackProvider({ href, children }: { href: string; children: ReactNode }) {
  return <StageBackContext.Provider value={href}>{children}</StageBackContext.Provider>
}

export function useStageBack() {
  return useContext(StageBackContext)
}
