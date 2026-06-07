import { useState } from 'react'
import { clientService, type CreditPlan, type PaymentMethod } from '../api/client.service'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuthStore } from '../store/auth.store'
import { authService } from '../api/authService'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '')

type Step = 'plans' | 'payment-methods' | 'new-card' | 'processing' | 'success' | 'error'

interface Props {
  show: boolean
  onClose: () => void
  onSuccess: (planName: string) => void
}

// ── Stripe card form ──────────────────────────────────────────────────────────
function CardForm({ onSuccess, onCancel }: { onSuccess: (pmId: string) => void; onCancel: () => void }) {
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
      if (stripeErr) { setError(stripeErr.message ?? 'Error al agregar tarjeta') }
      else           { onSuccess(paymentMethod.id) }
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg px-4 py-4" style={{ background: '#121212', border: '1px solid #2a2a2a' }}>
        <CardElement options={{ style: { base: { fontSize: '14px', color: '#fff', fontFamily: 'inherit', '::placeholder': { color: '#6b7280' } }, invalid: { color: '#ef4444' } } }} />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handleSubmit} disabled={loading || !stripe}
        className="w-full py-3 rounded-lg text-sm font-bold disabled:opacity-50"
        style={{ background: '#A855F7', color: 'white' }}>
        {loading ? 'Agregando...' : 'Agregar tarjeta'}
      </button>
      <button onClick={onCancel} className="text-xs py-2 text-muted hover:text-white transition-colors" style={{ background: 'transparent' }}>
        Cancelar
      </button>
    </div>
  )
}

// ── UpgradeModal ──────────────────────────────────────────────────────────────
export default function UpgradeModal({ show, onClose, onSuccess }: Props) {
  const [step, setStep]                         = useState<Step>('plans')
  const [plans, setPlans]                       = useState<CreditPlan[]>([])
  const [methods, setMethods]                   = useState<PaymentMethod[]>([])
  const [selectedPlan, setSelectedPlan]         = useState<CreditPlan | null>(null)
  const [loadingPlans, setLoadingPlans]         = useState(false)
  const [loadingMethods, setLoadingMethods]     = useState(false)
  const [loadingPayment, setLoadingPayment]     = useState(false)
  const [errorMsg, setErrorMsg]                 = useState('')

  if (show && plans.length === 0 && !loadingPlans) {
    setLoadingPlans(true)
    clientService.getPlans().then(setPlans).finally(() => setLoadingPlans(false))
  }

  async function handleSelectPlan(plan: CreditPlan) {
    setSelectedPlan(plan)
    setStep('payment-methods')
    setLoadingMethods(true)
    try { setMethods(await clientService.getPaymentMethods()) }
    catch { setMethods([]) }
    finally { setLoadingMethods(false) }
  }

  const { setUser } = useAuthStore()

  async function handleCardAdded(pmId: string) {
    setLoadingMethods(true)
    try {
      await clientService.savePaymentMethod(pmId)
      setMethods(await clientService.getPaymentMethods())
      setStep('payment-methods')
    } catch (e: unknown) {
      setErrorMsg((e as { message?: string })?.message ?? 'No se pudo agregar la tarjeta.')
      setStep('error')
    } finally { setLoadingMethods(false) }
  }

  async function handlePay(pm: PaymentMethod) {
    if (!selectedPlan) return
    setStep('processing')
    setLoadingPayment(true)
    try {
      await clientService.makePayment(pm.stripe_payment_method_id, parseFloat(selectedPlan.price_usd), selectedPlan.slug)
      const profile = await authService.getProfile()
      setUser(profile)
      onSuccess(selectedPlan.name.toUpperCase())
      setStep('success')
    } catch (e: unknown) {
      setErrorMsg((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al procesar el pago.')
      setStep('error')
    } finally { setLoadingPayment(false) }
  }

  function handleClose() {
    onClose()
    setStep('plans')
    setSelectedPlan(null)
    setErrorMsg('')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={handleClose}>
      <div className="rounded-2xl p-5 sm:p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} onClick={e => e.stopPropagation()}>

        {/* ── PLANES ── */}
        {step === 'plans' && (
          <>
            <h2 className="text-white text-2xl font-black text-center mb-2">Elige tu plan</h2>
            <p className="text-center text-xs mb-8 text-muted">Desbloquea todo el potencial de MusicGen</p>
            {loadingPlans ? (
              <p className="text-center text-muted text-sm">Cargando planes...</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {plans.map(plan => {
                  const isPaid = plan.slug === 'pro' || plan.slug === 'studio'
                  return (
                    <div key={plan.id} className="rounded-xl p-4 flex flex-col gap-2.5 relative"
                      style={{ background: isPaid ? 'linear-gradient(135deg,#2d1b69 0%,#1a1040 100%)' : '#121212', border: isPaid ? '1px solid #A855F7' : '1px solid #2a2a2a' }}>
                      {isPaid && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#A855F7', color: 'white' }}>POPULAR</span>}
                      <div>
                        <h3 className="text-white font-black text-base">{plan.name}</h3>
                        <div className="flex items-end gap-1 mt-1">
                          <span className="text-white text-2xl font-black">${plan.price_usd}</span>
                          <span className="text-muted text-xs mb-0.5">/mes</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1 text-xs text-muted">
                        <p><span className="text-primary">✓</span> {plan.credits_per_month} créditos/mes</p>
                        {plan.features.map((f, i) => <p key={i}><span className="text-primary">✓</span> {f}</p>)}
                      </div>
                      <button
                        onClick={() => isPaid ? handleSelectPlan(plan) : undefined}
                        disabled={!isPaid}
                        className="mt-2 w-full py-2.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: isPaid ? '#A855F7' : '#2a2a2a', color: isPaid ? 'white' : '#6b7280', cursor: isPaid ? 'pointer' : 'default' }}>
                        {isPaid ? `Suscribirse a ${plan.name}` : 'Plan actual'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={handleClose} className="mt-6 w-full text-xs py-2 rounded-lg text-muted" style={{ background: 'transparent' }}>Cerrar</button>
          </>
        )}

        {/* ── MÉTODOS DE PAGO ── */}
        {step === 'payment-methods' && (
          <>
            <button onClick={() => setStep('plans')} className="text-muted text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors">← Volver</button>
            <h2 className="text-white text-xl font-black mb-1">Selecciona una tarjeta</h2>
            <p className="text-xs mb-6 text-muted">{selectedPlan?.name} — <span className="text-white font-bold">${selectedPlan?.price_usd}/mes</span></p>
            {loadingMethods ? (
              <p className="text-center text-muted text-sm">Cargando tarjetas...</p>
            ) : methods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted text-sm mb-4">No tenés tarjetas guardadas</p>
                <button onClick={() => setStep('new-card')} className="px-6 py-2.5 rounded-lg text-sm font-bold" style={{ background: '#A855F7', color: 'white' }}>+ Agregar tarjeta</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-4">
                  {methods.map(pm => (
                    <div key={pm.id} className="flex items-center justify-between rounded-xl px-5 py-4" style={{ background: '#121212', border: '1px solid #2a2a2a' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💳</span>
                        <div>
                          <p className="text-white text-sm font-bold capitalize">{pm.brand} •••• {pm.last4}</p>
                          <p className="text-xs text-muted">Vence {pm.exp_month}/{pm.exp_year}</p>
                        </div>
                      </div>
                      <button onClick={() => handlePay(pm)} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: '#A855F7', color: 'white' }}>
                        Pagar
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep('new-card')} className="w-full py-2.5 rounded-lg text-xs font-bold" style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#a7a7a7' }}>
                  + Agregar nueva tarjeta
                </button>
              </>
            )}
          </>
        )}

        {/* ── NUEVA TARJETA ── */}
        {step === 'new-card' && (
          <>
            <button onClick={() => setStep('payment-methods')} className="text-muted text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors">← Volver</button>
            <h2 className="text-white text-xl font-black mb-2">Agregar tarjeta</h2>
            <p className="text-xs mb-6 text-muted">Tus datos están protegidos por Stripe.</p>
            <Elements stripe={stripePromise}>
              <CardForm onSuccess={handleCardAdded} onCancel={() => setStep('payment-methods')} />
            </Elements>
          </>
        )}

        {/* ── PROCESANDO ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: '#A855F7', borderTopColor: 'transparent' }} />
            <p className="text-white font-bold">Procesando pago...</p>
            <p className="text-xs text-muted">No cierres esta ventana</p>
          </div>
        )}

        {/* ── ÉXITO ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white" style={{ background: 'linear-gradient(135deg,#A855F7 0%,#7C3AED 100%)' }}>✓</div>
            <h2 className="text-white text-2xl font-black">¡Pago exitoso!</h2>
            <p className="text-xs text-muted">Tu suscripción está activa.</p>
            <button onClick={handleClose} className="mt-4 px-8 py-3 rounded-lg text-sm font-bold" style={{ background: '#A855F7', color: 'white' }}>Continuar</button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && !loadingPayment && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: '#2a2a2a', color: '#ef4444' }}>✗</div>
            <h2 className="text-white text-xl font-black">Error en el pago</h2>
            <p className="text-xs text-muted">{errorMsg}</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('payment-methods')} className="px-6 py-2.5 rounded-lg text-sm font-bold" style={{ background: '#A855F7', color: 'white' }}>Intentar de nuevo</button>
              <button onClick={handleClose} className="px-6 py-2.5 rounded-lg text-sm font-bold" style={{ background: '#2a2a2a', color: '#a7a7a7' }}>Cancelar</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
