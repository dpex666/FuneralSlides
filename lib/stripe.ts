import Stripe from 'stripe'
import { env } from './env'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.stripeSecretKey, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}
