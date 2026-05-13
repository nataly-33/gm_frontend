import client from './client'

export interface Plan {
  id: string
  nombre: string
  precio: number
  creditoPorMes: number
  creditoIlimitado: boolean
  stripePriceId: string
}

export interface Tarjeta {
  id: string
  usuarioId: string
  stripePaymentMethodId: string
  stripeCustomerId: string
  brand: string
  last4: number
  expMonth: number
  expYear: number
}

export interface Pago {
  id: string
  usuarioId: string
  monto: number
  moneda: string
  stripePaymentIntentId: string
  estado: string
  createdAt: string
}

export const clientService = {
  // ── Planes ─────────────────────────────────────
  getPlanes: () =>
    client.get<Plan[]>('/planes').then(r => r.data),

  getPlanById: (id: string) =>
    client.get<Plan>(`/planes/${id}`).then(r => r.data),

  // ── Tarjetas ────────────────────────────────────
  getTarjetas: (usuarioId: string) =>
    client.get<Tarjeta[]>(`/tarjetas/usuario/${usuarioId}`).then(r => r.data),

  crearTarjeta: (usuarioId: string, paymentMethodId: string) =>
    client.post<Tarjeta>('/tarjetas', { usuarioId, paymentMethodId }).then(r => r.data),

  eliminarTarjeta: (id: string) =>
    client.delete(`/tarjetas/${id}`).then(r => r.data),

  // ── Pagos ───────────────────────────────────────
  realizarPago: (usuarioId: string, paymentMethodId: string, monto: number, moneda = 'usd') =>
    client.post<Pago>('/pagos/realizar', { usuarioId, paymentMethodId, monto, moneda }).then(r => r.data),

  getPagos: (usuarioId: string) =>
    client.get<Pago[]>(`/pagos/usuario/${usuarioId}`).then(r => r.data),
  
}

