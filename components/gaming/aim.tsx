"use client"

import {
  CopyReset,
  GameSelector,
  GamingToolShell,
  MetricCard,
  Note,
} from "@/components/gaming/kit"
import { NumberField, parseAmount, selectClass } from "@/components/tools/ui"
import { aspectPresets, fovFromScreen, fovPresets, fovTriple, horPlusFrom43 } from "@/lib/gaming/fov"
import { num } from "@/lib/tools/format"
import { cmPer360, convertSensitivity, edpi, sensitivityFromCm360, sensitivityGames } from "@/lib/tools/sensitivity"
import { useMemo, useState } from "react"

export function FovCalculator() {
  const [preset, setPreset] = useState("valorant")
  const [mode, setMode] = useState<"horizontal" | "vertical">("horizontal")
  const [fov, setFov] = useState("103")
  const [aspectId, setAspectId] = useState("16:9")
  const [customAspect, setCustomAspect] = useState("1.777")
  const [distance, setDistance] = useState("")
  const [width, setWidth] = useState("")
  const aspect = aspectId === "custom" ? parseAmount(customAspect) ?? 16 / 9 : aspectPresets.find((item) => item.id === aspectId)?.value ?? 16 / 9
  const input = parseAmount(fov)
  const triple = input === null || input <= 0 || input >= 179 ? null : fovTriple(input, mode, aspect)
  const fromScreen = useMemo(() => {
    const d = parseAmount(distance)
    const w = parseAmount(width)
    if (d === null || w === null) return null
    return fovFromScreen(d, w)
  }, [distance, width])
  const horPlus = horPlusFrom43(90, aspect)
  const sourceStyle = preset === "cs2" || preset === "source"

  function applyPreset(id: string) {
    const next = fovPresets.find((item) => item.id === id)
    if (!next) return
    setPreset(id)
    if ("horizontal" in next && next.horizontal) {
      setMode("horizontal")
      setFov(String(next.horizontal))
    } else if ("vertical" in next && next.vertical) {
      setMode("vertical")
      setFov(String(next.vertical))
    }
    const match = aspectPresets.find((item) => Math.abs(item.value - next.aspect) < 0.01)
    setAspectId(match?.id ?? "custom")
    setCustomAspect(String(Number(next.aspect.toFixed(3))))
  }

  return (
    <GamingToolShell>
      <Note>
        Horizontal FOV is left-to-right. Vertical is up-and-down. Diagonal is the corner-to-corner angle. Game chips use
        advertised values, not a photographed camera. CS2’s 90° is a 4:3 figure; Source games scale that with hor+.
      </Note>
      <GameSelector
        label="Game presets"
        games={fovPresets.map((item) => ({ id: item.id, name: item.label.split(" (")[0] }))}
        value={preset}
        onChange={applyPreset}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          You are typing
          <select className={selectClass} value={mode} onChange={(event) => setMode(event.target.value as "horizontal" | "vertical")}>
            <option value="horizontal">Horizontal FOV</option>
            <option value="vertical">Vertical FOV</option>
          </select>
        </label>
        <NumberField label="Degrees" value={fov} onChange={setFov} suffix="°" min={1} />
        <label className="flex flex-col gap-2 text-[13px]">
          Aspect ratio
          <select className={selectClass} value={aspectId} onChange={(event) => setAspectId(event.target.value)}>
            {aspectPresets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        {aspectId === "custom" ? <NumberField label="Width / height" value={customAspect} onChange={setCustomAspect} min={0.1} /> : null}
      </div>
      <div className="flex flex-wrap gap-10" aria-live="polite">
        <MetricCard label="Horizontal" value={triple ? `${num(triple.h, 1)}°` : "—"} />
        <MetricCard label="Vertical" value={triple ? `${num(triple.v, 1)}°` : "—"} />
        <MetricCard label="Diagonal" value={triple ? `${num(triple.d, 1)}°` : "—"} />
      </div>
      {sourceStyle ? (
        <Note>
          Advertised 90° is a 4:3 figure. Source hor+ keeps that vertical FOV: about {num(horPlusFrom43(90, 16 / 9), 1)}°
          horizontal on 16:9, and {num(horPlusFrom43(90, 21 / 9), 1)}° on 21:9. That is a community convention, not a
          photographed camera. Typing 90° as horizontal on 16:9 is a narrower view.
        </Note>
      ) : Math.abs(aspect - 4 / 3) > 0.01 ? (
        <MetricCard
          label="If this were Source hor+ from 90° 4:3"
          value={`${num(horPlus, 1)}° H`}
          note="Convention, not a second camera. Only applies to Source-style games."
        />
      ) : null}
      {triple ? <FovPreview horizontal={triple.h} aspect={aspect} /> : null}
      <div className="grid max-w-lg gap-4 sm:grid-cols-2">
        <NumberField label="Viewing distance (optional)" value={distance} onChange={setDistance} suffix="cm" min={0} />
        <NumberField label="Screen width (optional)" value={width} onChange={setWidth} suffix="cm" min={0} />
      </div>
      {fromScreen !== null ? (
        <Note>A screen that wide at that distance subtends about {num(fromScreen, 1)}° horizontally — the angle your eyes see, not the game’s FOV setting.</Note>
      ) : null}
      <CopyReset
        text={triple ? `HFOV ${num(triple.h, 1)}° · VFOV ${num(triple.v, 1)}° · DFOV ${num(triple.d, 1)}° · aspect ${num(aspect, 3)}` : ""}
        onReset={() => {
          setFov("103")
          setMode("horizontal")
          setAspectId("16:9")
          setPreset("valorant")
        }}
      />
    </GamingToolShell>
  )
}

function FovPreview({ horizontal, aspect }: { horizontal: number; aspect: number }) {
  const half = (horizontal * Math.PI) / 360
  const depth = 90
  const halfW = Math.tan(half) * depth
  const halfH = halfW / aspect
  const cx = 160
  const cy = 90
  return (
    <svg viewBox="0 0 320 180" className="h-40 w-full max-w-md rounded-xl border border-border bg-[var(--nb-accent)]/40" role="img" aria-label="Top-down wedge of horizontal FOV">
      <polygon
        points={`${cx - 8},${cy} ${cx + halfW},${cy - halfH} ${cx + halfW},${cy + halfH}`}
        fill="currentColor"
        className="text-[var(--nb-primary)]"
        opacity={0.12}
      />
      <line x1={cx - 8} y1={cy} x2={cx + halfW} y2={cy - halfH} stroke="currentColor" />
      <line x1={cx - 8} y1={cy} x2={cx + halfW} y2={cy + halfH} stroke="currentColor" />
      <rect x={cx + halfW - 4} y={cy - halfH} width={8} height={halfH * 2} rx={1} fill="currentColor" opacity={0.35} />
    </svg>
  )
}

export function SensitivityConverter() {
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
    return {
      edpi: edpi(dpiN, sensN),
      sourceCm,
      destSens,
      destCm: cmPer360(dpiN, destSens, dest.yaw),
      destEdpi: edpi(dpiN, destSens),
    }
  }, [dpiN, sensN, source, dest])

  return (
    <GamingToolShell>
      <Note>
        Matching cm/360 between these games is exact for the documented yaw, not a measured camera. Games without a
        reliable yaw are not listed. eDPI only compares when yaw is the same.
      </Note>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="DPI" value={dpi} onChange={setDpi} min={1} step="1" />
        <NumberField label="In-game sensitivity" value={sensitivity} onChange={setSensitivity} min={0} />
        <label className="flex flex-col gap-2 text-[13px]">
          From
          <select className={selectClass} value={from} onChange={(event) => setFrom(event.target.value)}>
            {sensitivityGames.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          To
          <select className={selectClass} value={to} onChange={(event) => setTo(event.target.value)}>
            {sensitivityGames.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <MetricCard
        label={`Use this in ${dest.name}`}
        value={result ? num(result.destSens, 3) : "—"}
        note={result ? `Keeps ${num(result.sourceCm, 2)} cm / 360° at ${dpi} DPI. Yaw ${source.yaw} → ${dest.yaw} (documented).` : "Enter DPI and sensitivity."}
      />
      <div className="flex flex-wrap gap-10">
        <MetricCard label={`${source.name} cm/360`} value={result ? num(result.sourceCm, 2) : "—"} />
        <MetricCard label={`${source.name} eDPI`} value={result ? num(result.edpi, 1) : "—"} note={source.yaw === dest.yaw ? "Same yaw, eDPI also matches." : "eDPI will not match — yaw differs."} />
      </div>
      <MatchFromCm dpi={dpiN} dest={dest} />
      <CopyReset
        text={
          result
            ? `${source.name} ${sensitivity} @ ${dpi} DPI → ${dest.name} ${num(result.destSens, 3)} · ${num(result.sourceCm, 2)} cm/360`
            : ""
        }
        onReset={() => {
          setDpi("800")
          setSensitivity("1.2")
          setFrom("cs2")
          setTo("valorant")
        }}
      />
    </GamingToolShell>
  )
}

function MatchFromCm({ dpi, dest }: { dpi: number | null; dest: (typeof sensitivityGames)[number] }) {
  const [cm, setCm] = useState("")
  const value = parseAmount(cm)
  const sens = dpi && value && value > 0 ? sensitivityFromCm360(dpi, value, dest.yaw) : null
  return (
    <div className="grid max-w-lg gap-4 sm:grid-cols-2">
      <NumberField label="Target cm / 360" value={cm} onChange={setCm} suffix="cm" min={0} />
      <MetricCard label={`${dest.name} from cm/360`} value={sens ? num(sens, 3) : "—"} />
    </div>
  )
}

export function EdpiCalculator() {
  const [dpi, setDpi] = useState("800")
  const [sensitivity, setSensitivity] = useState("0.4")
  const [gameId, setGameId] = useState("cs2")
  const game = sensitivityGames.find((item) => item.id === gameId) ?? sensitivityGames[0]
  const dpiN = parseAmount(dpi)
  const sensN = parseAmount(sensitivity)
  const result =
    dpiN && sensN && dpiN > 0 && sensN > 0
      ? { edpi: edpi(dpiN, sensN), cm: cmPer360(dpiN, sensN, game.yaw) }
      : null

  return (
    <GamingToolShell>
      <Note>
        eDPI is DPI × in-game sensitivity — a product, not a distance. cm/360 is the distance on the pad, using this
        game’s documented yaw. Use cm/360 to compare across games that do not share a yaw.
      </Note>
      <GameSelector label="Game (for yaw / cm/360)" games={sensitivityGames} value={gameId} onChange={setGameId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="DPI" value={dpi} onChange={setDpi} min={1} step="1" />
        <NumberField label="In-game sensitivity" value={sensitivity} onChange={setSensitivity} min={0} />
      </div>
      <MetricCard
        label="eDPI"
        value={result ? num(result.edpi, 1) : "—"}
        note={result ? `${dpi} × ${sensitivity}` : "Enter both values."}
      />
      <MetricCard
        label={`${game.name} cm / 360`}
        value={result ? num(result.cm, 2) : "—"}
        note={`Yaw ${game.yaw} (documented). Exact for that yaw.`}
      />
      <CopyReset
        text={result ? `eDPI ${num(result.edpi, 1)} · ${game.name} ${num(result.cm, 2)} cm/360 @ ${dpi} DPI, sens ${sensitivity}` : ""}
        onReset={() => {
          setDpi("800")
          setSensitivity("0.4")
          setGameId("cs2")
        }}
      />
    </GamingToolShell>
  )
}
