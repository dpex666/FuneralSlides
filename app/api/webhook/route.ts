export const runtime = 'nodejs'

import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { exportQueue } from '@/lib/queue'
import { lockExists, writeLock, sessionDir } from '@/lib/storage'
import type { QualityTier, SlideshowConfig } from '@/types/slideshow'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, env.stripeWebhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as { id: string; metadata: Record<string, string> }
    const { sessionId, quality } = pi.metadata

    if (!sessionId || !quality) {
      return NextResponse.json({ ok: true })
    }

    const lockKey = `export-${pi.id}`
    if (lockExists(sessionId, lockKey)) {
      return NextResponse.json({ ok: true })
    }
    writeLock(sessionId, lockKey)

    // Read config snapshot saved during payment intent creation
    const configPath = path.join(sessionDir(sessionId), 'config.json')
    let config: SlideshowConfig
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as SlideshowConfig
    } catch {
      return NextResponse.json({ error: 'Config not found' }, { status: 400 })
    }

    config.quality = quality as QualityTier

    await exportQueue.add('export', {
      config,
      outputPath: '',
      tier: quality as QualityTier,
      watermark: false,
      sessionId,
    })
  }

  return NextResponse.json({ ok: true })
}
