export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { previewQueue } from '@/lib/queue'
import type { SlideshowConfig } from '@/types/slideshow'

export async function POST(req: NextRequest) {
  const body = await req.json() as { config: SlideshowConfig }
  const { config } = body

  if (!config?.sessionId || !config.slides?.length) {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
  }

  const job = await previewQueue.add('render', {
    config,
    outputPath: '',
    tier: 'preview',
    watermark: true,
    sessionId: config.sessionId,
  })

  return NextResponse.json({ jobId: job.id })
}
