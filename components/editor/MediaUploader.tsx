'use client'

import { useCallback, useRef, useState } from 'react'
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
  // Keep File references so we can retry failed uploads
  const fileMapRef = useRef<Map<string, File>>(new Map())

  const uploadFile = async (file: File, sid: string): Promise<UploadedMedia | null> => {
    const formData = new FormData()
    formData.append('file', file)

    // Reset this file's state to uploading
    setUploads((prev) =>
      prev.map((u) => (u.name === file.name ? { ...u, progress: 0, done: false, error: undefined } : u)),
    )

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

  const getSid = () => {
    let sid = sessionId
    if (!sid) {
      initSession()
      sid = useSlideshowStore.getState().sessionId
    }
    return sid
  }

  const handleRetry = async (name: string) => {
    const file = fileMapRef.current.get(name)
    if (!file) return
    const sid = getSid()
    const result = await uploadFile(file, sid)
    if (result) {
      addMediaToSlides([result])
    }
  }

  const handleRemove = (name: string) => {
    fileMapRef.current.delete(name)
    setUploads((prev) => prev.filter((u) => u.name !== name))
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return

      const sid = getSid()

      // Store File references for retry, merge with existing list
      acceptedFiles.forEach((f) => fileMapRef.current.set(f.name, f))

      setUploads((prev) => {
        const existing = new Map(prev.map((u) => [u.name, u]))
        acceptedFiles.forEach((f) => {
          existing.set(f.name, { name: f.name, progress: 0, done: false })
        })
        return Array.from(existing.values())
      })

      const results = await Promise.all(acceptedFiles.map((f) => uploadFile(f, sid)))
      const successful = results.filter(Boolean) as UploadedMedia[]

      if (successful.length) {
        addMediaToSlides(successful)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-[var(--funeral-primary)] bg-[var(--funeral-primary)]/5'
            : 'border-[var(--neutral-deep-highlight)] hover:border-[var(--funeral-primary)]/50 hover:bg-[var(--neutral-highlight)]'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 text-[var(--neutral-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[var(--neutral-text)] font-medium">
            {isDragActive ? 'Drop files here' : 'Drop photos & videos here'}
          </p>
          <p className="text-[var(--neutral-muted)] text-sm">
            or click to browse · JPEG, PNG, WEBP, HEIC, MP4, MOV, WEBM · 50 MB max
          </p>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <div key={u.name} className="bg-[var(--neutral-highlight)] rounded-lg px-4 py-3">
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className="text-[var(--neutral-text)] text-sm truncate flex-1 min-w-0">{u.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.error ? (
                    <>
                      <span className="text-red-400 text-sm">{u.error}</span>
                      <button
                        onClick={() => handleRetry(u.name)}
                        title="Retry upload"
                        className="text-xs px-2 py-0.5 rounded border border-[var(--funeral-primary)] text-[var(--funeral-primary)] hover:bg-[var(--funeral-primary)]/10 transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => handleRemove(u.name)}
                        title="Remove"
                        className="text-[var(--neutral-muted)] hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[var(--neutral-muted)] text-sm">
                        {u.done ? 'Done' : `${u.progress}%`}
                      </span>
                      {u.done && (
                        <button
                          onClick={() => handleRemove(u.name)}
                          title="Dismiss"
                          className="text-[var(--neutral-muted)] hover:text-[var(--neutral-text)] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="h-1 bg-[var(--neutral-deep-highlight)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${u.error ? 'bg-red-500' : 'bg-[var(--funeral-primary)]'}`}
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
