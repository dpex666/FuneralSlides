import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import type { SlideshowConfig, QualityTier, TransitionType } from '@/types/slideshow'
import { sessionDir, ensureDir } from './storage'

export const QUALITY_SETTINGS: Record<
  'preview' | QualityTier,
  { resolution: string; crf: number; preset: string }
> = {
  preview: { resolution: '854x480', crf: 28, preset: 'ultrafast' },
  sd: { resolution: '1280x720', crf: 23, preset: 'medium' },
  hd: { resolution: '1920x1080', crf: 20, preset: 'slow' },
  '4k': { resolution: '3840x2160', crf: 18, preset: 'slow' },
}

const TRANSITION_DURATION = 0.8 // seconds

function xfadeName(t: TransitionType): string {
  switch (t) {
    case 'fade': return 'fade'
    case 'dissolve': return 'dissolve'
    case 'none': return 'fade'
    default: return 'fade'
  }
}

/** Normalize a photo or video to a constant-frame-rate clip */
export async function preprocessMedia(
  inputPath: string,
  outputPath: string,
  durationSeconds: number,
  resolution: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath)
      .outputOptions([
        '-vf', `scale=${resolution}:force_original_aspect_ratio=decrease,pad=${resolution}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
        '-t', String(durationSeconds),
        '-r', '25',
        '-vsync', 'cfr',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-an',
        '-y',
      ])
      .output(outputPath)
      .on('error', reject)
      .on('end', () => resolve())
    cmd.run()
  })
}

export interface RenderOptions {
  tier: 'preview' | QualityTier
  watermark: boolean
}

export async function renderSlideshow(
  config: SlideshowConfig,
  outputPath: string,
  options: RenderOptions,
): Promise<void> {
  const { slides, music } = config
  const { tier, watermark } = options
  const quality = QUALITY_SETTINGS[tier]
  const [width, height] = quality.resolution.split('x').map(Number)
  const dir = sessionDir(config.sessionId)
  ensureDir(dir)

  // Step 1: pre-process each slide to a normalised clip
  const clipPaths: string[] = []
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const clipOut = path.join(dir, `clip_${i}.mp4`)
    const sourcePath = path.join(sessionDir(config.sessionId, 'uploads'), slide.storedFilename)
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file not found: ${sourcePath}`)
    }
    await preprocessMedia(sourcePath, clipOut, slide.duration, quality.resolution)
    clipPaths.push(clipOut)
  }

  // Step 2: build filter_complex for xfade transitions
  const filterLines: string[] = []
  let lastLabel = '[0:v]'

  for (let i = 0; i < clipPaths.length - 1; i++) {
    const slide = slides[i]
    const offset = slides.slice(0, i + 1).reduce((s, sl) => s + sl.duration, 0) - TRANSITION_DURATION
    const outLabel = i === clipPaths.length - 2 ? '[vout]' : `[v${i + 1}]`
    const xfade = xfadeName(slide.transition)
    filterLines.push(
      `${lastLabel}[${i + 1}:v]xfade=transition=${xfade}:duration=${TRANSITION_DURATION}:offset=${offset}${outLabel}`,
    )
    lastLabel = `[v${i + 1}]`
  }

  // Single slide: just label it
  if (clipPaths.length === 1) {
    filterLines.push('[0:v]copy[vout]')
  }

  // Watermark
  if (watermark) {
    filterLines.push(
      `[vout]drawtext=text='PassingMoments Preview':fontcolor=white@0.4:fontsize=${Math.round(height / 22)}:x=(w-text_w)/2:y=h-th-30:box=1:boxcolor=black@0.3:boxborderw=8[vwm]`,
    )
  }

  const finalVideo = watermark ? '[vwm]' : '[vout]'

  // Step 3: build ffmpeg command
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()

    for (const clip of clipPaths) {
      cmd.addInput(clip)
    }

    // Music
    let musicPath: string | null = null
    if (music.source === 'library' && music.trackId) {
      musicPath = path.join(process.cwd(), 'public', 'music', `${music.trackId}.mp3`)
    } else if (music.source === 'custom' && music.customAudioFilename) {
      musicPath = path.join(sessionDir(config.sessionId, 'audio'), music.customAudioFilename)
    }

    const totalDuration = slides.reduce((s, sl) => s + sl.duration, 0)

    if (musicPath && fs.existsSync(musicPath)) {
      cmd.addInput(musicPath)
      cmd.addInputOption('-stream_loop', '-1') // not usable after input — handled below
    }

    const audioFilter = musicPath && fs.existsSync(musicPath)
      ? `[${clipPaths.length}:a]volume=${music.volume},afade=t=out:st=${totalDuration - 3}:d=3[aout]`
      : null

    const fullFilter = audioFilter
      ? [...filterLines, audioFilter].join('; ')
      : filterLines.join('; ')

    cmd
      .complexFilter(fullFilter)
      .outputOptions([
        '-map', finalVideo,
        ...(audioFilter ? ['-map', '[aout]'] : []),
        '-c:v', 'libx264',
        '-preset', quality.preset,
        '-crf', String(quality.crf),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-t', String(totalDuration),
        '-y',
      ])
      .output(outputPath)
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .run()
  })
}
