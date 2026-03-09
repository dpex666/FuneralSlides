import { Worker } from 'bullmq'
import path from 'path'
import { env } from '../env'
import { renderSlideshow } from '../ffmpeg'
import { sessionDir, ensureDir } from '../storage'
import type { RenderJobData } from '@/types/slideshow'

const connection = { url: env.redisUrl }

export function startPreviewWorker() {
  const worker = new Worker<RenderJobData>(
    'preview',
    async (job) => {
      const { config } = job.data
      const outDir = sessionDir(config.sessionId)
      ensureDir(outDir)
      const outputPath = path.join(outDir, 'preview.mp4')

      await renderSlideshow(config, outputPath, { tier: 'preview', watermark: true })

      return { outputPath }
    },
    {
      connection,
      concurrency: 2,
      // Kill jobs that hang for more than 3 minutes
      lockDuration: 180_000,
    },
  )

  worker.on('failed', (job, err) => {
    console.error(`[preview] job ${job?.id} failed: ${err.message}`)
  })

  worker.on('error', (err) => {
    console.error('[preview worker] error:', err.message)
  })

  return worker
}
