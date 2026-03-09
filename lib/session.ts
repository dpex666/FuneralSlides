import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import { sessionDir } from './storage'

export function createSessionId(): string {
  return uuidv4()
}

export function sessionExists(sessionId: string): boolean {
  return fs.existsSync(sessionDir(sessionId))
}
