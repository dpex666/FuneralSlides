'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSlideshowStore } from '@/store/slideshowStore'
import QualitySelector from '@/components/checkout/QualitySelector'
import PaymentForm from '@/components/checkout/PaymentForm'
import { QUALITY_LABELS, PRICE_MAP } from '@/types/slideshow'

export default function CheckoutPage() {
  const { slides, previewUrl, quality } = useSlideshowStore()
  const router = useRouter()

  useEffect(() => {
    if (!slides.length || !previewUrl) {
      router.replace('/editor')
    }
  }, [slides, previewUrl, router])

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }} className="px-6 py-3 flex items-center gap-4">
        <Link href="/editor" style={{ color: 'var(--text-muted)' }} className="hover:text-[var(--text)] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>PassingMoments</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold mb-2">Complete your order</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            One-time payment · Instant download after purchase
          </p>
        </div>

        {/* Quality selector */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} className="p-5 space-y-4">
          <h2 style={{ color: 'var(--text)' }} className="font-semibold">Choose quality</h2>
          <QualitySelector />
        </div>

        {/* Order summary */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} className="p-5">
          <div className="flex justify-between items-center">
            <div>
              <p style={{ color: 'var(--text)' }} className="font-medium">PassingMoments Tribute Video</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">{QUALITY_LABELS[quality]}</p>
            </div>
            <p style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.25rem' }}>
              ${(PRICE_MAP[quality] / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Payment */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} className="p-5 space-y-4">
          <h2 style={{ color: 'var(--text)' }} className="font-semibold">Payment details</h2>
          <PaymentForm />
        </div>
      </div>
    </div>
  )
}
