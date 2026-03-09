'use client'

import { useEffect, useRef, useState } from 'react'
import { useSlideshowStore } from '@/store/slideshowStore'
import type { MusicTrack } from '@/types/slideshow'

export default function MusicPicker() {
  const { music, setMusic, sessionId } = useSlideshowStore()
  const [tab, setTab] = useState<'library' | 'custom'>('library')
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then((data: MusicTrack[]) => setTracks(data))
      .catch(() => {})
  }, [])

  const playTrack = (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playing === track.id) {
      setPlaying(null)
      return
    }
    const audio = new Audio(`/music/${track.filename}`)
    audio.onended = () => setPlaying(null)
    audio.play().catch(() => {})
    audioRef.current = audio
    setPlaying(track.id)
  }

  const selectTrack = (track: MusicTrack) => {
    setMusic({ source: 'library', trackId: track.id })
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-1">
        <button
          onClick={() => setTab('library')}
          className={`flex-1 py-1.5 rounded text-sm transition-colors ${
            tab === 'library' ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)]'
          }`}
        >
          Music Library
        </button>
        <button
          onClick={() => setTab('custom')}
          className={`flex-1 py-1.5 rounded text-sm transition-colors ${
            tab === 'custom' ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)]'
          }`}
        >
          Custom Audio
        </button>
      </div>

      {tab === 'library' ? (
        <div className="space-y-1">
          {tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => selectTrack(track)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                music.trackId === track.id
                  ? 'bg-[var(--gold)]/10 border border-[var(--gold)]/30'
                  : 'hover:bg-[var(--surface-2)]'
              }`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); playTrack(track) }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] flex-shrink-0"
              >
                {playing === track.id ? (
                  <svg className="w-3 h-3 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-[var(--text-muted)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${music.trackId === track.id ? 'text-[var(--gold)]' : 'text-[var(--text)]'}`}>
                  {track.title}
                </p>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{formatDuration(track.durationSeconds)}</span>
              {music.trackId === track.id && (
                <svg className="w-4 h-4 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center">
          <p className="text-[var(--text-muted)] text-sm">Custom audio upload</p>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file || !sessionId) return
              const fd = new FormData()
              fd.append('file', file)
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-session-id': sessionId },
                body: fd,
              })
              const data = await res.json() as { files: Array<{ storedFilename: string; url: string }> }
              if (data.files[0]) {
                setMusic({
                  source: 'custom',
                  customAudioFilename: data.files[0].storedFilename,
                  customAudioUrl: data.files[0].url,
                })
              }
            }}
            className="mt-3 text-sm text-[var(--text-muted)] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[var(--surface-2)] file:text-[var(--text)] file:cursor-pointer"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-[var(--text-muted)] flex-shrink-0">Volume</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={music.volume}
          onChange={(e) => setMusic({ volume: Number(e.target.value) })}
          className="flex-1 accent-[var(--gold)]"
        />
        <span className="text-sm text-[var(--text-muted)] w-8">{Math.round(music.volume * 100)}%</span>
      </div>
    </div>
  )
}
