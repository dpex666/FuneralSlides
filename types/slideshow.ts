export type TransitionType = 'fade' | 'dissolve' | 'none'
export type QualityTier = 'sd' | 'hd' | '4k'
export type MediaType = 'image' | 'video'

export interface TextOverlay {
  text: string
  position: 'top' | 'center' | 'bottom'
  fontSize: number
  color: string
}

export interface Slide {
  id: string
  mediaUrl: string
  mediaType: MediaType
  storedFilename: string
  duration: number
  transition: TransitionType
  textOverlay?: TextOverlay
  fit: 'contain' | 'cover'
}

export interface MusicConfig {
  source: 'library' | 'custom'
  trackId?: string
  customAudioUrl?: string
  customAudioFilename?: string
  volume: number
}

export interface SlideshowConfig {
  sessionId: string
  slides: Slide[]
  music: MusicConfig
  quality: QualityTier
}

export interface MusicTrack {
  id: string
  title: string
  filename: string
  durationSeconds: number
  sourceCredit: string
}

export const PRICE_MAP: Record<QualityTier, number> = {
  sd: 999,   // $9.99
  hd: 1499,  // $14.99
  '4k': 2499, // $24.99
}

export const QUALITY_LABELS: Record<QualityTier, string> = {
  sd: '720p HD',
  hd: '1080p Full HD',
  '4k': '4K Ultra HD',
}

export interface UploadedMedia {
  id: string
  originalFilename: string
  storedFilename: string
  mimeType: string
  sizeBytes: number
  url: string
  mediaType: MediaType
}

export interface ExportJob {
  jobId: string
  sessionId: string
  status: 'waiting' | 'active' | 'completed' | 'failed'
  outputToken?: string
  errorMessage?: string
}

export interface RenderJobData {
  sessionId: string
  config: SlideshowConfig
  outputPath: string
  tier: 'preview' | QualityTier
  watermark: boolean
}
