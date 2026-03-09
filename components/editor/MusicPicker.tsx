'use client'

import { useEffect, useRef, useState } from 'react'
import { useSlideshowStore } from '@/store/slideshowStore'
import type { MusicTrack } from '@/types/slideshow'

export default function MusicPicker() {
  const { music, setMusic, sessionId } = useSlideshowStore()
  const [tab, setTab] = useState<'library' | 'custom'>('library')
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [playing, setPlaying] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then((data: MusicTrack[]) => setTracks(data))
      .catch(() => {})
  }, [])

  // Web-Audio nodes used when no real MP3 file is available
  const synthRef = useRef<{ ctx: AudioContext; nodes: AudioNode[] } | null>(null)

  const stopSynth = () => {
    if (synthRef.current) {
      synthRef.current.nodes.forEach((n) => {
        try { (n as OscillatorNode).stop?.() } catch { /* already stopped */ }
      })
      synthRef.current.ctx.close()
      synthRef.current = null
    }
  }

  /** Play a gentle arpeggio unique to each track using Web Audio API */
  const playSynth = (track: MusicTrack) => {
    stopSynth()
    // Each track gets a slightly different base note
    const bases = [261.63, 293.66, 329.63, 349.23, 392.0]
    const trackIndex = tracks.findIndex((t) => t.id === track.id)
    const root = bases[trackIndex % bases.length]
    // Pentatonic intervals: unison, major 2nd, major 3rd, perfect 5th, major 6th
    const ratios = [1, 9/8, 5/4, 3/2, 5/3]
    const ctx = new AudioContext()
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime)
    masterGain.connect(ctx.destination)
    const nodes: AudioNode[] = [masterGain]
    // Play notes one at a time in a gentle arpeggio, 0.6 s apart
    ratios.forEach((ratio, i) => {
      const osc = ctx.createOscillator()
      const envGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = root * ratio
      const t0 = ctx.currentTime + i * 0.6
      envGain.gain.setValueAtTime(0, t0)
      envGain.gain.linearRampToValueAtTime(1, t0 + 0.05)
      envGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.8)
      osc.connect(envGain)
      envGain.connect(masterGain)
      osc.start(t0)
      osc.stop(t0 + 1.9)
      osc.onended = () => {
        if (i === ratios.length - 1) {
          setPlaying(null)
          stopSynth()
        }
      }
      nodes.push(osc, envGain)
    })
    synthRef.current = { ctx, nodes }
    setPlaying(track.id)
  }

  const playTrack = (track: MusicTrack) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    stopSynth()

    if (playing === track.id) {
      setPlaying(null)
      return
    }
    // Try real file first; fall back to synth if unavailable
    const audio = new Audio(`/music/${track.filename}`)
    audio.onended = () => setPlaying(null)
    audio.play().then(() => {
      audioRef.current = audio
      setPlaying(track.id)
    }).catch(() => {
      // File not available — play synthesised preview
      playSynth(track)
    })
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
      <div className="flex gap-1 bg-[var(--neutral-highlight)] rounded-lg p-1">
        <button
          onClick={() => setTab('library')}
          className={`flex-1 py-1.5 rounded text-sm transition-colors ${
            tab === 'library' ? 'bg-[var(--neutral-deep-highlight)] text-[var(--neutral-text)]' : 'text-[var(--neutral-muted)]'
          }`}
        >
          Music Library
        </button>
        <button
          onClick={() => setTab('custom')}
          className={`flex-1 py-1.5 rounded text-sm transition-colors ${
            tab === 'custom' ? 'bg-[var(--neutral-deep-highlight)] text-[var(--neutral-text)]' : 'text-[var(--neutral-muted)]'
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
                  ? 'bg-[var(--funeral-primary)]/10 border border-[var(--funeral-primary)]/30'
                  : 'hover:bg-[var(--neutral-deep-highlight)]'
              }`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); playTrack(track) }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--neutral-deep-highlight)] hover:bg-[var(--neutral-deep-highlight)] flex-shrink-0"
              >
                {playing === track.id ? (
                  <svg className="w-3 h-3 text-[var(--funeral-primary)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-[var(--neutral-muted)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${music.trackId === track.id ? 'text-[var(--funeral-primary)]' : 'text-[var(--neutral-text)]'}`}>
                  {track.title}
                </p>
              </div>
              <span className="text-xs text-[var(--neutral-muted)]">{formatDuration(track.durationSeconds)}</span>
              {music.trackId === track.id && (
                <svg className="w-4 h-4 text-[var(--funeral-primary)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Copyright permission checkbox — must be ticked before upload is enabled */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={hasPermission}
              onChange={(e) => setHasPermission(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[var(--funeral-primary)] flex-shrink-0 cursor-pointer"
            />
            <span className="text-sm text-[var(--neutral-muted)] leading-snug group-hover:text-[var(--neutral-text)] transition-colors">
              I confirm that I have the right to use this audio in my tribute (e.g. I own it, have a licence, or it is royalty-free).
            </span>
          </label>

          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-opacity ${hasPermission ? 'opacity-100' : 'opacity-40 pointer-events-none'}`} style={{ borderColor: 'var(--neutral-deep-highlight)' }}>
            <p className="text-[var(--neutral-muted)] text-sm mb-3">
              {music.source === 'custom' && music.customAudioFilename
                ? '✓ Custom audio selected — upload a new file to replace'
                : 'Upload your audio file (MP3, WAV, OGG)'}
            </p>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
              disabled={!hasPermission}
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
              className="text-sm text-[var(--neutral-muted)] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[var(--neutral-deep-highlight)] file:text-[var(--neutral-text)] file:cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-[var(--neutral-muted)] flex-shrink-0">Volume</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={music.volume}
          onChange={(e) => setMusic({ volume: Number(e.target.value) })}
          className="flex-1 accent-[var(--funeral-primary)]"
        />
        <span className="text-sm text-[var(--neutral-muted)] w-8">{Math.round(music.volume * 100)}%</span>
      </div>
    </div>
  )
}
