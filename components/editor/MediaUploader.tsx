'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSlideshowStore } from '@/store/slideshowStore'
import type { UploadedMedia } from '@/types/slideshow'

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
}

interface FileProgress {
  name: string
  progress: number
  done: boolean
  error?: string
}

export default function MediaUploader() {
  const { sessionId, initSession, addMediaToSlides } = useSlideshowStore()
  const [uploads, setUploads] = useState<FileProgress[]>([])
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File, sid: string): Promise<UploadedMedia | null> => {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')
      xhr.setRequestHeader('x-session-id', sid)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setUploads((prev) =>
            prev.map((u) => (u.name === file.name ? { ...u, progress: pct } : u)),
          )
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText) as { files: UploadedMedia[] }
          setUploads((prev) =>
            prev.map((u) => (u.name === file.name ? { ...u, progress: 100, done: true } : u)),
          )
          resolve(data.files[0] ?? null)
        } else {
          setUploads((prev) =>
            prev.map((u) =>
              u.name === file.name ? { ...u, error: 'Upload failed', done: true } : u,
            ),
          )
          resolve(null)
        }
      }

      xhr.onerror = () => {
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name ? { ...u, error: 'Network error', done: true } : u,
          ),
        )
        resolve(null)
      }

      xhr.send(formData)
    })
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return

      let sid = sessionId
      if (!sid) {
        initSession()
        sid = useSlideshowStore.getState().sessionId
      }

      setUploads(acceptedFiles.map((f) => ({ name: f.name, progress: 0, done: false })))
      setUploading(true)

      const results = await Promise.all(acceptedFiles.map((f) => uploadFile(f, sid)))
      const successful = results.filter(Boolean) as UploadedMedia[]

      if (successful.length) {
        addMediaToSlides(successful)
      }

      setUploading(false)
    },
    [sessionId, initSession, addMediaToSlides],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-[var(--gold)] bg-[var(--gold)]/5'
            : 'border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--surface)]'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[var(--text)] font-medium">
            {isDragActive ? 'Drop files here' : 'Drop photos & videos here'}
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            or click to browse — JPEG, PNG, WEBP, HEIC, MP4, MOV, WEBM · 50 MB max per file
          </p>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <div key={u.name} className="bg-[var(--surface)] rounded-lg px-4 py-3">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-[var(--text)] truncate max-w-xs">{u.name}</span>
                <span className={u.error ? 'text-red-400' : 'text-[var(--text-muted)]'}>
                  {u.error ?? (u.done ? 'Done' : `${u.progress}%`)}
                </span>
              </div>
              <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${u.error ? 'bg-red-500' : 'bg-[var(--gold)]'}`}
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
