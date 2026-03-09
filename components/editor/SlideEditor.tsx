'use client'

import { useSlideshowStore } from '@/store/slideshowStore'
import type { TransitionType, Slide } from '@/types/slideshow'

const TRANSITIONS: { value: TransitionType; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'none', label: 'Cut' },
]

interface SlideEditorProps {
  selectedId: string | null
}

export default function SlideEditor({ selectedId }: SlideEditorProps) {
  const { slides, updateSlide } = useSlideshowStore()
  const slide = slides.find((s) => s.id === selectedId)

  if (!slide) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-muted)] text-sm text-center">
          Select a slide from the timeline to edit it
        </p>
      </div>
    )
  }

  const update = (updates: Partial<Slide>) => updateSlide(slide.id, updates)

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Slide Settings</h3>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm text-[var(--text)]">
          Duration: <span className="text-[var(--gold)]">{slide.duration}s</span>
        </label>
        <input
          type="range"
          min={1}
          max={15}
          step={0.5}
          value={slide.duration}
          onChange={(e) => update({ duration: Number(e.target.value) })}
          className="w-full accent-[var(--gold)]"
        />
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>1s</span><span>15s</span>
        </div>
      </div>

      {/* Transition */}
      <div className="space-y-2">
        <label className="text-sm text-[var(--text)]">Transition (after this slide)</label>
        <div className="grid grid-cols-3 gap-2">
          {TRANSITIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => update({ transition: t.value })}
              className={`py-2 rounded-lg text-sm transition-colors ${
                slide.transition === t.value
                  ? 'bg-[var(--gold)] text-[var(--bg)] font-medium'
                  : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fit */}
      <div className="space-y-2">
        <label className="text-sm text-[var(--text)]">Image Fit</label>
        <div className="grid grid-cols-2 gap-2">
          {(['cover', 'contain'] as const).map((fit) => (
            <button
              key={fit}
              onClick={() => update({ fit })}
              className={`py-2 rounded-lg text-sm capitalize transition-colors ${
                slide.fit === fit
                  ? 'bg-[var(--gold)] text-[var(--bg)] font-medium'
                  : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]'
              }`}
            >
              {fit}
            </button>
          ))}
        </div>
      </div>

      {/* Text Overlay */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-[var(--text)]">Text Overlay</label>
          <button
            onClick={() =>
              update({
                textOverlay: slide.textOverlay
                  ? undefined
                  : { text: '', position: 'bottom', fontSize: 32, color: '#ffffff' },
              })
            }
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              slide.textOverlay ? 'bg-[var(--gold)]' : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                slide.textOverlay ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {slide.textOverlay && (
          <div className="space-y-3 bg-[var(--surface)] rounded-lg p-3">
            <input
              type="text"
              placeholder="Enter text..."
              value={slide.textOverlay.text}
              onChange={(e) => update({ textOverlay: { ...slide.textOverlay!, text: e.target.value } })}
              className="w-full bg-[var(--surface-2)] text-[var(--text)] rounded-lg px-3 py-2 text-sm outline-none border border-[var(--border)] focus:border-[var(--gold)]/50"
            />
            <div className="grid grid-cols-3 gap-1">
              {(['top', 'center', 'bottom'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => update({ textOverlay: { ...slide.textOverlay!, position: pos } })}
                  className={`py-1.5 rounded text-xs capitalize transition-colors ${
                    slide.textOverlay?.position === pos
                      ? 'bg-[var(--gold)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-[var(--text-muted)]">Size: {slide.textOverlay.fontSize}px</label>
              <input
                type="range"
                min={16}
                max={80}
                value={slide.textOverlay.fontSize}
                onChange={(e) => update({ textOverlay: { ...slide.textOverlay!, fontSize: Number(e.target.value) } })}
                className="flex-1 accent-[var(--gold)]"
              />
              <input
                type="color"
                value={slide.textOverlay.color}
                onChange={(e) => update({ textOverlay: { ...slide.textOverlay!, color: e.target.value } })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
