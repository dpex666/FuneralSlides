'use client'

import { useSlideshowStore } from '@/store/slideshowStore'
import type { QualityTier } from '@/types/slideshow'
import { QUALITY_LABELS, PRICE_MAP } from '@/types/slideshow'

const QUALITY_DESCRIPTIONS: Record<QualityTier, string> = {
  sd: 'Great for sharing online and social media',
  hd: 'Perfect for most screens and presentations',
  '4k': 'Cinema quality — ideal for large displays',
}

export default function QualitySelector() {
  const { quality, setQuality } = useSlideshowStore()
  const tiers: QualityTier[] = ['sd', 'hd', '4k']

  return (
    <div className="space-y-3">
      {tiers.map((tier) => (
        <button
          key={tier}
          onClick={() => setQuality(tier)}
          className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-colors ${
            quality === tier
              ? 'border-[var(--gold)] bg-[var(--gold)]/5'
              : 'border-[var(--border)] hover:border-[var(--gold)]/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className={`font-semibold ${quality === tier ? 'text-[var(--gold)]' : 'text-[var(--text)]'}`}>
                {QUALITY_LABELS[tier]}
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{QUALITY_DESCRIPTIONS[tier]}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-lg font-bold text-[var(--text)]">
                ${(PRICE_MAP[tier] / 100).toFixed(2)}
              </span>
              {quality === tier && (
                <span className="text-xs bg-[var(--gold)] text-[var(--bg)] px-2 py-0.5 rounded-full font-medium">Selected</span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
