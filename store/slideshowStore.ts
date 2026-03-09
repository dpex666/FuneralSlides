'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Slide, MusicConfig, QualityTier, SlideshowConfig, UploadedMedia } from '@/types/slideshow'

type PreviewStatus = 'idle' | 'generating' | 'ready' | 'failed' | 'stale'

interface SlideshowState {
  sessionId: string
  slides: Slide[]
  music: MusicConfig
  quality: QualityTier
  previewJobId: string | null
  previewUrl: string | null
  previewStatus: PreviewStatus
  exportJobId: string | null
  downloadToken: string | null
  paymentIntentClientSecret: string | null

  // actions
  initSession: () => void
  addMediaToSlides: (files: UploadedMedia[]) => void
  reorderSlides: (from: number, to: number) => void
  updateSlide: (id: string, updates: Partial<Slide>) => void
  removeSlide: (id: string) => void
  setMusic: (music: Partial<MusicConfig>) => void
  setQuality: (quality: QualityTier) => void
  generatePreview: () => Promise<void>
  pollPreview: (jobId: string) => Promise<void>
  setPreviewStale: () => void
  startExportPoll: (jobId: string) => void
  setPaymentIntentSecret: (secret: string) => void
  getConfig: () => SlideshowConfig
}

export const useSlideshowStore = create<SlideshowState>()(
  persist(
    (set, get) => ({
      sessionId: '',
      slides: [],
      music: { source: 'library', trackId: 'gentle-remembrance', volume: 0.8 },
      quality: 'hd',
      previewJobId: null,
      previewUrl: null,
      previewStatus: 'idle',
      exportJobId: null,
      downloadToken: null,
      paymentIntentClientSecret: null,

      initSession() {
        if (!get().sessionId) {
          set({ sessionId: uuidv4() })
        }
      },

      addMediaToSlides(files: UploadedMedia[]) {
        const newSlides: Slide[] = files.map((f) => ({
          id: uuidv4(),
          mediaUrl: f.url,
          mediaType: f.mediaType,
          storedFilename: f.storedFilename,
          duration: 4,
          transition: 'fade',
          fit: 'cover',
        }))
        set((s) => ({ slides: [...s.slides, ...newSlides], previewStatus: 'stale' }))
      },

      reorderSlides(from: number, to: number) {
        set((s) => {
          const slides = [...s.slides]
          const [item] = slides.splice(from, 1)
          slides.splice(to, 0, item)
          return { slides, previewStatus: 'stale' }
        })
      },

      updateSlide(id: string, updates: Partial<Slide>) {
        set((s) => ({
          slides: s.slides.map((sl) => (sl.id === id ? { ...sl, ...updates } : sl)),
          previewStatus: 'stale',
        }))
      },

      removeSlide(id: string) {
        set((s) => ({
          slides: s.slides.filter((sl) => sl.id !== id),
          previewStatus: s.slides.length > 1 ? 'stale' : 'idle',
        }))
      },

      setMusic(music: Partial<MusicConfig>) {
        set((s) => ({ music: { ...s.music, ...music }, previewStatus: 'stale' }))
      },

      setQuality(quality: QualityTier) {
        set({ quality })
      },

      getConfig(): SlideshowConfig {
        const { sessionId, slides, music, quality } = get()
        return { sessionId, slides, music, quality }
      },

      async generatePreview() {
        const { slides, sessionId } = get()
        if (!slides.length) return

        set({ previewStatus: 'generating', previewUrl: null })

        try {
          const res = await fetch('/api/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: get().getConfig() }),
          })
          const data = await res.json() as { jobId: string }
          set({ previewJobId: data.jobId })
          await get().pollPreview(data.jobId)
        } catch {
          set({ previewStatus: 'failed' })
        }
      },

      async pollPreview(jobId: string) {
        const { sessionId } = get()
        const poll = async () => {
          const res = await fetch(`/api/preview-status?jobId=${jobId}&sessionId=${sessionId}`)
          const data = await res.json() as { status: string; previewUrl?: string; error?: string }

          if (data.status === 'completed' && data.previewUrl) {
            // append timestamp to bust cache
            set({ previewUrl: `${data.previewUrl}&t=${Date.now()}`, previewStatus: 'ready' })
          } else if (data.status === 'failed') {
            set({ previewStatus: 'failed' })
          } else {
            setTimeout(poll, 2000)
          }
        }
        await poll()
      },

      setPreviewStale() {
        set({ previewStatus: 'stale' })
      },

      startExportPoll(jobId: string) {
        set({ exportJobId: jobId })
        const { sessionId } = get()

        const poll = async () => {
          const res = await fetch(`/api/export-status?jobId=${jobId}&sessionId=${sessionId}`)
          const data = await res.json() as { status: string; downloadToken?: string }

          if (data.status === 'completed' && data.downloadToken) {
            set({ downloadToken: data.downloadToken })
          } else if (data.status !== 'failed') {
            setTimeout(poll, 3000)
          }
        }
        poll()
      },

      setPaymentIntentSecret(secret: string) {
        set({ paymentIntentClientSecret: secret })
      },
    }),
    {
      name: 'passing-moments-session',
      partialize: (s) => ({ sessionId: s.sessionId }),
    },
  ),
)
