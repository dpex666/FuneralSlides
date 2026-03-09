export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { previewQueue } from '@/lib/queue'

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  const job = await previewQueue.getJob(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const state = await job.getState()

  if (state === 'completed') {
    return NextResponse.json({
      status: 'completed',
      previewUrl: `/api/preview-file?sessionId=${sessionId}`,
    })
  }

  if (state === 'failed') {
    return NextResponse.json({ status: 'failed', error: job.failedReason })
  }

  return NextResponse.json({ status: state })
}
