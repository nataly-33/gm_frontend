import { useState, useEffect } from 'react'
import { adminService, type CreditPlan, type StripePrice } from '../../api/admin.service'

const EMPTY_PLAN: Omit<CreditPlan, 'id'> = {
  slug: '',
  name: '',
  credits_per_month: 0,
  price_usd: '0.00',
  stripe_price_id: '',
  features: [],
  is_active: true,
}

const EMPTY_STRIPE: { name: string; price_usd: number; interval: 'month' | 'year' } = {
  name: '',
  price_usd: 0,
  interval: 'month',
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<CreditPlan[]>([])
  const [prices, setPrices] = useState<StripePrice[]>([])
  const [form, setForm] = useState<Omit<CreditPlan, 'id'>>(EMPTY_PLAN)
  const [stripeForm, setStripeForm] = useState(EMPTY_STRIPE)
  const [editId, setEditId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [stripeLoading, setStripe] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'plans' | 'stripe'>('plans')

  async function fetchAll() {
    const [p, s] = await Promise.all([adminService.getPlans(), adminService.getStripePrices()])
    setPlans(p)
    setPrices(s)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (editId !== null) {
        await adminService.updatePlan(editId, form)
      } else {
        await adminService.createPlan(form)
      }
      setForm(EMPTY_PLAN)
      setEditId(null)
      await adminService.getPlans().then(setPlans)
    } catch {
      setError('Error al guardar el plan')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este plan?')) {
      return
    }
    await adminService.deletePlan(id)
    await adminService.getPlans().then(setPlans)
  }

  function handleEdit(plan: CreditPlan) {
    setEditId(plan.id)
    setForm({
      slug: plan.slug,
      name: plan.name,
      credits_per_month: plan.credits_per_month,
      price_usd: plan.price_usd,
      stripe_price_id: plan.stripe_price_id,
      features: plan.features,
      is_active: plan.is_active,
    })
    setTab('plans')
  }

  async function handleCreateStripePrice() {
    setStripe(true)
    try {
      const res = await adminService.createStripePrice(stripeForm)
      alert(`Price creado: ${res.stripe_price_id}`)
      setStripeForm(EMPTY_STRIPE)
      await adminService.getStripePrices().then(setPrices)
    } catch {
      alert('Error al crear price en Stripe')
    } finally {
      setStripe(false)
    }
  }

  async function handleDeactivateStripePrice(priceId: string) {
    if (!confirm('¿Desactivar este price en Stripe?')) {
      return
    }
    await adminService.deleteStripePrice(priceId)
    await adminService.getStripePrices().then(setPrices)
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-6">Gestión de Planes</h2>

      <div className="flex gap-2 mb-6">
        {(['plans', 'stripe'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === t ? 'text-black' : 'text-muted hover:text-white bg-card-hover'}`}
            style={tab === t ? { background: '#A855F7' } : {}}
          >
            {t === 'plans' ? 'Planes' : 'Stripe Prices'}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <>
          <div className="bg-card-hover rounded-xl p-5 mb-8 flex flex-col gap-3 max-w-lg">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
              {editId !== null ? 'Editar plan' : 'Nuevo plan'}
            </h3>
            {(
              [
                { label: 'Slug', key: 'slug', type: 'text', ph: 'ej: pro' },
                { label: 'Nombre', key: 'name', type: 'text', ph: 'ej: Pro' },
                { label: 'Créditos/mes', key: 'credits_per_month', type: 'number', ph: '' },
                { label: 'Precio USD', key: 'price_usd', type: 'text', ph: '9.00' },
                { label: 'Stripe Price ID', key: 'stripe_price_id', type: 'text', ph: 'price_xxx' },
              ] as { label: string; key: keyof typeof form; type: string; ph: string }[]
            ).map(({ label, key, type, ph }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-bold">{label}</label>
                <input
                  type={type}
                  value={form[key] as string | number}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                  placeholder={ph}
                  className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary text-white"
                />
              </div>
            ))}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleSubmit}
                disabled={loading || !form.name}
                className="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
                style={{ background: '#A855F7' }}
              >
                {loading ? 'Guardando...' : editId !== null ? 'Actualizar' : 'Crear'}
              </button>
              {editId !== null && (
                <button
                  onClick={() => {
                    setEditId(null)
                    setForm(EMPTY_PLAN)
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-muted hover:text-white border border-card-hover"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-card-hover">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card-hover text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Precio</th>
                  <th className="px-4 py-3 text-left">Créditos/mes</th>
                  <th className="px-4 py-3 text-left">Stripe ID</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, i) => (
                  <tr key={plan.id} className={i % 2 === 0 ? 'bg-surface' : 'bg-night'}>
                    <td className="px-4 py-3 font-medium">{plan.name}</td>
                    <td className="px-4 py-3 text-muted">${plan.price_usd}</td>
                    <td className="px-4 py-3">{plan.credits_per_month}</td>
                    <td className="px-4 py-3 text-muted text-xs font-mono truncate max-w-[160px]">
                      {plan.stripe_price_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-xs px-3 py-1 rounded-md bg-card-hover hover:text-white text-muted"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-xs px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">
                      No hay planes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'stripe' && (
        <>
          <div className="bg-card-hover rounded-xl p-5 mb-8 flex flex-col gap-3 max-w-lg">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
              Crear Stripe Price
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">Nombre del producto</label>
              <input
                value={stripeForm.name}
                onChange={(e) => setStripeForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary text-white"
                placeholder="ej: Plan Pro"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">Precio (USD)</label>
              <input
                type="number"
                value={stripeForm.price_usd}
                onChange={(e) =>
                  setStripeForm((f) => ({ ...f, price_usd: Number(e.target.value) }))
                }
                className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">Intervalo</label>
              <select
                value={stripeForm.interval}
                onChange={(e) =>
                  setStripeForm((f) => ({ ...f, interval: e.target.value as 'month' | 'year' }))
                }
                className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary text-white"
              >
                <option value="month">Mensual</option>
                <option value="year">Anual</option>
              </select>
            </div>
            <button
              onClick={handleCreateStripePrice}
              disabled={stripeLoading || !stripeForm.name}
              className="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50 mt-1 w-fit"
              style={{ background: '#A855F7' }}
            >
              {stripeLoading ? 'Creando...' : 'Crear en Stripe'}
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border border-card-hover">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card-hover text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Price ID</th>
                  <th className="px-4 py-3 text-left">Monto</th>
                  <th className="px-4 py-3 text-left">Intervalo</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((sp, i) => (
                  <tr key={sp.price_id} className={i % 2 === 0 ? 'bg-surface' : 'bg-night'}>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{sp.price_id}</td>
                    <td className="px-4 py-3">
                      ${(sp.amount / 100).toFixed(2)} {sp.currency.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 capitalize">{sp.interval}</td>
                    <td className="px-4 py-3">
                      {sp.active ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeactivateStripePrice(sp.price_id)}
                        className="text-xs px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
                {prices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">
                      No hay prices en Stripe
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
