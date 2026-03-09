export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { sessionDir, ensureDir } from '@/lib/storage'

type Layout = '2x1' | '1x2' | '2x2' | 'L+2' | '2+1' | '3x2'

interface CollageRequest {
  sessionId: string
  filenames: string[]   // storedFilenames from uploads dir
  layout: Layout | 'auto'
}

const SESSION_REGEX = /^[0-9a-f-]{36}$/

function pickLayout(count: number): Layout {
  if (count === 2) return '2x1'
  if (count === 3) return 'L+2'
  if (count === 4) return '2x2'
  if (count === 5) return '2+1'
  return '3x2'
}

export async function POST(req: NextRequest) {
  const body = await req.json() as CollageRequest
  const { sessionId, filenames } = body
  const layout: Layout = body.layout === 'auto' ? pickLayout(filenames.length) : body.layout

  if (!sessionId || !SESSION_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 })
  }
  if (!Array.isArray(filenames) || filenames.length < 2 || filenames.length > 6) {
    return NextResponse.json({ error: 'Provide 2–6 filenames' }, { status: 400 })
  }
  if (filenames.some((f) => f.includes('/') || f.includes('..'))) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const uploadsDir = sessionDir(sessionId, 'uploads')
  ensureDir(uploadsDir)

  const W = 1920
  const H = 1080
  const GAP = 6

  type Cell = { x: number; y: number; w: number; h: number }
  const cells = buildCells(layout, filenames.length, W, H, GAP)

  const composites: sharp.OverlayOptions[] = []
  for (let i = 0; i < cells.length; i++) {
    const { x, y, w, h } = cells[i]
    const imgPath = path.join(uploadsDir, filenames[i])
    const buf = await sharp(imgPath)
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .toBuffer()
    composites.push({ input: buf, left: x, top: y })
  }

  const collageBuffer = await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 20, g: 20, b: 20 } },
  })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toBuffer()

  // Save to uploads/ so the existing media route can serve it
  const outFilename = `collage_${uuidv4()}.jpg`
  fs.writeFileSync(path.join(uploadsDir, outFilename), collageBuffer)

  return NextResponse.json({
    storedFilename: outFilename,
    url: `/api/media/${sessionId}/${outFilename}`,
    width: W,
    height: H,
  })
}

function buildCells(layout: Layout, count: number, W: number, H: number, gap: number) {
  const g = gap
  type Cell = { x: number; y: number; w: number; h: number }

  switch (layout) {
    case '2x1': {
      const w = Math.floor((W - g) / 2)
      return [
        { x: 0, y: 0, w, h: H },
        { x: w + g, y: 0, w: W - w - g, h: H },
      ] as Cell[]
    }
    case '1x2': {
      const h = Math.floor((H - g) / 2)
      return [
        { x: 0, y: 0, w: W, h },
        { x: 0, y: h + g, w: W, h: H - h - g },
      ] as Cell[]
    }
    case '2x2': {
      const w = Math.floor((W - g) / 2)
      const h = Math.floor((H - g) / 2)
      return ([
        { x: 0, y: 0, w, h },
        { x: w + g, y: 0, w: W - w - g, h },
        { x: 0, y: h + g, w, h: H - h - g },
        { x: w + g, y: h + g, w: W - w - g, h: H - h - g },
      ] as Cell[]).slice(0, count)
    }
    case 'L+2': {
      const bigW = Math.floor(W * 0.6)
      const smallW = W - bigW - g
      const h = Math.floor((H - g) / 2)
      return ([
        { x: 0, y: 0, w: bigW, h: H },
        { x: bigW + g, y: 0, w: smallW, h },
        { x: bigW + g, y: h + g, w: smallW, h: H - h - g },
      ] as Cell[]).slice(0, count)
    }
    case '2+1': {
      const w = Math.floor((W - g) / 2)
      const bigH = Math.floor(H * 0.55)
      return ([
        { x: 0, y: 0, w, h: bigH },
        { x: w + g, y: 0, w: W - w - g, h: bigH },
        { x: 0, y: bigH + g, w: W, h: H - bigH - g },
      ] as Cell[]).slice(0, count)
    }
    case '3x2':
    default: {
      const cols = 3
      const rows = 2
      const cw = Math.floor((W - (cols - 1) * g) / cols)
      const rh = Math.floor((H - (rows - 1) * g) / rows)
      const cells: Cell[] = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({ x: c * (cw + g), y: r * (rh + g), w: cw, h: rh })
        }
      }
      return cells.slice(0, count)
    }
  }
}
