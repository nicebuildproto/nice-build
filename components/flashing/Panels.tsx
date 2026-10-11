"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { isEndpoint } from "@/lib/flashing/editor"
import { distance, segmentAngle } from "@/lib/flashing/geometry"
import { templates } from "@/lib/flashing/templates"
import { cn } from "@/lib/utils"
import { Download, RotateCcw, RotateCw, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { flashingLabel } from "./chrome"
import { MaterialControls } from "./MaterialStep"
import type { FlashingModel } from "./model"
import { NumberField } from "./NumberField"
import type { EditStepId } from "./Onboarding"
import { ProfileIcon } from "./ProfileShape"
import { downloadDrawing } from "./TechnicalDrawing"
import { TaperLegend } from "./TaperStep"

export const stepMeta: Record<EditStepId, { title: string; hint: string }> = {
  design: { title: "Profile", hint: "Draw your profile, or start from a template." },
  taper: { title: "Taper", hint: "Does one end of the flashing need to be narrower?" },
  align: { title: "Align", hint: "Choose which edge stays square." },
  material: { title: "Material", hint: "Pick the metal and the finish." },
  review: { title: "Review", hint: "Check everything, then order." },
}

export function PanelSection({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-3 py-4", className)}>
      {title ? (
        <div className="flex flex-col gap-1">
          <h3 className={flashingLabel}>{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

/** Length and angle for the selected line, or the point actions. Touch screens use the dock instead. */
export function SelectedSection({ m }: { m: FlashingModel }) {
  const selection = m.editor.selection
  const { points, dispatch } = m

  if (selection?.kind === "segment" && selection.index < points.length - 1) {
    const i = selection.index
    const first = i === 0
    return (
      <PanelSection title="Selected line" description="Arrow keys step by 1, Shift + arrow by 10.">
        <NumberField
          label="Length"
          unit="mm"
          decimals={1}
          min={1}
          max={2000}
          value={distance(points[i], points[i + 1])}
          onCommit={(lengthMm) => dispatch({ type: "setLength", index: i, lengthMm })}
        />
        <NumberField
          label={first ? "Angle from level" : "Fold angle"}
          unit="°"
          min={first ? -180 : 0}
          max={180}
          value={segmentAngle(points, i)}
          onCommit={(angleDeg) => dispatch({ type: "setAngle", index: i, angleDeg })}
        />
        <Button type="button" variant="destructive" className="h-10 w-full" onClick={() => dispatch({ type: "deleteSelection" })}>
          <Trash2 /> Delete line
        </Button>
      </PanelSection>
    )
  }

  if (selection?.kind === "point" && selection.index < points.length) {
    const end = isEndpoint(points, selection.index) !== null && points.length > 1
    return (
      <PanelSection title="Selected point" description={end ? "This end is where the next line will grow from." : "Drag it on the drawing to move it."}>
        <Button type="button" variant="destructive" className="h-10 w-full" onClick={() => dispatch({ type: "deleteSelection" })}>
          <Trash2 /> Delete point
        </Button>
      </PanelSection>
    )
  }

  return (
    <PanelSection>
      <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        Select a line to edit its length and angle.
      </p>
    </PanelSection>
  )
}

export function TemplatesSection({ m, onPicked }: { m: FlashingModel; onPicked?: () => void }) {
  return (
    <PanelSection title="Templates" description="Replaces the current shape. You can undo this.">
      <div className="grid grid-cols-2 gap-2">
        {templates.map((template) => {
          const current = m.templateId === template.id
          return (
            <button
              key={template.id}
              type="button"
              aria-pressed={current}
              onClick={() => {
                m.onLoadTemplate(template.id)
                onPicked?.()
              }}
              className={cn(
                "flex min-h-24 flex-col items-center justify-between gap-1.5 rounded-lg border p-2 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                current ? "border-foreground bg-muted" : "border-border hover:border-foreground/30 hover:bg-muted/60"
              )}
            >
              <ProfileIcon points={template.points} className="h-12 w-full text-foreground" />
              <span className="text-xs leading-tight font-medium">{template.name}</span>
            </button>
          )
        })}
      </div>
    </PanelSection>
  )
}

export function RotateControl({ m, size = "md" }: { m: FlashingModel; size?: "md" | "lg" }) {
  const height = size === "lg" ? "h-12" : "h-10"
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Rotate design</span>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border" role="group" aria-label="Rotate design">
        <button
          type="button"
          disabled={!m.canRotate}
          onClick={() => m.onRotate(-90)}
          className={cn("flex items-center justify-center gap-2 bg-card text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted disabled:pointer-events-none disabled:opacity-50", height)}
        >
          <RotateCcw className="size-4" aria-hidden /> 90° left
        </button>
        <button
          type="button"
          disabled={!m.canRotate}
          onClick={() => m.onRotate(90)}
          className={cn("flex items-center justify-center gap-2 bg-card text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted disabled:pointer-events-none disabled:opacity-50", height)}
        >
          <RotateCw className="size-4" aria-hidden /> 90° right
        </button>
      </div>
    </div>
  )
}

export function OptionsSection({ m, size = "md" }: { m: FlashingModel; size?: "md" | "lg" }) {
  return (
    <PanelSection title="Options">
      <SettingRow
        label="Snap to 5 mm"
        description="Points land on a 5 mm grid as you draw."
        checked={m.snap}
        onChange={m.onSnapChange}
      />
      <SettingRow
        label="Show dimensions"
        description="Lengths and fold angles on the drawing."
        checked={m.showDims}
        onChange={m.onShowDimsChange}
      />
      <RotateControl m={m} size={size} />
    </PanelSection>
  )
}

export function ClearButton({ m, size = "md" }: { m: FlashingModel; size?: "md" | "lg" }) {
  return (
    <PanelSection className="py-3">
      <Button
        type="button"
        variant="ghost"
        disabled={m.points.length === 0}
        className={cn("w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive", size === "lg" ? "h-12" : "h-10")}
        onClick={m.onClear}
      >
        <Trash2 /> Clear the canvas
      </Button>
    </PanelSection>
  )
}

export function TaperPanel({ m }: { m: FlashingModel }) {
  const changed = m.taperLengths.filter(
    (length, i) => length != null && m.points[i + 1] && Math.abs(length - distance(m.points[i], m.points[i + 1])) > 0.5
  ).length
  return (
    <>
      <PanelSection>
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <Switch checked={m.taperEnabled} onCheckedChange={m.onTaperEnabled} className="mt-1" />
          <span className="min-w-0">
            <span className="block text-sm font-medium">This flashing has a tapered edge</span>
            <span className="block text-xs text-muted-foreground">
              {m.taperEnabled
                ? "Select a length on the drawing to set its size at the tapered end. Angles stay as designed."
                : "Most flashings are the same width end to end. Skip this if yours is."}
            </span>
          </span>
        </label>
      </PanelSection>
      {m.taperEnabled ? (
        <PanelSection title="Taper">
          <p className="text-sm tabular-nums" aria-live="polite">
            {changed === 0 ? "No lengths tapered yet." : `${changed} of ${Math.max(0, m.points.length - 1)} lengths tapered.`}
          </p>
          <TaperLegend />
        </PanelSection>
      ) : null}
    </>
  )
}

export function AlignPanel({ m }: { m: FlashingModel }) {
  return (
    <PanelSection>
      <p className="text-sm font-medium" aria-live="polite">
        {!m.taperEnabled
          ? "Nothing to align"
          : m.anchorIsOverride
            ? "Square edge set by you"
            : "Square edge found automatically"}
      </p>
      <p className="text-xs text-muted-foreground">
        {m.taperEnabled
          ? "The marked point keeps a square edge and the taper runs away from it. Select another point on the drawing to change it."
          : "Without a taper, every edge is already square. You can continue."}
      </p>
      {m.taperEnabled ? <TaperLegend /> : null}
      {m.taperEnabled && m.anchorIsOverride ? (
        <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => m.onAnchorChange(null)}>
          Use automatic
        </Button>
      ) : null}
    </PanelSection>
  )
}

export function ReviewRows({ m }: { m: FlashingModel }) {
  const { review } = m
  const rows: { label: string; value: string; edit?: Parameters<FlashingModel["review"]["onEdit"]>[0]; mono?: boolean }[] = [
    { label: "Profile", value: m.profileName, edit: "design" },
    { label: "Girth", value: `${Math.round(m.price.girthMm).toLocaleString("en-AU")} mm`, edit: "design" },
    { label: "Folds", value: `${m.folds}${m.taperEnabled ? " · tapered" : ""}`, edit: "design" },
    { label: "Length", value: `${m.pieceLengthMm.toLocaleString("en-AU")} mm`, edit: "length" },
    { label: "Quantity", value: String(m.quantity), edit: "length" },
    { label: "Material", value: m.materialLabel, edit: "material" },
    { label: "Colour", value: review.colourLabel, edit: "material" },
    { label: "Item code", value: review.info.itemCode, mono: true },
  ]
  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="flex min-h-12 items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className={cn("text-sm break-words", row.mono && "font-mono text-xs leading-5")}>{row.value}</dd>
          </div>
          {row.edit ? (
            <button
              type="button"
              aria-label={`Edit ${row.label}`}
              onClick={() => review.onEdit(row.edit!)}
              className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Edit
            </button>
          ) : null}
        </div>
      ))}
    </dl>
  )
}

export function ReviewPanel({ m }: { m: FlashingModel }) {
  return (
    <>
      <PanelSection title="Check your order">
        <ReviewRows m={m} />
      </PanelSection>
      <PanelSection className="py-3">
        <Button type="button" variant="outline" className="h-10 w-full" onClick={() => downloadDrawing()}>
          <Download /> Download drawing
        </Button>
      </PanelSection>
    </>
  )
}

/** The desktop sidebar body for the current step. */
export function StepControls({ m }: { m: FlashingModel }) {
  switch (m.currentStep) {
    case "design":
      return (
        <>
          <SelectedSection m={m} />
          <TemplatesSection m={m} />
          <OptionsSection m={m} />
          <ClearButton m={m} />
        </>
      )
    case "taper":
      return <TaperPanel m={m} />
    case "align":
      return <AlignPanel m={m} />
    case "material":
      return (
        <PanelSection>
          <MaterialControls
            points={m.points}
            material={m.material}
            onMaterialChange={m.onMaterialChange}
            colourId={m.colourId}
            onColourChange={m.onColourChange}
            side={m.side}
            onSideChange={m.onSideChange}
          />
        </PanelSection>
      )
    case "review":
      return <ReviewPanel m={m} />
  }
}
