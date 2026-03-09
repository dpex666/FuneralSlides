'use client'

import { useRef } from 'react'
import { useSlideshowStore } from '@/store/slideshowStore'

export default function PreviewPlayer() {
  const { previewUrl, previewStatus, slides, generatePreview } = useSlideshowStore()
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!slides.length) return null

  if (previewStatus === 'generating') {
    return (
      <div className="aspect-video bg-[var(--neutral-highlight)] rounded-xl flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--funeral-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--neutral-muted)] text-sm">Generating your tribute…</p>
        <p className="text-[var(--neutral-muted)] text-xs">This may take a minute</p>
      </div>
    )
  }

  if (previewStatus === 'failed') {
    return (
      <div className="aspect-video bg-[var(--neutral-highlight)] rounded-xl flex flex-col items-center justify-center gap-3">
        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[var(--neutral-text)] text-sm">Preview generation failed</p>
        <button
          onClick={generatePreview}
          className="px-4 py-2 bg-[var(--funeral-primary)] text-white rounded-lg text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className="aspect-video bg-[var(--neutral-highlight)] rounded-xl flex flex-col items-center justify-center gap-3">
        <svg className="w-12 h-12 text-[var(--neutral-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[var(--neutral-muted)] text-sm">Click &quot;Generate Slideshow&quot; to preview</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          key={previewUrl}
          src={previewUrl}
          controls
          autoPlay
          className="w-full h-full"
          playsInline
        />
      </div>
      <div className="flex items-center gap-2 bg-[var(--funeral-primary)]/10 border border-[var(--funeral-primary)]/20 rounded-lg px-3 py-2">
        <svg className="w-4 h-4 text-[var(--funeral-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p className="text-xs text-[var(--funeral-primary)]">
          This is a watermarked preview. Purchase to download the full quality version.
        </p>
      </div>
    </div>
  )
}
