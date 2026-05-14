import client from './client'
import { ENDPOINTS } from './endpoints'

export interface CreditPlan {
  id: number
  slug: string
  name: string
  credits_per_month: number
  price_usd: string
  stripe_price_id: string
  features: string[]
  is_active: boolean
}

export interface StripePrice {
  price_id: string
  amount: number
  currency: string
  interval: string
  active: boolean
}

export interface CreateStripePriceRequest {
  name: string
  price_usd: number
  interval: 'month' | 'year'
}

export const adminService = {
  getPlans: () =>
    client.get<CreditPlan[]>(ENDPOINTS.credits.plans).then(r => r.data),

  createPlan: (data: Omit<CreditPlan, 'id'>) =>
    client.post<CreditPlan>(ENDPOINTS.credits.plans, data).then(r => r.data),

  updatePlan: (id: number, data: Partial<Omit<CreditPlan, 'id'>>) =>
    client.put<CreditPlan>(ENDPOINTS.credits.planDetail(id), data).then(r => r.data),

  deletePlan: (id: number) =>
    client.delete(ENDPOINTS.credits.planDetail(id)),

  getStripePrices: () =>
    client.get<StripePrice[]>(ENDPOINTS.credits.stripePrices).then(r => r.data),

  createStripePrice: (data: CreateStripePriceRequest) =>
    client.post<{ stripe_price_id: string }>(ENDPOINTS.credits.stripePrices, data).then(r => r.data),

  deleteStripePrice: (priceId: string) =>
    client.delete(ENDPOINTS.credits.stripePriceDetail(priceId)).then(r => r.data),
}
