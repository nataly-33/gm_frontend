import { useState, useEffect, useMemo } from 'react'
import { clientService, type Payment } from '../../api/client.service'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getYears(payments: Payment[]) {
  const years = new Set(payments.map(p => new Date(p.created_at).getFullYear()))
  return [...years].sort((a, b) => b - a)
}

function buildChartData(payments: Payment[], year: number) {
  const acc: Record<number, number> = {}
  payments
    .filter(p => new Date(p.created_at).getFullYear() === year)
    .forEach(p => {
      const m = new Date(p.created_at).getMonth()
      acc[m] = (acc[m] ?? 0) + parseFloat(p.amount)
    })
  return MONTHS.map((name, i) => ({ name, total: acc[i] ?? 0, index: i }))
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    succeeded:              { bg: 'rgba(34,197,94,.15)',  color: '#4ade80', label: 'Exitoso'    },
    requires_payment_method:{ bg: 'rgba(239,68,68,.15)',  color: '#f87171', label: 'Fallido'    },
    processing:             { bg: 'rgba(251,191,36,.15)', color: '#fbbf24', label: 'Procesando' },
  }
  const s = map[status] ?? { bg: 'rgba(167,167,167,.15)', color: '#a7a7a7', label: status }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const [year, setYear]   = useState(currentYear)
  const [month, setMonth] = useState<number | null>(null)

  useEffect(() => {
    clientService.getPayments()
      .then(setPayments)
      .catch(() => setError('No se pudieron cargar los pagos'))
      .finally(() => setLoading(false))
  }, [])

  const years     = useMemo(() => getYears(payments), [payments])
  const chartData = useMemo(() => buildChartData(payments, year), [payments, year])

  const filtered = useMemo(() => payments.filter(p => {
    const d = new Date(p.created_at)
    return d.getFullYear() === year && (month === null || d.getMonth() === month)
  }), [payments, year, month])

  const totalFiltered = filtered.reduce((a, p) => a + parseFloat(p.amount), 0)
  const maxChart = Math.max(...chartData.map(d => d.total), 1)

  if (loading) return <div className="p-8 text-muted text-sm">Cargando pagos...</div>
  if (error)   return <div className="p-8 text-red-400 text-sm">{error}</div>

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black">Historial de pagos</h2>
          <p className="text-muted text-xs mt-0.5">{payments.length} transacciones en total</p>
        </div>
        <div className="flex gap-2">
          <select
            value={year}
            onChange={e => { setYear(Number(e.target.value)); setMonth(null) }}
            className="bg-card-hover text-white text-xs rounded-lg px-3 py-1.5 outline-none border border-transparent focus:border-primary"
          >
            {(years.length ? years : [currentYear]).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={month ?? ''}
            onChange={e => setMonth(e.target.value === '' ? null : Number(e.target.value))}
            className="bg-card-hover text-white text-xs rounded-lg px-3 py-1.5 outline-none border border-transparent focus:border-primary"
          >
            <option value="">Todos los meses</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-surface rounded-xl p-5 mb-6">
        <p className="text-muted text-xs mb-4">Ingresos por mes — {year}</p>
        <div className="flex items-end gap-1.5 h-32">
          {chartData.map(d => {
            const h = (d.total / maxChart) * 100
            const isActive = month === d.index
            return (
              <div key={d.name} className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => setMonth(isActive ? null : d.index)}>
                <span className="text-muted text-[9px]">{d.total > 0 ? `$${d.total.toFixed(0)}` : ''}</span>
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${h}%`, minHeight: 4,
                    background: isActive ? '#A855F7' : d.total > 0 ? '#7C3AED80' : '#282828',
                  }}
                />
                <span className={`text-[9px] ${isActive ? 'text-primary font-bold' : 'text-muted'}`}>{d.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-card-hover">
          <p className="text-sm font-bold">
            {month !== null ? `${MONTHS[month]} ${year}` : `Todo ${year}`}
            <span className="text-muted font-normal text-xs ml-2">({filtered.length} pagos)</span>
          </p>
          <p className="text-sm font-bold text-primary">${totalFiltered.toFixed(2)} USD</p>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-muted text-sm">No hay pagos en este período</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card-hover text-muted text-xs uppercase tracking-wider">
                <th className="px-5 py-2.5 text-left">Fecha</th>
                <th className="px-5 py-2.5 text-left">Monto</th>
                <th className="px-5 py-2.5 text-left">Estado</th>
                <th className="px-5 py-2.5 text-left">ID Stripe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-surface' : 'bg-night'}>
                  <td className="px-5 py-3 text-muted text-xs">
                    {new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3 font-bold text-white">
                    ${parseFloat(p.amount).toFixed(2)} {p.currency.toUpperCase()}
                  </td>
                  <td className="px-5 py-3">{statusBadge(p.status)}</td>
                  <td className="px-5 py-3 text-muted text-xs font-mono truncate max-w-[180px]">
                    {p.stripe_payment_intent_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
