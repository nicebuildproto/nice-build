import type { ReactNode } from "react"

export function badNumber(value: string) {
  const trimmed = value.trim().replace(/,/g, "")
  if (!trimmed) return false
  return !Number.isFinite(Number(trimmed))
}

export const cellInput = "h-8 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-1"

export function DataLead({ hint, children }: { hint: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] leading-5 text-[var(--nb-primary)]">{hint}</p>
      {children}
    </div>
  )
}

export function DataError({ show }: { show: boolean }) {
  if (!show) return null
  return <p className="text-[13px] text-red-600">Enter a number.</p>
}
