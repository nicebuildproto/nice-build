"use client"

import type { Point } from "@/lib/flashing/geometry"
import {
  bareMetal,
  colourById,
  colours,
  materialById,
  materials,
  type ColourSide,
  type MaterialId,
} from "@/lib/flashing/pricing"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { flashingLabel } from "./chrome"
import { ProfileSection } from "./ProfileShape"

export const sideLabel = (side: ColourSide) => (side === "out" ? "Colour facing out" : "Colour facing in")

/** The finished section on the canvas. Uses the same mapping as the picker diagrams. */
export function MaterialPreview({
  points,
  material,
  colourId,
  side,
}: {
  points: Point[]
  material: MaterialId
  colourId: string
  side: ColourSide
}) {
  const isColour = material === "colour"
  const colour = colourById(colourId)
  const face = isColour ? (colour?.hex ?? null) : null
  const back = isColour ? bareMetal : materialById(material).swatch
  return (
    <div className="flex h-full w-full min-h-0 flex-col items-center justify-center gap-4">
      <div className="min-h-0 w-full max-w-3xl flex-1">
        <ProfileSection
          points={points}
          faceColour={face}
          backColour={back}
          colourSide={side}
          width={640}
          height={400}
          thickness={14}
          className="h-full w-full"
        />
      </div>
      <p className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
        {isColour && colour ? `${colour.label} · ${sideLabel(side)}` : materialById(material).label}
      </p>
    </div>
  )
}

type Variant = "sidebar" | "sheet"

export function MaterialControls({
  points,
  material,
  onMaterialChange,
  colourId,
  onColourChange,
  side,
  onSideChange,
  variant = "sidebar",
}: {
  points: Point[]
  material: MaterialId
  onMaterialChange: (value: MaterialId) => void
  colourId: string
  onColourChange: (value: string) => void
  side: ColourSide
  onSideChange: (value: ColourSide) => void
  variant?: Variant
}) {
  const isColour = material === "colour"
  const colour = colourById(colourId)
  const touch = variant === "sheet"

  return (
    <div className="flex flex-col divide-y divide-border">
      <section className="flex flex-col gap-3 pb-4">
        <h3 className={flashingLabel}>Material</h3>
        {touch ? (
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Material">
            {materials.map((option) => {
              const selected = option.id === material
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onMaterialChange(option.id)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-lg px-1 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected ? "bg-card font-medium shadow-sm ring-1 ring-border" : "text-muted-foreground active:bg-card/60"
                  )}
                >
                  {option.label.replace(" steel", "")}
                </button>
              )
            })}
          </div>
        ) : (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Material">
          {materials.map((option) => {
            const selected = option.id === material
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onMaterialChange(option.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  touch ? "min-h-14" : "min-h-12",
                  selected ? "border-foreground bg-muted" : "border-border hover:border-foreground/30 hover:bg-muted/60"
                )}
              >
                <span
                  className="size-7 shrink-0 rounded-full border border-border"
                  aria-hidden
                  style={{
                    background:
                      option.id === "colour"
                        ? `conic-gradient(${colours.slice(0, 6).map((c) => c.hex).join(",")})`
                        : `linear-gradient(135deg, ${option.swatch}, ${bareMetal} 55%, ${option.swatch})`,
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
                {selected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
              </button>
            )
          })}
        </div>
        )}
      </section>

      {isColour ? (
        <>
          <section className="flex flex-col gap-3 py-4">
            <h3 className={flashingLabel}>Colour facing</h3>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Colour facing">
              {(["out", "in"] as const).map((option) => {
                const selected = option === side
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSideChange(option)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      touch ? "min-h-24" : "min-h-20",
                      selected ? "bg-card shadow-sm ring-1 ring-border" : "hover:bg-card/60"
                    )}
                  >
                    <ProfileSection
                      points={points}
                      faceColour={colour?.hex ?? null}
                      backColour={bareMetal}
                      colourSide={option}
                      width={120}
                      height={80}
                      thickness={6}
                      className="h-auto w-full max-w-[120px]"
                    />
                    <span className={cn("text-xs", selected ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {sideLabel(option)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
          <section className="flex flex-col gap-3 pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className={flashingLabel}>COLORBOND® colour</h3>
            </div>
            <p className="flex items-baseline gap-2 text-sm" aria-live="polite">
              <span className="font-medium">{colour?.label ?? "Choose a colour"}</span>
              {colour?.sheen === "matt" ? <span className="text-xs text-muted-foreground">Matt</span> : null}
            </p>
            <div
              className={cn("grid", touch ? "grid-cols-5 gap-2" : "grid-cols-3 gap-x-2 gap-y-3")}
              role="radiogroup"
              aria-label="COLORBOND colour"
            >
              {colours.map((option) => {
                const selected = option.id === colourId
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={option.label}
                    title={option.label}
                    onClick={() => onColourChange(option.id)}
                    className={cn(
                      "group flex min-w-0 flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      touch && "items-stretch"
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex w-full items-center justify-center rounded-lg border border-border transition-shadow",
                        touch ? "h-12" : "h-10",
                        selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : "group-hover:ring-1 group-hover:ring-foreground/30"
                      )}
                      style={{ background: option.hex }}
                    >
                      {selected ? (
                        <span className="flex size-5 items-center justify-center rounded-full border border-border bg-card text-foreground">
                          <Check className="size-3" aria-hidden />
                        </span>
                      ) : null}
                    </span>
                    {touch ? null : (
                      <span className="w-full text-center text-xs leading-tight text-muted-foreground group-aria-checked:text-foreground">
                        {option.label.replace("®", "")}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              COLORBOND® is a registered trademark of BlueScope Steel Limited.
            </p>
          </section>

        </>
      ) : null}
    </div>
  )
}
