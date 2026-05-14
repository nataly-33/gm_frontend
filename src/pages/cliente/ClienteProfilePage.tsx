import { useRef, useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../api/authService'
import { clientService, type PaymentMethod } from '../../api/client.service'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '')

// ── Hook payment methods ──────────────────────────────────────────────────────
function usePaymentMethods() {
  const [methods,  setMethods]  = useState<PaymentMethod[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try   { setMethods(await clientService.getPaymentMethods()) }
    catch { setError('No se pudieron cargar las tarjetas') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const add = async (pmId: string) => {
    setLoading(true)
    try   { const pm = await clientService.savePaymentMethod(pmId); setMethods(prev => [...prev, pm]) }
    catch (e: unknown) { setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al agregar tarjeta') }
    finally { setLoading(false) }
  }

  const remove = async (id: number) => {
    setLoading(true)
    try   { await clientService.deletePaymentMethod(id); setMethods(prev => prev.filter(m => m.id !== id)) }
    catch { setError('Error al eliminar tarjeta') }
    finally { setLoading(false) }
  }

  return { methods, loading, error, add, remove, reload: load }
}

// ── Stripe card form ──────────────────────────────────────────────────────────
function AddCardForm({ onSuccess, onCancel }: { onSuccess: (pmId: string) => void; onCancel: () => void }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit() {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    try {
      const cardEl = elements.getElement(CardElement)!
      const { error: stripeErr, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardEl })
      if (stripeErr) { setError(stripeErr.message ?? 'Error') }
      else           { onSuccess(paymentMethod.id) }
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-3 mt-4 p-4 bg-card rounded-lg">
      <div className="rounded-lg px-4 py-3" style={{ background: '#121212', border: '1px solid #2a2a2a' }}>
        <CardElement options={{ style: { base: { fontSize: '14px', color: '#fff', fontFamily: 'inherit', '::placeholder': { color: '#6b7280' } }, invalid: { color: '#ef4444' } } }} />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={loading || !stripe}
          className="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
          style={{ background: '#A855F7' }}>
          {loading ? 'Agregando...' : 'Agregar tarjeta'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-bold text-muted hover:text-white border border-card-hover">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── ClienteProfilePage ────────────────────────────────────────────────────────
export default function ClienteProfilePage() {
  const { user, setUser } = useAuthStore()
  const pm = usePaymentMethods()
  const fileRef = useRef<HTMLInputElement>(null)

  const [editando, setEditando] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)
  const [addingCard, setAddingCard] = useState(false)

  const [form, setForm] = useState({
    full_name:  user?.full_name  ?? '',
    avatar_url: user?.avatar_url ?? '',
  })

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, avatar_url: reader.result as string }))
    reader.readAsDataURL(file)
  }

  async function handleGuardar() {
    setLoading(true)
    setError(null)
    try {
      const payload: { full_name?: string; avatar_url?: string } = {}
      if (form.full_name  !== user?.full_name)        payload.full_name  = form.full_name
      if (form.avatar_url !== (user?.avatar_url ?? '')) payload.avatar_url = form.avatar_url
      await authService.updateProfile(payload)
      const actualizado = await authService.getProfile()
      setUser(actualizado)
      setEditando(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al guardar')
    } finally { setLoading(false) }
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="p-6 text-white max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-black">Mi perfil</h2>
        {success && <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/20 text-green-400">Guardado</span>}
      </div>

      {/* Avatar + datos */}
      <div className="bg-surface rounded-xl p-6 mb-6">
        <div className="flex items-center gap-5 mb-6">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" style={{ border: '2px solid #A855F7' }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black select-none"
              style={{ background: 'linear-gradient(135deg,#A855F7 0%,#7C3AED 100%)' }}>
              {initials}
            </div>
          )}
          {editando && (
            <>
              <button onClick={() => fileRef.current?.click()} className="text-xs px-4 py-2 rounded-lg border border-card-hover text-muted hover:text-white hover:border-primary transition-colors">
                Cambiar foto
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Nombre completo</label>
            {editando ? (
              <input name="full_name" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="bg-card-hover border border-transparent rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary text-white transition-colors" />
            ) : (
              <p className="text-white text-sm font-medium">{user?.full_name ?? '—'}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Email</label>
            <p className="text-white text-sm font-medium">{user?.email ?? '—'}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Créditos disponibles</label>
            <p className="text-primary text-lg font-black">{user?.credit_balance ?? 0}</p>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          {editando ? (
            <>
              <button onClick={handleGuardar} disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-black disabled:opacity-50"
                style={{ background: '#A855F7' }}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditando(false); setForm({ full_name: user?.full_name ?? '', avatar_url: user?.avatar_url ?? '' }) }}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-muted hover:text-white border border-card-hover">
                Cancelar
              </button>
            </>
          ) : (
            <button onClick={() => setEditando(true)} className="px-6 py-2.5 rounded-lg text-sm font-bold text-black" style={{ background: '#A855F7' }}>
              Editar perfil
            </button>
          )}
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="bg-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Métodos de pago</h3>
          <button onClick={() => setAddingCard(v => !v)}
            className="text-xs px-3 py-1.5 rounded-lg border border-card-hover text-muted hover:text-white hover:border-primary transition-colors">
            {addingCard ? 'Cancelar' : '+ Agregar tarjeta'}
          </button>
        </div>

        {pm.error && <p className="text-red-400 text-xs mb-3">{pm.error}</p>}

        {addingCard && (
          <Elements stripe={stripePromise}>
            <AddCardForm
              onSuccess={async pmId => { await pm.add(pmId); setAddingCard(false) }}
              onCancel={() => setAddingCard(false)}
            />
          </Elements>
        )}

        {pm.loading ? (
          <p className="text-muted text-sm">Cargando...</p>
        ) : pm.methods.length === 0 && !addingCard ? (
          <p className="text-muted text-sm">No tenés tarjetas guardadas.</p>
        ) : (
          <div className="flex flex-col gap-2 mt-3">
            {pm.methods.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-lg px-4 py-3 bg-card-hover">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <div>
                    <p className="text-white text-sm font-bold capitalize">{m.brand} •••• {m.last4}</p>
                    <p className="text-muted text-xs">Vence {m.exp_month}/{m.exp_year}</p>
                  </div>
                </div>
                <button onClick={() => pm.remove(m.id)} className="text-xs px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
