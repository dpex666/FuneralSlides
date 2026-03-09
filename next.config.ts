import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['fluent-ffmpeg', 'sharp', 'formidable', 'bullmq', 'ioredis', '@ffmpeg-installer/ffmpeg'],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
}

export default nextConfig
