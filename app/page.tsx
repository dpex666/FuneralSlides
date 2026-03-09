import Link from 'next/link'

const STEPS = [
  {
    number: '01',
    title: 'Upload Your Media',
    description: 'Add photos and videos from any device. We accept all common formats including HEIC from iPhone.',
  },
  {
    number: '02',
    title: 'Generate & Refine',
    description: 'Click Generate and watch your tribute come to life instantly. Reorder slides, pick music, and adjust timing to make it perfect.',
  },
  {
    number: '03',
    title: 'Download in HD',
    description: 'Pay once, download your watermark-free tribute video in 720p, 1080p, or 4K — yours to keep forever.',
  },
]

const PRICING = [
  { tier: '720p HD', price: '$9.99', description: 'Great for sharing online' },
  { tier: '1080p Full HD', price: '$14.99', description: 'Perfect for most screens', highlight: true },
  { tier: '4K Ultra HD', price: '$24.99', description: 'Cinema-quality for large displays' },
]

export default function Home() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)' }} className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--gold)', fontSize: '1.25rem', fontWeight: 700 }}>PassingMoments</span>
        </div>
        <Link
          href="/editor"
          style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)' }}
          className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Create a Tribute
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <p style={{ color: 'var(--gold)', fontSize: '0.875rem', letterSpacing: '0.1em' }} className="uppercase font-semibold mb-4">
          Honour their memory
        </p>
        <h1 style={{ color: 'var(--text)', lineHeight: 1.15 }} className="text-5xl font-bold mb-6">
          Beautiful memorial slideshows,<br />
          <span style={{ color: 'var(--gold)' }}>in minutes</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', lineHeight: 1.7 }} className="max-w-2xl mx-auto mb-10">
          Upload your photos and videos, and PassingMoments creates a heartfelt tribute video automatically.
          Refine it as much — or as little — as you like, then download in full HD quality.
        </p>
        <Link
          href="/editor"
          style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)' }}
          className="inline-block px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Create Your Tribute — Free to Preview
        </Link>
        <p style={{ color: 'var(--text-muted)' }} className="mt-4 text-sm">
          No account needed · Pay only when you download
        </p>
      </section>

      {/* Steps */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }} className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 style={{ color: 'var(--text)' }} className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '2rem' }} className="mb-3">
                  {step.number}
                </div>
                <h3 style={{ color: 'var(--text)' }} className="font-semibold text-lg mb-2">{step.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }} className="text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <h2 style={{ color: 'var(--text)' }} className="text-2xl font-bold text-center mb-3">Simple, honest pricing</h2>
        <p style={{ color: 'var(--text-muted)' }} className="text-center text-sm mb-10">Preview for free. Pay once when you&apos;re happy.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {PRICING.map((p) => (
            <div
              key={p.tier}
              style={{
                backgroundColor: p.highlight ? 'var(--gold)' : 'var(--surface)',
                border: p.highlight ? 'none' : '1px solid var(--border)',
                color: p.highlight ? 'var(--bg)' : 'var(--text)',
              }}
              className="rounded-xl p-6 text-center"
            >
              <p className="font-semibold text-lg mb-1">{p.tier}</p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }} className="mb-2">{p.price}</p>
              <p style={{ opacity: 0.7 }} className="text-sm">{p.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/editor"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--bg)' }}
            className="inline-block px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Start Creating
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }} className="py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} PassingMoments · Crafted with care</p>
      </footer>
    </div>
  )
}
