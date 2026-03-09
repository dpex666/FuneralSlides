'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSlideshowStore } from '@/store/slideshowStore'
import MediaUploader from '@/components/editor/MediaUploader'
import Timeline from '@/components/editor/Timeline'
import SlideEditor from '@/components/editor/SlideEditor'
import MusicPicker from '@/components/editor/MusicPicker'
import PreviewPlayer from '@/components/editor/PreviewPlayer'

export default function EditorPage() {
  const { slides, previewStatus, previewUrl, generatePreview, initSession } = useSlideshowStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showMusic, setShowMusic] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initSession()
  }, [initSession])

  // Auto-select first slide when slides change
  useEffect(() => {
    if (slides.length && !selectedId) {
      setSelectedId(slides[0].id)
    }
    if (selectedId && !slides.find((s) => s.id === selectedId)) {
      setSelectedId(slides[0]?.id ?? null)
    }
  }, [slides, selectedId])

  const canGenerate = slides.length > 0
  const isGenerating = previewStatus === 'generating'

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }} className="px-6 py-3 flex items-center justify-between flex-shrink-0">
        <Link href="/" style={{ color: 'var(--gold)', fontWeight: 700 }}>PassingMoments</Link>
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{slides.length} slide{slides.length !== 1 ? 's' : ''}</span>
          {previewUrl && (
            <button
              onClick={() => router.push('/checkout')}
              style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)' }}
              className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Purchase & Download
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div style={{ width: '400px', borderRight: '1px solid var(--border)', backgroundColor: 'var(--surface)', overflowY: 'auto', flexShrink: 0 }} className="p-4 space-y-4">
          <MediaUploader />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline */}
          <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }} className="p-4 flex-shrink-0">
            <Timeline selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          {/* Editor + Preview */}
          <div className="flex-1 flex overflow-hidden">
            {/* Slide settings */}
            <div style={{ width: '280px', borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
              <SlideEditor selectedId={selectedId} />
            </div>

            {/* Preview + actions */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <PreviewPlayer />

              {/* Action bar */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={generatePreview}
                  disabled={!canGenerate || isGenerating}
                  style={{
                    backgroundColor: canGenerate && !isGenerating ? 'var(--gold)' : 'var(--border)',
                    color: canGenerate && !isGenerating ? 'var(--bg)' : 'var(--text-muted)',
                    cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed',
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {previewStatus === 'stale' ? 'Regenerate Preview' : 'Generate Slideshow'}
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowMusic(!showMusic)}
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                  className="px-4 py-3 rounded-xl text-sm hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Music
                </button>
              </div>

              {showMusic && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--surface)' }} className="p-4">
                  <MusicPicker />
                </div>
              )}

              {previewUrl && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} className="p-5">
                  <h3 style={{ color: 'var(--text)' }} className="font-semibold mb-2">Ready to download?</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-4">
                    Happy with your tribute? Choose your quality and download the full version — no watermark.
                  </p>
                  <button
                    onClick={() => router.push('/checkout')}
                    style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)' }}
                    className="w-full py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Purchase & Download — from $9.99
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
