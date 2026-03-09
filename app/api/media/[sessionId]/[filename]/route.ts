export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { sessionDir } from '@/lib/storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; filename: string }> },
) {
  const { sessionId, filename } = await params

  if (!/^[0-9a-f-]{36}$/.test(sessionId) || /[/\\]/.test(filename)) {
    return new NextResponse(null, { status: 400 })
  }

  const filePath = path.join(sessionDir(sessionId, 'uploads'), filename)
  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 })
  }

  const data = fs.readFileSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
  }
  const mime = mimeMap[ext] ?? 'application/octet-stream'

  return new NextResponse(data, {
    headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' },
  })
}
