import { Queue } from 'bullmq'
import { env } from './env'

const connection = { url: env.redisUrl }

export const previewQueue = new Queue('preview', { connection })
export const exportQueue = new Queue('export', { connection })
