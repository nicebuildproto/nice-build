"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { copyPng, downloadBlob, downloadText, serializeSvg, svgToPngBlob } from "@/lib/viz/export"
import { ChevronDown } from "lucide-react"
import { useState, type RefObject } from "react"

export function ExportMenu({
  svgRef,
  filename,
  csv,
}: {
  svgRef: RefObject<SVGSVGElement | null>
  filename: string
  csv?: string
}) {
  const [note, setNote] = useState<string | null>(null)

  async function png() {
    if (!svgRef.current) return
    const blob = await svgToPngBlob(svgRef.current, 2)
    downloadBlob(`${filename}.png`, blob)
  }

  function svg() {
    if (!svgRef.current) return
    downloadText(`${filename}.svg`, serializeSvg(svgRef.current), "image/svg+xml")
  }

  async function copy() {
    if (!svgRef.current) return
    const ok = await copyPng(svgRef.current, 2)
    setNote(ok ? "Image copied." : "Downloaded instead — this browser can’t copy images.")
    window.setTimeout(() => setNote(null), 2400)
  }

  async function share() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setNote("Link copied.")
    } catch {
      setNote(url)
    }
    window.setTimeout(() => setNote(null), 2400)
  }

  function data() {
    if (!csv) return
    downloadText(`${filename}.csv`, csv, "text/csv")
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" />}>
          Export
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={png}>PNG</DropdownMenuItem>
          <DropdownMenuItem onClick={svg}>SVG</DropdownMenuItem>
          <DropdownMenuItem onClick={copy}>Copy image</DropdownMenuItem>
          {csv ? <DropdownMenuItem onClick={data}>Download data</DropdownMenuItem> : null}
          <DropdownMenuItem onClick={share}>Copy link</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {note ? <span className="text-[12px] text-[var(--nb-secondary)]">{note}</span> : null}
    </div>
  )
}
