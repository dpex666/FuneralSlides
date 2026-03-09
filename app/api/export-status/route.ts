export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { exportQueue } from '@/lib/queue'

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  const job = await exportQueue.getJob(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const state = await job.getState()

  if (state === 'completed') {
    const result = job.returnvalue as { token: string }
    return NextResponse.json({ status: 'completed', downloadToken: result?.token })
  }

  if (state === 'failed') {
    return NextResponse.json({ status: 'failed', error: job.failedReason })
  }

  return NextResponse.json({ status: state })
}
