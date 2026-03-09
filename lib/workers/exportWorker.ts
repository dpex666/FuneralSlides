import { Worker } from 'bullmq'
import path from 'path'
import { env } from '../env'
import { renderSlideshow } from '../ffmpeg'
import { sessionDir, ensureDir } from '../storage'
import { signDownloadToken } from '../tokens'
import type { RenderJobData } from '@/types/slideshow'

const connection = { url: env.redisUrl }

export function startExportWorker() {
  const worker = new Worker<RenderJobData>(
    'export',
    async (job) => {
      const { config } = job.data
      const tier = config.quality
      const outDir = sessionDir(config.sessionId)
      ensureDir(outDir)
      const outputPath = path.join(outDir, `export-${tier}.mp4`)

      await renderSlideshow(config, outputPath, { tier, watermark: false })

      const token = signDownloadToken({ sessionId: config.sessionId, quality: tier })
      return { outputPath, token }
    },
    { connection, concurrency: 1 },
  )

  worker.on('failed', (job, err) => {
    console.error(`[export] job ${job?.id} failed:`, err.message)
  })

  return worker
}
