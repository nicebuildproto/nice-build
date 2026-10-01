import { GIRTH_WARNING_MM, MAX_GIRTH_MM } from "@/lib/flashing/geometry"
import { cn } from "@/lib/utils"

export function girthStatus(girthMm: number): "ok" | "near" | "over" {
  if (girthMm > MAX_GIRTH_MM) return "over"
  if (girthMm >= GIRTH_WARNING_MM) return "near"
  return "ok"
}

export function GirthReadout({ girthMm, className }: { girthMm: number; className?: string }) {
  const status = girthStatus(girthMm)
  return (
    <div
      className={cn(
        "flex items-baseline gap-1.5 tabular-nums transition-colors",
        status === "ok" && "text-[var(--nb-primary)]",
        status === "near" && "text-amber-600",
        status === "over" && "text-red-600",
        className
      )}
      title="The flat width of metal before folding, sometimes called girth."
    >
      <span className="font-medium">{Math.round(girthMm)} mm</span>
      {status !== "ok" ? (
        <span className="text-xs">
          {status === "over" ? `over the ${MAX_GIRTH_MM} mm limit` : `of ${MAX_GIRTH_MM} mm max`}
        </span>
      ) : null}
    </div>
  )
}
