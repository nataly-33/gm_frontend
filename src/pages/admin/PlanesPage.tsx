import { useState, useEffect } from 'react'
import { adminService, type Plan, type StripePrice } from '../../api/admin.service'

const EMPTY_PLAN: Omit<Plan, 'id'> = {
  nombre: '', precio: 0, creditoPorMes: 0, creditoIlimitado: false, stripePriceId: ''
}

const EMPTY_STRIPE: { nombre: string; precio: number; intervalo: 'month' | 'year' } = {
  nombre: '', precio: 0, intervalo: 'month'
}

type PlanField = { label: string; key: keyof Omit<Plan, 'id' | 'creditoIlimitado'>; type: string; placeholder?: string }

const PLAN_FIELDS: PlanField[] = [
  { label: 'Nombre',          key: 'nombre',        type: 'text' },
  { label: 'Precio (USD)',    key: 'precio',         type: 'number' },
  { label: 'Créditos por mes',key: 'creditoPorMes',  type: 'number' },
  { label: 'Stripe Price ID', key: 'stripePriceId',  type: 'text', placeholder: 'price_xxx' },
]

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [stripePrices, setStripePrices] = useState<StripePrice[]>([])
  const [form, setForm] = useState<Omit<Plan, 'id'>>(EMPTY_PLAN)
  const [stripeForm, setStripeForm] = useState<{ nombre: string; precio: number; intervalo: 'month' | 'year' }>(EMPTY_STRIPE)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'planes' | 'stripe'>('planes')

  async function fetchAll() {
    const [p, s] = await Promise.all([
      adminService.getPlanes(),
      adminService.getStripePrices(),
    ])
    setPlanes(p)
    setStripePrices(s)
  }

  useEffect(() => { fetchAll() }, [])

  async function handleSubmitPlan() {
    setError('')
    setLoading(true)
    try {
      if (editId) {
        await adminService.updatePlan(editId, form)
      } else {
        await adminService.createPlan(form)
      }
      setForm(EMPTY_PLAN)
      setEditId(null)
      await adminService.getPlanes().then(setPlanes)
    } catch {
      setError('Error al guardar el plan')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePlan(id: string) {
    if (!confirm('¿Eliminar este plan?')) return
    await adminService.deletePlan(id)
    await adminService.getPlanes().then(setPlanes)
  }

  function handleEditPlan(plan: Plan) {
    setEditId(plan.id)
    setForm({
      nombre: plan.nombre,
      precio: plan.precio,
      creditoPorMes: plan.creditoPorMes,
      creditoIlimitado: plan.creditoIlimitado,
      stripePriceId: plan.stripePriceId,
    })
  }

  async function handleCrearStripePrice() {
    setStripeLoading(true)
    try {
      const res = await adminService.createStripePrice(stripeForm)
      alert(`Price creado: ${res.stripePriceId}`)
      setStripeForm(EMPTY_STRIPE)
      await adminService.getStripePrices().then(setStripePrices)
    } catch {
      alert('Error al crear price en Stripe')
    } finally {
      setStripeLoading(false)
    }
  }

  async function handleDeleteStripePrice(priceId: string) {
    if (!confirm('¿Desactivar este price en Stripe?')) return
    await adminService.deleteStripePrice(priceId)
    await adminService.getStripePrices().then(setStripePrices)
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-6">Gestión de Planes</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['planes', 'stripe'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === t ? 'text-black' : 'text-muted hover:text-white bg-card-hover'
            }`}
            style={tab === t ? { background: '#A855F7' } : {}}
          >
            {t === 'planes' ? 'Planes' : 'Stripe Prices'}
          </button>
        ))}
      </div>

      {/* ── TAB PLANES ── */}
      {tab === 'planes' && (
        <>
          <div className="bg-card-hover rounded-xl p-5 mb-8 flex flex-col gap-3 max-w-lg">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
              {editId ? 'Editar plan' : 'Nuevo plan'}
            </h3>

            {PLAN_FIELDS.map(({ label, key, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-bold">{label}</label>
                <input
                  type={type}
                  value={form[key] as string | number}
                  onChange={e => setForm(f => ({
                    ...f,
                    [key]: type === 'number' ? Number(e.target.value) : e.target.value
                  }))}
                  placeholder={placeholder ?? ''}
                  className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary"
                />
              </div>
            ))}

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.creditoIlimitado}
                onChange={e => setForm(f => ({ ...f, creditoIlimitado: e.target.checked }))}
                className="accent-primary"
              />
              Crédito ilimitado
            </label>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex gap-2 mt-1">
              <button
                onClick={handleSubmitPlan}
                disabled={loading || !form.nombre}
                className="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
                style={{ background: '#A855F7' }}
              >
                {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
              </button>
              {editId && (
                <button
                  onClick={() => { setEditId(null); setForm(EMPTY_PLAN) }}
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
                  <th className="px-4 py-3 text-left">Stripe Price ID</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planes.map((plan, i) => (
                  <tr key={plan.id} className={i % 2 === 0 ? 'bg-surface' : 'bg-night'}>
                    <td className="px-4 py-3 font-medium">{plan.nombre}</td>
                    <td className="px-4 py-3 text-muted">${plan.precio}</td>
                    <td className="px-4 py-3">
                      {plan.creditoIlimitado
                        ? <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Ilimitado</span>
                        : plan.creditoPorMes}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs font-mono truncate max-w-[160px]">
                      {plan.stripePriceId || '—'}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="text-xs px-3 py-1 rounded-md bg-card-hover hover:text-white text-muted"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-xs px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {planes.length === 0 && (
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

      {/* ── TAB STRIPE ── */}
      {tab === 'stripe' && (
        <>
          <div className="bg-card-hover rounded-xl p-5 mb-8 flex flex-col gap-3 max-w-lg">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
              Crear Stripe Price
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">Nombre del producto</label>
              <input
                value={stripeForm.nombre}
                onChange={e => setStripeForm(f => ({ ...f, nombre: e.target.value }))}
                className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary"
                placeholder="ej: Plan Pro"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">Precio (USD)</label>
              <input
                type="number"
                value={stripeForm.precio}
                onChange={e => setStripeForm(f => ({ ...f, precio: Number(e.target.value) }))}
                className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">Intervalo</label>
              <select
                value={stripeForm.intervalo}
                onChange={e => setStripeForm(f => ({ ...f, intervalo: e.target.value as 'month' | 'year' }))}
                className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary"
              >
                <option value="month">Mensual</option>
                <option value="year">Anual</option>
              </select>
            </div>

            <button
              onClick={handleCrearStripePrice}
              disabled={stripeLoading || !stripeForm.nombre}
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
                {stripePrices.map((sp, i) => (
                  <tr key={sp.priceId} className={i % 2 === 0 ? 'bg-surface' : 'bg-night'}>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{sp.priceId}</td>
                    <td className="px-4 py-3">${(sp.amount / 100).toFixed(2)} {sp.currency.toUpperCase()}</td>
                    <td className="px-4 py-3 capitalize">{sp.intervalo}</td>
                    <td className="px-4 py-3">
                      {sp.activo
                        ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Activo</span>
                        : <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Inactivo</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteStripePrice(sp.priceId)}
                        className="text-xs px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
                {stripePrices.length === 0 && (
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