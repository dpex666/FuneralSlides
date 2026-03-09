import jwt from 'jsonwebtoken'
import { env } from './env'
import type { QualityTier } from '@/types/slideshow'

export interface DownloadTokenPayload {
  sessionId: string
  quality: QualityTier
}

export function signDownloadToken(payload: DownloadTokenPayload): string {
  return jwt.sign(payload, env.sessionSecret, { expiresIn: '24h' })
}

export function verifyDownloadToken(token: string): DownloadTokenPayload {
  return jwt.verify(token, env.sessionSecret) as DownloadTokenPayload
}
