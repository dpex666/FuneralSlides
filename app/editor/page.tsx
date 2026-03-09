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

type MobileTab = 'upload' | 'slides' | 'preview'

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const SlidesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)
const PreviewIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const MusicIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
)

export default function EditorPage() {
  const { slides, previewStatus, previewUrl, generatePreview, initSession } = useSlideshowStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showMusic, setShowMusic] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('upload')
  const router = useRouter()

  useEffect(() => {
    initSession()
  }, [initSession])

  useEffect(() => {
    if (slides.length && !selectedId) {
      setSelectedId(slides[0].id)
    }
    if (selectedId && !slides.find((s) => s.id === selectedId)) {
      setSelectedId(slides[0]?.id ?? null)
    }
  }, [slides, selectedId])

  // Auto-switch to preview tab when preview becomes ready on mobile
  useEffect(() => {
    if (previewStatus === 'ready') {
      setMobileTab('preview')
    }
  }, [previewStatus])

  const canGenerate = slides.length > 0
  const isGenerating = previewStatus === 'generating'

  const GenerateButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <button
      onClick={generatePreview}
      disabled={!canGenerate || isGenerating}
      style={{
        backgroundColor: canGenerate && !isGenerating ? 'var(--funeral-primary)' : 'var(--neutral-deep-highlight)',
        color: canGenerate && !isGenerating ? 'var(--neutral-bg)' : 'var(--neutral-muted)',
        cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed',
      }}
      className={`${fullWidth ? 'w-full' : 'flex-1'} py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2`}
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
  )

  const MusicButton = ({ className = '' }: { className?: string }) => (
    <button
      onClick={() => setShowMusic(!showMusic)}
      style={{ border: '1px solid var(--neutral-deep-highlight)', color: 'var(--neutral-text)' }}
      className={`px-4 py-3 rounded-xl text-sm hover:bg-[var(--neutral-deep-highlight)] transition-colors flex items-center gap-2 ${className}`}
    >
      <MusicIcon />
      <span className="hidden sm:inline">Music</span>
    </button>
  )

  const PurchaseCard = () => (
    <div style={{ backgroundColor: 'var(--neutral-highlight)', border: '1px solid var(--neutral-deep-highlight)', borderRadius: '0.75rem' }} className="p-4 sm:p-5">
      <h3 style={{ color: 'var(--neutral-text)' }} className="font-semibold mb-2">Ready to download?</h3>
      <p style={{ color: 'var(--neutral-muted)' }} className="text-sm mb-4">
        Happy with your tribute? Choose your quality and download the full version — no watermark.
      </p>
      <button
        onClick={() => router.push('/checkout')}
        style={{ backgroundColor: 'var(--funeral-primary)', color: 'var(--neutral-bg)' }}
        className="w-full py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
      >
        Purchase &amp; Download — from $9.99
      </button>
    </div>
  )

  return (
    <div style={{ backgroundColor: 'var(--neutral-bg)', color: 'var(--neutral-text)' }} className="min-h-dvh flex flex-col">
      {/* Header */}
      <header
        style={{ borderBottom: '1px solid var(--neutral-deep-highlight)', backgroundColor: 'var(--neutral-highlight)' }}
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
      >
        <Link href="/" style={{ color: 'var(--funeral-primary)', fontWeight: 700 }}>PassingMoments</Link>
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--neutral-muted)', fontSize: '0.875rem' }}>
            {slides.length} slide{slides.length !== 1 ? 's' : ''}
          </span>
          {previewUrl && (
            <button
              onClick={() => router.push('/checkout')}
              style={{ backgroundColor: 'var(--funeral-primary)', color: 'var(--neutral-bg)' }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Purchase
            </button>
          )}
        </div>
      </header>

      {/* ── Desktop layout (lg+) ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left panel — upload */}
        <div
          style={{ width: '380px', borderRight: '1px solid var(--neutral-deep-highlight)', backgroundColor: 'var(--neutral-highlight)', flexShrink: 0 }}
          className="overflow-y-auto p-4"
        >
          <MediaUploader />
        </div>

        {/* Centre + right */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline strip */}
          <div
            style={{ borderBottom: '1px solid var(--neutral-deep-highlight)', backgroundColor: 'var(--neutral-deep-highlight)' }}
            className="p-4 flex-shrink-0"
          >
            <Timeline selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Slide settings */}
            <div
              style={{ width: '280px', borderRight: '1px solid var(--neutral-deep-highlight)', flexShrink: 0 }}
              className="overflow-y-auto"
            >
              <SlideEditor selectedId={selectedId} />
            </div>

            {/* Preview + actions */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              <PreviewPlayer />
              <div className="flex flex-wrap gap-3">
                <GenerateButton />
                <MusicButton />
              </div>
              {showMusic && (
                <div style={{ border: '1px solid var(--neutral-deep-highlight)', borderRadius: '0.75rem', backgroundColor: 'var(--neutral-highlight)' }} className="p-4">
                  <MusicPicker />
                </div>
              )}
              {previewUrl && <PurchaseCard />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile layout (< lg) ── */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'upload' && (
            <div className="p-4">
              <MediaUploader />
            </div>
          )}

          {mobileTab === 'slides' && (
            <div>
              <div
                style={{ borderBottom: '1px solid var(--neutral-deep-highlight)', backgroundColor: 'var(--neutral-deep-highlight)' }}
                className="p-3"
              >
                <Timeline selectedId={selectedId} onSelect={setSelectedId} />
              </div>
              <SlideEditor selectedId={selectedId} />
            </div>
          )}

          {mobileTab === 'preview' && (
            <div className="p-4 space-y-4">
              <PreviewPlayer />
              <div className="flex gap-3">
                <GenerateButton />
                <MusicButton />
              </div>
              {showMusic && (
                <div style={{ border: '1px solid var(--neutral-deep-highlight)', borderRadius: '0.75rem', backgroundColor: 'var(--neutral-highlight)' }} className="p-4">
                  <MusicPicker />
                </div>
              )}
              {previewUrl && <PurchaseCard />}
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div
          style={{ borderTop: '1px solid var(--neutral-deep-highlight)', backgroundColor: 'var(--neutral-highlight)' }}
          className="flex-shrink-0 flex pb-safe"
        >
          {([
            { id: 'upload' as MobileTab, label: 'Upload', Icon: UploadIcon },
            { id: 'slides' as MobileTab, label: 'Slides', Icon: SlidesIcon },
            { id: 'preview' as MobileTab, label: 'Preview', Icon: PreviewIcon },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className="flex-1 py-3 flex flex-col items-center gap-1 transition-colors"
              style={{ color: mobileTab === id ? 'var(--funeral-primary)' : 'var(--neutral-muted)' }}
            >
              <Icon />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
