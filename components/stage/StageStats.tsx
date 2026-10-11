import { stageFloat } from "@/components/stage/chrome"

export type StageStat = {
  label: string
  value: string
}

export function StageStats({ stats }: { stats: StageStat[] }) {
  if (stats.length === 0) return null
  return (
    <div className="flex max-w-full gap-2 overflow-x-auto">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stageFloat} shrink-0 rounded-2xl px-3 py-1.5`}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">{stat.label}</p>
          <p className="text-[13px] font-semibold tracking-[-0.02em] text-foreground tabular-nums">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
