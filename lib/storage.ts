import fs from 'fs'
import path from 'path'
import { env } from './env'

export function sessionDir(sessionId: string, subdir?: string): string {
  const base = path.join(env.uploadDir, sessionId)
  return subdir ? path.join(base, subdir) : base
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

export function saveFile(
  sessionId: string,
  subdir: string,
  filename: string,
  data: Buffer,
): string {
  const dir = sessionDir(sessionId, subdir)
  ensureDir(dir)
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, data)
  return filePath
}

export function getFilePath(sessionId: string, subdir: string, filename: string): string {
  return path.join(sessionDir(sessionId, subdir), filename)
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

export function deleteSession(sessionId: string): void {
  const dir = sessionDir(sessionId)
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

export function writeLock(sessionId: string, name: string): void {
  const dir = sessionDir(sessionId)
  ensureDir(dir)
  fs.writeFileSync(path.join(dir, `${name}.lock`), Date.now().toString())
}

export function lockExists(sessionId: string, name: string): boolean {
  return fs.existsSync(path.join(sessionDir(sessionId), `${name}.lock`))
}
