import client from './client'
import { ENDPOINTS } from './endpoints'

export interface CreditPlan {
  id: number
  slug: string
  name: string
  credits_per_month: number
  price_usd: string
  features: string[]
  is_active: boolean
}

export interface PaymentMethod {
  id: number
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  is_default: boolean
  created_at: string
  stripe_payment_method_id: string
}

export interface Payment {
  id: number
  amount: string
  currency: string
  stripe_payment_intent_id: string
  status: string
  created_at: string
}

export const clientService = {
  getPlans: () => client.get<CreditPlan[]>(ENDPOINTS.credits.plans).then((r) => r.data),

  getPaymentMethods: () =>
    client.get<PaymentMethod[]>(ENDPOINTS.credits.paymentMethods).then((r) => r.data),

  savePaymentMethod: (paymentMethodId: string) =>
    client
      .post<PaymentMethod>(ENDPOINTS.credits.paymentMethods, {
        payment_method_id: paymentMethodId,
      })
      .then((r) => r.data),

  deletePaymentMethod: (id: number) =>
    client.delete(ENDPOINTS.credits.paymentMethodDetail(id)).then((r) => r.data),

  makePayment: (paymentMethodId: string, amount: number, planSlug: string, currency = 'usd') =>
    client
      .post<Payment>(ENDPOINTS.credits.pay, {
        payment_method_id: paymentMethodId,
        amount,
        plan_slug: planSlug,
        currency,
      })
      .then((r) => r.data),

  getPayments: () => client.get<Payment[]>(ENDPOINTS.credits.pay).then((r) => r.data),
}
