export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { verifyDownloadToken } from '@/lib/tokens'
import { sessionDir } from '@/lib/storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  let payload
  try {
    payload = verifyDownloadToken(token)
  } catch {
    return new NextResponse('Invalid or expired link', { status: 401 })
  }

  const { sessionId, quality } = payload
  const filePath = path.join(sessionDir(sessionId), `export-${quality}.mp4`)

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 })
  }

  const data = fs.readFileSync(filePath)
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="PassingMoments-${quality}.mp4"`,
      'Cache-Control': 'no-store',
    },
  })
}
