import client from './client'

// ── Interfaces ────────────────────────────────────────

export interface Rol {
  id: string
  nombre: string
  descripcion: string
  esSystem: boolean
}

export interface Plan {
  id: string
  nombre: string
  precio: number
  creditoPorMes: number
  creditoIlimitado: boolean
  stripePriceId: string
}

export interface StripePrice {
  priceId: string
  amount: number
  currency: string
  intervalo: string
  activo: boolean
}

export interface CreateStripePriceRequest {
  nombre: string
  precio: number
  intervalo: 'month' | 'year'
}

// ── Roles ─────────────────────────────────────────────

export const adminService = {

  // Roles
  getRoles: () =>
    client.get<Rol[]>('/roles').then(r => r.data),

  createRol: (data: Omit<Rol, 'id'>) =>
    client.post<Rol>('/roles', data).then(r => r.data),

  updateRol: (id: string, data: Omit<Rol, 'id'>) =>
    client.put<Rol>(`/roles/${id}`, data).then(r => r.data),

  deleteRol: (id: string) =>
    client.delete(`/roles/${id}`),

  // Planes
  getPlanes: () =>
    client.get<Plan[]>('/planes').then(r => r.data),

  createPlan: (data: Omit<Plan, 'id'>) =>
    client.post<Plan>('/planes', data).then(r => r.data),

  updatePlan: (id: string, data: Omit<Plan, 'id'>) =>
    client.put<Plan>(`/planes/${id}`, data).then(r => r.data),

  deletePlan: (id: string) =>
    client.delete(`/planes/${id}`),

  // Stripe Prices
  getStripePrices: () =>
    client.get<StripePrice[]>('/planes/stripe/prices').then(r => r.data),

  createStripePrice: (data: CreateStripePriceRequest) =>
    client.post<{ stripePriceId: string }>('/planes/stripe/price', data).then(r => r.data),

  deleteStripePrice: (priceId: string) =>
    client.delete(`/planes/stripe/price/${priceId}`).then(r => r.data),
}