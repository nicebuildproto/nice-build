"use client"

import { CopyButton, NumberField, ResetButton, Stat, ToolNote, parseAmount, selectClass } from "@/components/tools/ui"
import { num } from "@/lib/tools/format"
import { cmPer360, convertSensitivity, edpi, sensitivityFromCm360, sensitivityGames } from "@/lib/tools/sensitivity"
import { useMemo, useState } from "react"

export function GamingSensitivityCalculator() {
  const [dpi, setDpi] = useState("800")
  const [sensitivity, setSensitivity] = useState("1.2")
  const [from, setFrom] = useState("cs2")
  const [to, setTo] = useState("valorant")
  const source = sensitivityGames.find((game) => game.id === from) ?? sensitivityGames[0]
  const dest = sensitivityGames.find((game) => game.id === to) ?? sensitivityGames[4]
  const dpiN = parseAmount(dpi)
  const sensN = parseAmount(sensitivity)
  const result = useMemo(() => {
    if (dpiN === null || sensN === null || dpiN <= 0 || sensN <= 0) return null
    const sourceCm = cmPer360(dpiN, sensN, source.yaw)
    const destSens = convertSensitivity(sensN, source.yaw, dest.yaw)
    const destCm = cmPer360(dpiN, destSens, dest.yaw)
    return {
      edpi: edpi(dpiN, sensN),
      sourceCm,
      destSens,
      destCm,
      destEdpi: edpi(dpiN, destSens),
    }
  }, [dpiN, sensN, source, dest])

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>
        eDPI is DPI × in-game sensitivity. Conversion between games uses each game’s documented yaw so cm/360 stays the same. Games without a reliable yaw are not listed.
      </ToolNote>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="DPI" value={dpi} onChange={setDpi} min={1} step="1" />
        <NumberField label="In-game sensitivity" value={sensitivity} onChange={setSensitivity} min={0} />
        <label className="flex flex-col gap-2 text-[13px]">
          From
          <select className={selectClass} value={from} onChange={(event) => setFrom(event.target.value)}>
            {sensitivityGames.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name} (yaw {game.yaw})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          To
          <select className={selectClass} value={to} onChange={(event) => setTo(event.target.value)}>
            {sensitivityGames.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name} (yaw {game.yaw})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-10" aria-live="polite">
        <Stat label="eDPI" value={result ? num(result.edpi, 1) : "—"} />
        <Stat label="cm / 360" value={result ? num(result.sourceCm, 2) : "—"} />
        <Stat label={`${dest.name} sens`} value={result ? num(result.destSens, 3) : "—"} />
      </div>
      {result ? (
        <p className="max-w-xl text-sm text-[var(--nb-secondary)]">
          At {dpi} DPI, {source.name} {sensitivity} is about {num(result.sourceCm, 2)} cm per 360°. Matching that feel in {dest.name} is {num(result.destSens, 3)}
          {from === to ? " — same game, same yaw." : "."} The destination eDPI is {num(result.destEdpi, 1)}, which only matches if both games share a yaw.
        </p>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Enter DPI and sensitivity.</p>
      )}
      <MatchFromCm dpi={dpiN} dest={dest} />
      <div className="flex flex-wrap gap-2">
        {result ? (
          <CopyButton
            text={`eDPI ${num(result.edpi, 1)}\n${source.name} cm/360 ${num(result.sourceCm, 2)}\n${dest.name} sensitivity ${num(result.destSens, 3)}`}
            label="Copy result"
          />
        ) : null}
        <ResetButton
          onClick={() => {
            setDpi("")
            setSensitivity("")
          }}
        />
      </div>
    </div>
  )
}

function MatchFromCm({ dpi, dest }: { dpi: number | null; dest: (typeof sensitivityGames)[number] }) {
  const [cm, setCm] = useState("")
  const value = parseAmount(cm)
  const sens = dpi && value && value > 0 ? sensitivityFromCm360(dpi, value, dest.yaw) : null
  return (
    <div className="grid max-w-lg gap-4 sm:grid-cols-2">
      <NumberField label="Target cm / 360" value={cm} onChange={setCm} suffix="cm" min={0} />
      <div>
        <div className="text-xs font-medium text-[var(--nb-secondary)]">{dest.name} from cm/360</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{sens ? num(sens, 3) : "—"}</div>
      </div>
    </div>
  )
}
