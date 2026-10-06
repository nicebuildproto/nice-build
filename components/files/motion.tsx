"use client"

import {
  ActionBar,
  FileDropzone,
  FileToolShell,
  IssueList,
  PreviewFrame,
  PrivacyNote,
  ResultStats,
  Section,
  StatusLine,
  uid,
} from "@/components/files/kit"
import { Button } from "@/components/ui/button"
import { NumberField, ResetButton } from "@/components/tools/ui"
import { formatBytes, withSuffix } from "@/lib/files/format"
import { downloadBlob } from "@/lib/tools/download"
import { canvasToBlob, loadImageFile } from "@/lib/tools/image"
import { clampRange, encodeWav } from "@/lib/tools/wav"
import { GIFEncoder, applyPalette, quantize } from "gifenc"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

type Frame = { id: string; url: string; file?: File; bitmap?: ImageBitmap }

export function GifMaker() {
  const [frames, setFrames] = useState<Frame[]>([])
  const [delay, setDelay] = useState("120")
  const [preview, setPreview] = useState<string | null>(null)
  const [previewBytes, setPreviewBytes] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sourceName, setSourceName] = useState("animation")

  async function addFiles(files: File[]) {
    setError(null)
    try {
      const next: Frame[] = []
      for (const file of files) {
        if (file.type.startsWith("video/")) {
          setSourceName(file.name)
          const sampled = await framesFromVideo(file)
          next.push(...sampled)
        } else if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
          setSourceName(file.name)
          const image = await loadImageFile(file)
          const url = URL.createObjectURL(file)
          next.push({ id: uid(), url, file, bitmap: await createImageBitmap(image) })
        } else {
          throw new Error(`${file.name} isn’t an image or a video this browser can read.`)
        }
      }
      setFrames((current) => [...current, ...next].slice(0, 80))
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read those files.")
    }
  }

  async function generate() {
    if (!frames.length) {
      setError("Add at least one frame.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const ms = Math.max(20, Number(delay) || 120)
      const blob = await encodeGif(frames, ms)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(URL.createObjectURL(blob))
      setPreviewBytes(blob.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build that GIF.")
    } finally {
      setBusy(false)
    }
  }

  const downloadName = withSuffix(sourceName, "", "gif")

  return (
    <FileToolShell>
      <PrivacyNote>Your files stay on your device. Frames are encoded here as a GIF — up to 80 frames, scaled to 480px on the long edge.</PrivacyNote>
      <Section title="Frames" hint="Drop images, or a short video to sample. Reorder before generating.">
        <FileDropzone
          accept="image/*,video/mp4,video/webm,video/quicktime,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov"
          acceptLabel="Images or a short video"
          multiple
          idle="Drop images or a short video"
          maxBytes={40 * 1024 * 1024}
          onFiles={(files) => void addFiles(files)}
        />
      </Section>
      {frames.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {frames.map((frame, index) => (
            <li key={frame.id} className="relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.url} alt={`Frame ${index + 1}`} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                <button type="button" className="text-white" aria-label="Move earlier" onClick={() => setFrames((current) => move(current, index, -1))}>
                  <ArrowUp className="size-3.5" />
                </button>
                <button type="button" className="text-white" aria-label="Move later" onClick={() => setFrames((current) => move(current, index, 1))}>
                  <ArrowDown className="size-3.5" />
                </button>
                <button type="button" className="text-white" aria-label="Remove" onClick={() => setFrames((current) => current.filter((item) => item.id !== frame.id))}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">No frames yet.</p>
      )}
      <div className="max-w-xs">
        <NumberField label="Frame delay" value={delay} onChange={setDelay} suffix="ms" min={20} step="10" />
      </div>
      <IssueList issues={error ? [error] : []} />
      <StatusLine status={busy ? "processing" : preview ? "complete" : "idle"}>
        {busy ? "Building GIF…" : preview ? `Ready · ${formatBytes(previewBytes)}` : frames.length ? `${frames.length} frame${frames.length === 1 ? "" : "s"}` : null}
      </StatusLine>
      <ActionBar>
        <Button type="button" className="h-10" disabled={busy || !frames.length} onClick={() => void generate()}>
          {busy ? "Building GIF…" : "Generate GIF"}
        </Button>
        {preview ? (
          <Button type="button" variant="outline" className="h-10" onClick={async () => downloadBlob(await (await fetch(preview)).blob(), downloadName)}>
            Download GIF
          </Button>
        ) : null}
        <ResetButton
          onClick={() => {
            frames.forEach((frame) => URL.revokeObjectURL(frame.url))
            if (preview) URL.revokeObjectURL(preview)
            setFrames([])
            setPreview(null)
            setError(null)
          }}
        />
      </ActionBar>
      {preview ? (
        <PreviewFrame className="w-fit max-w-full" label="GIF preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="GIF preview" className="max-h-80 w-auto" />
        </PreviewFrame>
      ) : null}
    </FileToolShell>
  )
}

export function VideoTrimmer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [name, setName] = useState("clip-trim.webm")
  const [fileSize, setFileSize] = useState(0)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultBytes, setResultBytes] = useState(0)

  function onFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Choose a video file this browser can play.")
      return
    }
    if (url) URL.revokeObjectURL(url)
    if (result) URL.revokeObjectURL(result)
    const next = URL.createObjectURL(file)
    setUrl(next)
    setFileSize(file.size)
    setName(withSuffix(file.name, "-trim", "webm"))
    setError(null)
    setResult(null)
  }

  const clip = Math.max(0, end - start)

  return (
    <FileToolShell>
      <PrivacyNote>Your files stay on your device. The download is a WebM re-encode from this browser’s recorder — not a bit-for-bit copy of the original codec.</PrivacyNote>
      <Section title="Video">
        <FileDropzone accept="video/*" acceptLabel="Video" idle="Drop a video here, or browse" maxBytes={80 * 1024 * 1024} onFiles={(files) => onFile(files[0])} />
      </Section>
      {url ? (
        <video
          ref={videoRef}
          src={url}
          controls
          className="w-full max-w-2xl rounded-xl border border-border"
          onLoadedMetadata={(event) => {
            const length = event.currentTarget.duration || 0
            setDuration(length)
            setStart(0)
            setEnd(length)
          }}
        />
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Upload a video to trim it.</p>
      )}
      {duration > 0 ? (
        <Section title="Range" hint="Start, end, and duration of the clip you will export.">
          <ResultStats
            items={[
              { label: "Start", value: `${start.toFixed(1)}s` },
              { label: "End", value: `${end.toFixed(1)}s` },
              { label: "Duration", value: `${clip.toFixed(1)}s of ${duration.toFixed(1)}s` },
              { label: "Original", value: formatBytes(fileSize) },
            ]}
          />
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-[13px]">
              Start
              <input type="range" min={0} max={duration} step={0.1} value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), end - 0.1))} />
            </label>
            <label className="flex flex-col gap-2 text-[13px]">
              End
              <input type="range" min={0} max={duration} step={0.1} value={end} onChange={(event) => setEnd(Math.max(Number(event.target.value), start + 0.1))} />
            </label>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => {
                const video = videoRef.current
                if (!video) return
                video.currentTime = start
                void video.play()
                const stop = () => {
                  if (video.currentTime >= end) {
                    video.pause()
                    video.removeEventListener("timeupdate", stop)
                  }
                }
                video.addEventListener("timeupdate", stop)
              }}
            >
              Preview selection
            </Button>
          </div>
        </Section>
      ) : null}
      <IssueList issues={error ? [error] : []} />
      <StatusLine status={busy ? "processing" : result ? "complete" : "idle"}>
        {busy ? "Exporting clip…" : result ? `Clip ready · ${formatBytes(resultBytes)} · ${name}` : null}
      </StatusLine>
      <ActionBar>
        <Button
          type="button"
          className="h-10"
          disabled={!url || busy}
          onClick={async () => {
            const video = videoRef.current
            if (!video) return
            setBusy(true)
            setError(null)
            try {
              const blob = await recordRange(video, start, end)
              if (result) URL.revokeObjectURL(result)
              setResult(URL.createObjectURL(blob))
              setResultBytes(blob.size)
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not export that clip. Try Chrome or Edge.")
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? "Exporting…" : "Export clip"}
        </Button>
        {result ? (
          <Button type="button" variant="outline" className="h-10" onClick={async () => downloadBlob(await (await fetch(result)).blob(), name)}>
            Download
          </Button>
        ) : null}
        <ResetButton
          onClick={() => {
            if (url) URL.revokeObjectURL(url)
            if (result) URL.revokeObjectURL(result)
            setUrl(null)
            setResult(null)
            setDuration(0)
            setError(null)
          }}
        />
      </ActionBar>
    </FileToolShell>
  )
}

export function AudioTrimmer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [name, setName] = useState("clip-trim.wav")
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultBytes, setResultBytes] = useState(0)
  const [loaded, setLoaded] = useState(false)

  async function onFile(file: File) {
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|ogg|flac)$/i.test(file.name)) {
      setError("Choose an audio file this browser can decode.")
      return
    }
    setError(null)
    try {
      const context = new AudioContext()
      const data = await file.arrayBuffer()
      const buffer = await context.decodeAudioData(data)
      bufferRef.current = buffer
      if (url) URL.revokeObjectURL(url)
      const next = URL.createObjectURL(file)
      setUrl(next)
      setName(withSuffix(file.name, "-trim", "wav"))
      setDuration(buffer.duration)
      setStart(0)
      setEnd(buffer.duration)
      setResult(null)
      setLoaded(true)
    } catch {
      setError("This browser could not decode that audio. Try WAV, MP3, or M4A.")
    }
  }

  const clip = Math.max(0, end - start)

  return (
    <FileToolShell>
      <PrivacyNote>Your files stay on your device. The download is an uncompressed WAV of the range you select.</PrivacyNote>
      <Section title="Audio">
        <FileDropzone accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac" acceptLabel="Audio" idle="Drop an audio file here, or browse" maxBytes={40 * 1024 * 1024} onFiles={(files) => void onFile(files[0])} />
      </Section>
      {url ? <audio ref={audioRef} src={url} controls className="w-full" /> : <p className="text-sm text-[var(--nb-secondary)]">Upload audio to trim it.</p>}
      {duration > 0 ? (
        <Section title="Range">
          <ResultStats
            items={[
              { label: "Start", value: `${start.toFixed(2)}s` },
              { label: "End", value: `${end.toFixed(2)}s` },
              { label: "Duration", value: `${clip.toFixed(2)}s of ${duration.toFixed(2)}s` },
              { label: "Download", value: name },
            ]}
          />
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-[13px]">
              Start
              <input type="range" min={0} max={duration} step={0.01} value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), end - 0.05))} />
            </label>
            <label className="flex flex-col gap-2 text-[13px]">
              End
              <input type="range" min={0} max={duration} step={0.01} value={end} onChange={(event) => setEnd(Math.max(Number(event.target.value), start + 0.05))} />
            </label>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => {
                const audio = audioRef.current
                if (!audio) return
                audio.currentTime = start
                void audio.play()
                const stop = () => {
                  if (audio.currentTime >= end) {
                    audio.pause()
                    audio.removeEventListener("timeupdate", stop)
                  }
                }
                audio.addEventListener("timeupdate", stop)
              }}
            >
              Preview selection
            </Button>
          </div>
        </Section>
      ) : null}
      <IssueList issues={error ? [error] : []} />
      <StatusLine status={busy ? "processing" : result ? "complete" : "idle"}>
        {busy ? "Exporting WAV…" : result ? `Clip ready · ${formatBytes(resultBytes)}` : null}
      </StatusLine>
      <ActionBar>
        <Button
          type="button"
          className="h-10"
          disabled={!loaded || busy}
          onClick={() => {
            const buffer = bufferRef.current
            if (!buffer) return
            setBusy(true)
            try {
              const range = clampRange(start, end, buffer.duration)
              const blob = encodeWav(buffer, range.start, range.end)
              if (result) URL.revokeObjectURL(result)
              setResult(URL.createObjectURL(blob))
              setResultBytes(blob.size)
              setError(null)
            } catch {
              setError("Could not export that clip.")
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? "Exporting…" : "Export WAV"}
        </Button>
        {result ? (
          <Button type="button" variant="outline" className="h-10" onClick={async () => downloadBlob(await (await fetch(result)).blob(), name)}>
            Download
          </Button>
        ) : null}
        <ResetButton
          onClick={() => {
            if (url) URL.revokeObjectURL(url)
            if (result) URL.revokeObjectURL(result)
            bufferRef.current = null
            setUrl(null)
            setResult(null)
            setDuration(0)
            setError(null)
            setLoaded(false)
          }}
        />
      </ActionBar>
    </FileToolShell>
  )
}

function move<T>(list: T[], index: number, delta: number) {
  const next = index + delta
  if (next < 0 || next >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}

async function encodeGif(frames: Frame[], delay: number) {
  const first = frames[0]
  const source = first.bitmap ?? (await createImageBitmap(await (await fetch(first.url)).blob()))
  const max = 480
  const scale = Math.min(1, max / Math.max(source.width, source.height))
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("Could not draw frames.")
  const gif = GIFEncoder()
  for (const frame of frames) {
    const bitmap = frame.bitmap ?? (await createImageBitmap(await (await fetch(frame.url)).blob()))
    context.clearRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    const { data } = context.getImageData(0, 0, width, height)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, { palette, delay, repeat: 0 })
  }
  gif.finish()
  const bytes = gif.bytes()
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], { type: "image/gif" })
}

async function framesFromVideo(file: File): Promise<Frame[]> {
  const url = URL.createObjectURL(file)
  const video = document.createElement("video")
  video.src = url
  video.muted = true
  video.playsInline = true
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error("Could not read that video."))
  })
  const duration = Number.isFinite(video.duration) ? video.duration : 0
  if (!duration) throw new Error("That video has no readable duration.")
  const step = Math.max(0.12, duration / 24)
  const canvas = document.createElement("canvas")
  const max = 480
  const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight))
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not sample that video.")
  const frames: Frame[] = []
  for (let time = 0; time < duration && frames.length < 40; time += step) {
    video.currentTime = time
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
    })
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await canvasToBlob(canvas, "image/png")
    frames.push({ id: uid(), url: URL.createObjectURL(blob) })
  }
  URL.revokeObjectURL(url)
  return frames
}

async function recordRange(video: HTMLVideoElement, start: number, end: number) {
  const capture =
    (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream?.() ??
    (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.()
  if (!capture) throw new Error("This browser cannot export a trimmed clip. Try Chrome or Edge.")
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : ""
  if (!mime) throw new Error("This browser cannot record WebM.")
  const chunks: Blob[] = []
  const recorder = new MediaRecorder(capture, { mimeType: mime })
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data)
    }
    recorder.onerror = () => reject(new Error("Could not record the clip."))
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }))
  })
  video.currentTime = start
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve()
  })
  recorder.start()
  await video.play()
  await new Promise<void>((resolve) => {
    const tick = () => {
      if (video.currentTime >= end || video.ended) {
        video.pause()
        if (recorder.state !== "inactive") recorder.stop()
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
  return done
}
