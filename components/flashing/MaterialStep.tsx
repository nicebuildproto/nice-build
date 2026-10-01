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
import { ProfileSection } from "./ProfileShape"

export function MaterialStep({
  points,
  material,
  onMaterialChange,
  colourId,
  onColourChange,
  side,
  onSideChange,
}: {
  points: Point[]
  material: MaterialId
  onMaterialChange: (value: MaterialId) => void
  colourId: string
  onColourChange: (value: string) => void
  side: ColourSide
  onSideChange: (value: ColourSide) => void
}) {
  const isColour = material === "colour"
  const colour = colourById(colourId)
  const face = isColour ? (colour?.hex ?? null) : null
  const back = isColour ? bareMetal : materialById(material).swatch

  return (
    <div className="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-4 p-8">
        <ProfileSection
          points={points}
          faceColour={face}
          backColour={back}
          colourSide={side}
          width={640}
          height={400}
          thickness={10}
          className="h-auto w-full max-w-2xl"
        />
        <p className="text-sm text-[var(--nb-secondary)]">
          {isColour && colour
            ? `${colour.label} · ${side === "out" ? "Colour facing out" : "Colour facing in"}`
            : materialById(material).label}
        </p>
      </div>

      <aside
        data-viewport-ignore
        className="flex w-full flex-col gap-8 overflow-y-auto border-t border-black/[0.06] p-6 lg:w-96 lg:border-t-0 lg:border-l"
      >
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-medium tracking-wide text-[var(--nb-secondary)] uppercase">
            Material
          </h3>
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
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-[var(--nb-primary)] bg-white"
                      : "border-black/[0.08] hover:border-black/20"
                  )}
                >
                  <span
                    className="size-7 shrink-0 rounded-full border border-black/10"
                    style={{
                      background:
                        option.id === "colour"
                          ? `conic-gradient(${colours.slice(0, 6).map((c) => c.hex).join(",")})`
                          : `linear-gradient(135deg, ${option.swatch}, #E5E7EB 55%, ${option.swatch})`,
                    }}
                  />
                  <span className="flex-1">
                    <span className="block text-sm text-[var(--nb-primary)]">{option.label}</span>
                    <span className="block text-xs text-[var(--nb-secondary)]">{option.description}</span>
                  </span>
                  {selected ? <Check className="size-4 text-[var(--nb-primary)]" /> : null}
                </button>
              )
            })}
          </div>
        </section>

        {isColour ? (
          <>
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-medium tracking-wide text-[var(--nb-secondary)] uppercase">
                  Colour
                </h3>
                <span className="text-xs text-[var(--nb-primary)]">{colour?.label}</span>
              </div>
              <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Colour">
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
                        "aspect-square rounded-full border border-black/10 ring-offset-2 transition-shadow",
                        selected ? "ring-2 ring-[var(--nb-primary)]" : "hover:ring-1 hover:ring-black/20"
                      )}
                      style={{ background: option.hex }}
                    />
                  )
                })}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-medium tracking-wide text-[var(--nb-secondary)] uppercase">
                Colour side
              </h3>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Colour side">
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
                        "flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors",
                        selected
                          ? "border-[var(--nb-primary)]"
                          : "border-black/[0.08] hover:border-black/20"
                      )}
                    >
                      <ProfileSection
                        points={points}
                        faceColour={colour?.hex ?? null}
                        backColour={bareMetal}
                        colourSide={option}
                        width={160}
                        height={96}
                        thickness={7}
                        className="h-auto w-full"
                      />
                      <span className="text-xs text-[var(--nb-primary)]">
                        {option === "out" ? "Colour facing out" : "Colour facing in"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        ) : null}
      </aside>
    </div>
  )
}
