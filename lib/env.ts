const required = [
  'SESSION_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const

export function validateEnv() {
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export const env = {
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  uploadDir: process.env.UPLOAD_DIR ?? '/tmp/passingmoments',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
}
