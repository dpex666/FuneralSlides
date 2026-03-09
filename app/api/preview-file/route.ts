export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { sessionDir } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? ''

  if (!/^[0-9a-f-]{36}$/.test(sessionId)) {
    return new NextResponse(null, { status: 400 })
  }

  const filePath = path.join(sessionDir(sessionId), 'preview.mp4')
  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 })
  }

  const data = fs.readFileSync(filePath)
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-store',
    },
  })
}
