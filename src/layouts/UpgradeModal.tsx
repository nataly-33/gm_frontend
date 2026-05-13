import { useState } from 'react'
import { clientService, type Plan, type Tarjeta } from '../api/client.service'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

type ModalStep = 'planes' | 'tarjetas' | 'nueva-tarjeta' | 'confirmando' | 'exito' | 'error'

interface Props {
  show: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

// ── Formulario Stripe ─────────────────────────────────────────────────────────
function FormularioTarjeta({
  onSuccess,
  onCancel,
}: {
  onSuccess: (pmId: string) => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    try {
      const cardElement = elements.getElement(CardElement)!
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })
      if (stripeError) {
        setError(stripeError.message ?? 'Error al agregar tarjeta')
      } else {
        onSuccess(paymentMethod.id)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg px-4 py-4" style={{ background: '#121212', border: '1px solid #2a2a2a' }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
                '::placeholder': { color: '#6b7280' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading || !stripe}
        className="w-full py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
        style={{ background: '#A855F7', color: 'white' }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#9333ea' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#A855F7' }}
      >
        {loading ? 'Agregando...' : 'Agregar tarjeta'}
      </button>
      <button
        onClick={onCancel}
        className="text-xs py-2 transition-colors hover:text-white"
        style={{ color: '#a7a7a7', background: 'transparent' }}
      >
        Cancelar
      </button>
    </div>
  )
}

// ── UpgradeModal ──────────────────────────────────────────────────────────────
export default function UpgradeModal({ show, onClose, onSuccess, userId }: Props) {
  const [step, setStep]                         = useState<ModalStep>('planes')
  const [planes, setPlanes]                     = useState<Plan[]>([])
  const [tarjetas, setTarjetas]                 = useState<Tarjeta[]>([])
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null)
  const [loadingPlanes, setLoadingPlanes]       = useState(false)
  const [loadingTarjetas, setLoadingTarjetas]   = useState(false)
  const [loadingPago, setLoadingPago]           = useState(false)
  const [errorMsg, setErrorMsg]                 = useState('')

  const brandIcon: Record<string, string> = { visa: '💳', mastercard: '💳', amex: '💳' }

  async function handleOpen() {
    if (planes.length === 0) {
      setLoadingPlanes(true)
      try {
        const data = await clientService.getPlanes()
        setPlanes(data)
      } finally {
        setLoadingPlanes(false)
      }
    }
  }

  // Se llama cuando el modal se monta (show cambia a true)
  if (show && planes.length === 0 && !loadingPlanes) {
    handleOpen()
  }

  async function handleSeleccionarPro(plan: Plan) {
    setPlanSeleccionado(plan)
    setStep('tarjetas')
    setLoadingTarjetas(true)
    try {
      const data = await clientService.getTarjetas(userId)
      setTarjetas(data)
    } catch {
      setTarjetas([])
    } finally {
      setLoadingTarjetas(false)
    }
  }

  async function handleTarjetaAgregada(pmId: string) {
    setLoadingTarjetas(true)
    try {
      await clientService.crearTarjeta(userId, pmId)
      const actualizadas = await clientService.getTarjetas(userId)
      setTarjetas(actualizadas)
      setStep('tarjetas')
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'No se pudo agregar la tarjeta.')
      setStep('error')
    } finally {
      setLoadingTarjetas(false)
    }
  }

  async function handlePagar(tarjeta: Tarjeta) {
    if (!planSeleccionado) return
    setStep('confirmando')
    setLoadingPago(true)
    try {
      await clientService.realizarPago(userId, tarjeta.stripePaymentMethodId, planSeleccionado.precio)
      onSuccess()
      setStep('exito')
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al procesar el pago.')
      setStep('error')
    } finally {
      setLoadingPago(false)
    }
  }

  function handleCerrar() {
    onClose()
    setStep('planes')
    setPlanSeleccionado(null)
    setErrorMsg('')
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={handleCerrar}
    >
      <div
        className="rounded-2xl p-8 w-full max-w-2xl"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* STEP: PLANES */}
        {step === 'planes' && (
          <>
            <h2 className="text-white text-2xl font-black text-center mb-2">Elige tu plan</h2>
            <p className="text-center text-xs mb-8" style={{ color: '#a7a7a7' }}>
              Desbloquea todo el potencial de MusicGen
            </p>
            {loadingPlanes ? (
              <p className="text-center text-muted text-sm">Cargando planes...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {planes.map(plan => {
                  const isPro = plan.nombre === 'pro'
                  return (
                    <div key={plan.id} className="rounded-xl p-6 flex flex-col gap-3 relative"
                      style={{
                        background: isPro ? 'linear-gradient(135deg, #2d1b69 0%, #1a1040 100%)' : '#121212',
                        border: isPro ? '1px solid #A855F7' : '1px solid #2a2a2a',
                      }}>
                      {isPro && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#A855F7', color: 'white' }}>POPULAR</span>
                      )}
                      <div>
                        <h3 className="text-white font-black text-lg capitalize">{plan.nombre}</h3>
                        <div className="flex items-end gap-1 mt-1">
                          <span className="text-white text-3xl font-black">${plan.precio}</span>
                          <span className="text-muted text-xs mb-1">/mes</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        {isPro ? (
                          <>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#a7a7a7' }}><span style={{ color: '#A855F7' }}>✓</span> Créditos ilimitados</p>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#a7a7a7' }}><span style={{ color: '#A855F7' }}>✓</span> Acceso a todas las funciones</p>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#a7a7a7' }}><span style={{ color: '#A855F7' }}>✓</span> Calidad de audio premium</p>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#a7a7a7' }}><span style={{ color: '#A855F7' }}>✓</span> Soporte prioritario</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#a7a7a7' }}><span style={{ color: '#A855F7' }}>✓</span> {plan.creditoPorMes} créditos/mes</p>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#a7a7a7' }}><span style={{ color: '#A855F7' }}>✓</span> Funciones básicas</p>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#6b7280' }}><span>✗</span> Funciones avanzadas</p>
                            <p className="text-xs flex items-center gap-2" style={{ color: '#6b7280' }}><span>✗</span> Soporte prioritario</p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => isPro ? handleSeleccionarPro(plan) : undefined}
                        className="mt-2 w-full py-2.5 rounded-lg text-xs font-bold transition-all duration-150"
                        style={{
                          background: isPro ? '#A855F7' : '#2a2a2a',
                          color: isPro ? 'white' : '#a7a7a7',
                          cursor: isPro ? 'pointer' : 'default',
                        }}
                        onMouseEnter={e => { if (isPro) e.currentTarget.style.background = '#9333ea' }}
                        onMouseLeave={e => { if (isPro) e.currentTarget.style.background = '#A855F7' }}
                      >
                        {isPro ? 'Suscribirse a Pro' : 'Plan actual'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={handleCerrar} className="mt-6 w-full text-xs py-2 rounded-lg"
              style={{ color: '#a7a7a7', background: 'transparent' }}>
              Cerrar
            </button>
          </>
        )}

        {/* STEP: TARJETAS */}
        {step === 'tarjetas' && (
          <>
            <button onClick={() => setStep('planes')} className="text-muted text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors">
              ← Volver
            </button>
            <h2 className="text-white text-xl font-black mb-1">Selecciona una tarjeta</h2>
            <p className="text-xs mb-6" style={{ color: '#a7a7a7' }}>
              Plan Pro — <span className="text-white font-bold">${planSeleccionado?.precio}/mes</span>
            </p>
            {loadingTarjetas ? (
              <p className="text-center text-muted text-sm">Cargando tarjetas...</p>
            ) : tarjetas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted text-sm mb-4">No tienes tarjetas guardadas</p>
                <button
                  onClick={() => setStep('nueva-tarjeta')}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold"
                  style={{ background: '#A855F7', color: 'white' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#9333ea')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#A855F7')}
                >
                  + Agregar tarjeta
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-4">
                  {tarjetas.map(tarjeta => (
                    <div key={tarjeta.id}
                      className="flex items-center justify-between rounded-xl px-5 py-4"
                      style={{ background: '#121212', border: '1px solid #2a2a2a' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{brandIcon[tarjeta.brand?.toLowerCase()] ?? '💳'}</span>
                        <div>
                          <p className="text-white text-sm font-bold capitalize">{tarjeta.brand} •••• {tarjeta.last4}</p>
                          <p className="text-xs" style={{ color: '#a7a7a7' }}>Vence {tarjeta.expMonth}/{tarjeta.expYear}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePagar(tarjeta)}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: '#A855F7', color: 'white' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#9333ea')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#A855F7')}
                      >
                        Pagar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep('nueva-tarjeta')}
                  className="w-full py-2.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#a7a7a7' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#A855F7')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  + Agregar nueva tarjeta
                </button>
              </>
            )}
          </>
        )}

        {/* STEP: NUEVA TARJETA */}
        {step === 'nueva-tarjeta' && (
          <>
            <button onClick={() => setStep('tarjetas')} className="text-muted text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors">
              ← Volver
            </button>
            <h2 className="text-white text-xl font-black mb-2">Agregar tarjeta</h2>
            <p className="text-xs mb-6" style={{ color: '#a7a7a7' }}>
              Tus datos están protegidos por Stripe. No almacenamos información de tu tarjeta.
            </p>
            <Elements stripe={stripePromise}>
              <FormularioTarjeta
                onSuccess={handleTarjetaAgregada}
                onCancel={() => setStep('tarjetas')}
              />
            </Elements>
          </>
        )}

        {/* STEP: CONFIRMANDO */}
        {step === 'confirmando' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor: '#A855F7', borderTopColor: 'transparent' }} />
            <p className="text-white font-bold">Procesando pago...</p>
            <p className="text-xs" style={{ color: '#a7a7a7' }}>No cierres esta ventana</p>
          </div>
        )}

        {/* STEP: EXITO */}
        {step === 'exito' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white"
              style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}>
              ✓
            </div>
            <h2 className="text-white text-2xl font-black">¡Bienvenido a Pro!</h2>
            <p className="text-xs" style={{ color: '#a7a7a7' }}>Tu suscripción está activa. Disfruta de todas las funciones.</p>
            <button
              onClick={handleCerrar}
              className="mt-4 px-8 py-3 rounded-lg text-sm font-bold"
              style={{ background: '#A855F7', color: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#9333ea')}
              onMouseLeave={e => (e.currentTarget.style.background = '#A855F7')}
            >
              Continuar
            </button>
          </div>
        )}

        {/* STEP: ERROR */}
        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: '#2a2a2a', color: '#ef4444' }}>
              ✗
            </div>
            <h2 className="text-white text-xl font-black">Error en el pago</h2>
            <p className="text-xs" style={{ color: '#a7a7a7' }}>{errorMsg}</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('tarjetas')}
                className="px-6 py-2.5 rounded-lg text-sm font-bold"
                style={{ background: '#A855F7', color: 'white' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#9333ea')}
                onMouseLeave={e => (e.currentTarget.style.background = '#A855F7')}
              >
                Intentar de nuevo
              </button>
              <button onClick={handleCerrar}
                className="px-6 py-2.5 rounded-lg text-sm font-bold"
                style={{ background: '#2a2a2a', color: '#a7a7a7' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}