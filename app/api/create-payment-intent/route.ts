export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getStripe } from '@/lib/stripe'
import { PRICE_MAP } from '@/types/slideshow'
import type { QualityTier, SlideshowConfig } from '@/types/slideshow'
import { sessionDir, ensureDir } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const body = await req.json() as { quality: QualityTier; sessionId: string; configJson?: string }
  const { quality, sessionId, configJson } = body

  if (!quality || !PRICE_MAP[quality] || !sessionId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Persist config snapshot to disk so the webhook can retrieve it
  if (configJson) {
    try {
      const dir = sessionDir(sessionId)
      ensureDir(dir)
      fs.writeFileSync(path.join(dir, 'config.json'), configJson, 'utf-8')
    } catch {
      // Non-fatal
    }
  }

  const stripe = getStripe()
  const amount = PRICE_MAP[quality]

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { sessionId, quality },
    automatic_payment_methods: { enabled: true },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
