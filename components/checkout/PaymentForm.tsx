'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useSlideshowStore } from '@/store/slideshowStore'
import type { QualityTier } from '@/types/slideshow'
import { QUALITY_LABELS, PRICE_MAP } from '@/types/slideshow'
import { useRouter } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

function CheckoutForm({ quality }: { quality: QualityTier }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    })

    if (result.error) {
      setError(result.error.message ?? 'Payment failed')
      setLoading(false)
    }
    // On success, Stripe redirects to return_url
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)]">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3.5 bg-[var(--gold)] hover:bg-[var(--gold-light)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--bg)] font-semibold rounded-xl transition-colors"
      >
        {loading ? 'Processing…' : `Pay $${(PRICE_MAP[quality] / 100).toFixed(2)} · ${QUALITY_LABELS[quality]}`}
      </button>

      <p className="text-xs text-[var(--text-muted)] text-center">
        Secured by Stripe · Your card details are never stored on our servers
      </p>
    </form>
  )
}

export default function PaymentForm() {
  const { quality, sessionId, getConfig, setPaymentIntentSecret, paymentIntentClientSecret } =
    useSlideshowStore()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (paymentIntentClientSecret || creating) return
    setCreating(true)

    const config = getConfig()
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quality,
        sessionId,
        configJson: JSON.stringify(config),
      }),
    })
      .then((r) => r.json())
      .then((data: { clientSecret?: string }) => {
        if (data.clientSecret) setPaymentIntentSecret(data.clientSecret)
      })
      .catch(() => {})
      .finally(() => setCreating(false))
  }, [quality, sessionId, paymentIntentClientSecret, creating, getConfig, setPaymentIntentSecret])

  if (!paymentIntentClientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: paymentIntentClientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#c9a84c',
            colorBackground: '#1f2330',
            colorText: '#e8e3dc',
            colorDanger: '#f87171',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm quality={quality} />
    </Elements>
  )
}
