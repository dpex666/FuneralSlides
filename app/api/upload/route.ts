export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { sessionDir, ensureDir } from '@/lib/storage'
import type { UploadedMedia, MediaType } from '@/types/slideshow'
import { IncomingMessage } from 'http'
import { Readable } from 'stream'

const ALLOWED_MIME: Record<string, MediaType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'image/heif': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

async function toNodeRequest(req: NextRequest): Promise<IncomingMessage> {
  const body = await req.arrayBuffer()
  const readable = Readable.from(Buffer.from(body)) as unknown as IncomingMessage
  readable.headers = Object.fromEntries(req.headers.entries())
  readable.method = req.method
  return readable
}

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id')
  if (!sessionId || !/^[0-9a-f-]{36}$/.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }

  const uploadsDir = sessionDir(sessionId, 'uploads')
  ensureDir(uploadsDir)

  const nodeReq = await toNodeRequest(req)
  const form = formidable({
    uploadDir: uploadsDir,
    keepExtensions: true,
    maxFileSize: MAX_SIZE,
    filter: ({ mimetype }) => !!(mimetype && ALLOWED_MIME[mimetype]),
  })

  return new Promise<NextResponse>((resolve) => {
    form.parse(nodeReq, async (err, _fields, files) => {
      if (err) {
        return resolve(NextResponse.json({ error: 'Upload failed' }, { status: 400 }))
      }

      const results: UploadedMedia[] = []
      const fileList = Array.isArray(files.file) ? files.file : files.file ? [files.file] : []

      for (const file of fileList) {
        const mime = file.mimetype ?? ''
        const mediaType = ALLOWED_MIME[mime]
        if (!mediaType) continue

        const ext = path.extname(file.originalFilename ?? '.bin')
        const storedFilename = `${uuidv4()}${ext}`
        const destPath = path.join(uploadsDir, storedFilename)
        fs.renameSync(file.filepath, destPath)

        results.push({
          id: uuidv4(),
          originalFilename: file.originalFilename ?? 'file',
          storedFilename,
          mimeType: mime,
          sizeBytes: file.size,
          url: `/api/media/${sessionId}/${storedFilename}`,
          mediaType,
        })
      }

      resolve(NextResponse.json({ files: results }))
    })
  })
}
