'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSlideshowStore } from '@/store/slideshowStore'
import { v4 as uuidv4 } from 'uuid'

type Layout = '2x1' | '1x2' | '2x2' | 'L+2' | '2+1' | '3x2' | 'auto'

const LAYOUTS: { value: Layout; label: string; minPhotos: number; maxPhotos: number }[] = [
  { value: 'auto',  label: 'Auto',            minPhotos: 2, maxPhotos: 6 },
  { value: '2x1',  label: '⬜⬜ Side by side', minPhotos: 2, maxPhotos: 2 },
  { value: '1x2',  label: '⬜\n⬜ Stacked',   minPhotos: 2, maxPhotos: 2 },
  { value: 'L+2',  label: '▬▪▪ Featured + 2', minPhotos: 3, maxPhotos: 3 },
  { value: '2+1',  label: '▪▪\n▬ 2 top + 1',  minPhotos: 3, maxPhotos: 3 },
  { value: '2x2',  label: '⬜⬜\n⬜⬜ Grid 2×2', minPhotos: 4, maxPhotos: 4 },
  { value: '3x2',  label: '⬜⬜⬜\n⬜⬜⬜ Grid 3×2', minPhotos: 5, maxPhotos: 6 },
]

export default function CollageCreator({ onClose }: { onClose: () => void }) {
  const { slides, sessionId, addMediaToSlides } = useSlideshowStore()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [layout, setLayout] = useState<Layout>('auto')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only image slides can be included in a collage
  const imageSlides = slides.filter((s) => s.mediaType === 'image')

  const toggle = (filename: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) next.delete(filename)
      else if (next.size < 6) next.add(filename)
      return next
    })
  }

  const validLayouts = LAYOUTS.filter(
    (l) => selected.size >= l.minPhotos && selected.size <= l.maxPhotos,
  )

  const generate = async () => {
    if (selected.size < 2) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/collage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, filenames: Array.from(selected), layout }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Collage generation failed')
      }
      const data = await res.json() as { storedFilename: string; url: string }
      addMediaToSlides([{
        id: uuidv4(),
        originalFilename: 'collage.jpg',
        storedFilename: data.storedFilename,
        mimeType: 'image/jpeg',
        sizeBytes: 0,
        url: data.url,
        mediaType: 'image',
      }])
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 style={{ color: 'var(--neutral-text)' }} className="font-semibold text-sm">
          Create Collage — select 2–6 photos
        </h3>
        <button onClick={onClose} style={{ color: 'var(--neutral-muted)' }} className="text-lg leading-none">
          ×
        </button>
      </div>

      {imageSlides.length < 2 ? (
        <p style={{ color: 'var(--neutral-muted)' }} className="text-sm py-4 text-center">
          Upload at least 2 photos to create a collage.
        </p>
      ) : (
        <>
          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-2">
            {imageSlides.map((slide) => {
              const isSelected = selected.has(slide.storedFilename)
              const order = isSelected ? Array.from(selected).indexOf(slide.storedFilename) + 1 : null
              return (
                <button
                  key={slide.id}
                  onClick={() => toggle(slide.storedFilename)}
                  className="relative aspect-square rounded-lg overflow-hidden"
                  style={{
                    outline: isSelected ? '2px solid var(--funeral-primary)' : '2px solid transparent',
                  }}
                >
                  <Image
                    src={slide.mediaUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                    unoptimized
                  />
                  {isSelected && (
                    <div
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--funeral-primary)', color: 'white' }}
                    >
                      {order}
                    </div>
                  )}
                  {!isSelected && selected.size >= 6 && (
                    <div className="absolute inset-0 bg-black/40" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Layout picker */}
          {selected.size >= 2 && (
            <div className="space-y-1.5">
              <p style={{ color: 'var(--neutral-muted)' }} className="text-xs font-medium uppercase tracking-wide">
                Layout
              </p>
              <div className="flex flex-wrap gap-2">
                {validLayouts.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLayout(l.value)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      backgroundColor: layout === l.value ? 'var(--funeral-primary)' : 'var(--neutral-deep-highlight)',
                      color: layout === l.value ? 'white' : 'var(--neutral-text)',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={generate}
            disabled={selected.size < 2 || busy}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{
              backgroundColor: selected.size >= 2 && !busy ? 'var(--funeral-primary)' : 'var(--neutral-deep-highlight)',
              color: selected.size >= 2 && !busy ? 'white' : 'var(--neutral-muted)',
              cursor: selected.size >= 2 && !busy ? 'pointer' : 'not-allowed',
            }}
          >
            {busy ? 'Generating collage…' : `Create Collage (${selected.size} photo${selected.size !== 1 ? 's' : ''})`}
          </button>
        </>
      )}
    </div>
  )
}
