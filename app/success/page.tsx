'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSlideshowStore } from '@/store/slideshowStore'

type ExportStatus = 'pending' | 'processing' | 'ready' | 'error'

function SuccessContent() {
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
  const { downloadToken, exportJobId, startExportPoll } = useSlideshowStore()
  const [status, setStatus] = useState<ExportStatus>('pending')

  useEffect(() => {
    if (downloadToken) {
      setStatus('ready')
      return
    }

    if (exportJobId) {
      setStatus('processing')
      startExportPoll(exportJobId)
    }
  }, [downloadToken, exportJobId, startExportPoll])

  useEffect(() => {
    if (downloadToken) setStatus('ready')
  }, [downloadToken])

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="max-w-md mx-auto px-6 text-center space-y-6">
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 mx-auto border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
            <div>
              <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-2">Payment received</h1>
              <p style={{ color: 'var(--text-muted)' }}>Preparing your tribute video…</p>
            </div>
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
            <div>
              <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-2">Rendering your tribute</h1>
              <p style={{ color: 'var(--text-muted)' }}>
                This usually takes 1–3 minutes depending on length and quality.
                Please keep this page open.
              </p>
            </div>
          </>
        )}

        {status === 'ready' && downloadToken && (
          <>
            <div style={{ backgroundColor: 'var(--gold)', borderRadius: '9999px', width: '4rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mx-auto">
              <svg className="w-8 h-8 text-[var(--bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-2">Your tribute is ready</h1>
              <p style={{ color: 'var(--text-muted)' }} className="mb-6">
                Your high-quality, watermark-free video is ready to download.
              </p>
              <a
                href={`/api/download/${downloadToken}`}
                download
                style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)' }}
                className="inline-block px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Download Your Tribute Video
              </a>
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              This link is valid for 24 hours
            </p>
            <Link href="/" style={{ color: 'var(--text-muted)' }} className="text-sm hover:underline">
              Return to home
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ backgroundColor: '#7f1d1d', borderRadius: '9999px', width: '4rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mx-auto">
              <svg className="w-8 h-8 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Please contact support with your payment reference: <span style={{ color: 'var(--gold)' }}>{paymentIntentId}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
