import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { clientService } from '../../api/client.service'
import type { Pago } from '../../api/client.service'

// ── helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic',
]

function getYears(pagos: Pago[]): number[] {
  const years = new Set(pagos.map(p => new Date(p.createdAt).getFullYear()))
  return [...years].sort((a, b) => b - a)
}

function filterPagos(pagos: Pago[], year: number, month: number | null) {
  return pagos.filter(p => {
    const d = new Date(p.createdAt)
    const sameYear = d.getFullYear() === year
    const sameMonth = month === null || d.getMonth() === month
    return sameYear && sameMonth
  })
}

function buildChartData(pagos: Pago[], year: number) {
  const acc: Record<number, number> = {}
  pagos
    .filter(p => new Date(p.createdAt).getFullYear() === year)
    .forEach(p => {
      const m = new Date(p.createdAt).getMonth()
      acc[m] = (acc[m] ?? 0) + p.monto
    })
  return MONTHS.map((name, i) => ({ name, total: acc[i] ?? 0, index: i }))
}

function formatMonto(monto: number, moneda: string) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: moneda.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(monto)
}

function estadoBadge(estado: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    succeeded: { bg: 'rgba(34,197,94,.15)', color: '#4ade80', label: 'Exitoso' },
    requires_payment_method: { bg: 'rgba(239,68,68,.15)', color: '#f87171', label: 'Fallido' },
    processing: { bg: 'rgba(251,191,36,.15)', color: '#fbbf24', label: 'Procesando' },
  }
  const s = map[estado] ?? { bg: 'rgba(167,167,167,.15)', color: '#a7a7a7', label: estado }
  return (
    <span
      style={{
        background: s.bg, color: s.color,
        padding: '2px 10px', borderRadius: 99,
        fontSize: 11, fontWeight: 700, letterSpacing: '.4px',
      }}
    >
      {s.label}
    </span>
  )
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChartSVG({ data, activeBar, onHover }: {
  data: { name: string; total: number; index: number }[]
  activeBar: number | null
  onHover: (i: number | null) => void
}) {
  const W = 700, H = 200, PL = 48, PB = 28, PT = 10, PR = 8
  const innerW = W - PL - PR
  const innerH = H - PB - PT
  const max = Math.max(...data.map(d => d.total), 1)
  const barW = innerW / data.length
  const barPad = barW * 0.28

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ v: max * t, y: PT + innerH * (1 - t) }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 220 }}
      onMouseLeave={() => onHover(null)}>
      {/* grid lines */}
      {yTicks.map(({ v, y }) => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth={1} />
          <text x={PL - 6} y={y + 4} textAnchor="end" fill="#a7a7a7" fontSize={11}>
            ${v === 0 ? '0' : v >= 1 ? v.toFixed(0) : v.toFixed(2)}
          </text>
        </g>
      ))}
      {/* bars */}
      {data.map((d, i) => {
        const bh = d.total === 0 ? 3 : (d.total / max) * innerH
        const x = PL + i * barW + barPad / 2
        const y = PT + innerH - bh
        const w = barW - barPad
        const isActive = activeBar === i
        const fill = d.total === 0
          ? 'rgba(255,255,255,.06)'
          : isActive ? '#c084fc' : '#A855F7'
        return (
          <g key={i} onMouseEnter={() => onHover(i)}>
            <rect x={x} y={y} width={w} height={bh} rx={4} fill={fill}
              style={{ transition: 'fill .15s' }} />
            {/* x label */}
            <text x={x + w / 2} y={H - 8} textAnchor="middle" fill="#a7a7a7" fontSize={11}>
              {d.name}
            </text>
            {/* tooltip on hover */}
            {isActive && d.total > 0 && (
              <g>
                <rect x={x + w / 2 - 28} y={y - 34} width={56} height={26} rx={6}
                  fill="#1a1a2e" stroke="rgba(168,85,247,.4)" strokeWidth={1} />
                <text x={x + w / 2} y={y - 17} textAnchor="middle"
                  fill="#c084fc" fontSize={12} fontWeight="700">
                  ${d.total.toFixed(2)}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { user } = useAuthStore()
  const [pagos, setPagos]     = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const [chartYear,  setChartYear]  = useState(currentYear)
  const [filterYear, setFilterYear] = useState(currentYear)
  const [filterMonth, setFilterMonth] = useState<number | null>(null)
  const [activeBar, setActiveBar] = useState<number | null>(null)
  
useEffect(() => {
  if (!user?.id) return
  console.log('Fetching pagos for user:', user.id)
  clientService.getPagos(user.id)
    .then(data => {
      console.log('Pagos recibidos:', data)
      setPagos(data)
    })
    .catch(err => {
      console.error('Error al obtener pagos:', err)
      setError('No se pudieron cargar los pagos.')
    })
    .finally(() => setLoading(false))
}, [user?.id])

  const years = useMemo(() => {
    const y = getYears(pagos)
    return y.length ? y : [currentYear]
  }, [pagos, currentYear])

  const chartData   = useMemo(() => buildChartData(pagos, chartYear),  [pagos, chartYear])
  const filteredList = useMemo(() => filterPagos(pagos, filterYear, filterMonth), [pagos, filterYear, filterMonth])

  const totalFiltrado = useMemo(
    () => filteredList.reduce((s, p) => s + p.monto, 0),
    [filteredList]
  )

  // sync filterYear / chartYear when years list changes
  useEffect(() => {
    if (!years.includes(filterYear)) setFilterYear(years[0])
    if (!years.includes(chartYear))  setChartYear(years[0])
  }, [years])

  // ── selectors ──────────────────────────────────────────────────────────────

  const Select = ({
    value, onChange, children, style,
  }: {
    value: string | number
    onChange: (v: string) => void
    children: React.ReactNode
    style?: React.CSSProperties
  }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--color-surface, #1a1a1a)',
        border: '1px solid rgba(255,255,255,.1)',
        color: 'white',
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: 13,
        cursor: 'pointer',
        outline: 'none',
        ...style,
      }}
    >
      {children}
    </select>
  )

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a7a7a7' }}>
      Cargando pagos…
    </div>
  )

  if (error) return (
    <div style={{ padding: 32, color: '#f87171' }}>{error}</div>
  )

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Historial de pagos
        </h1>
        <p style={{ color: '#a7a7a7', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
          Todos tus pagos realizados en MusicGen.
        </p>
      </div>

      {/* ── Chart card ── */}
      <div style={{
        background: 'var(--color-card, #141414)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,.07)',
        padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>
              Gasto mensual
            </h2>
            <span style={{ color: '#a7a7a7', fontSize: 13 }}>USD por mes</span>
          </div>
          <Select value={chartYear} onChange={v => setChartYear(Number(v))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>

        {pagos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#a7a7a7', padding: '48px 0', fontSize: 14 }}>
            No hay pagos registrados aún.
          </div>
        ) : (
          <BarChartSVG
            data={chartData}
            activeBar={activeBar}
            onHover={setActiveBar}
          />
        )}
      </div>

      {/* ── List card ── */}
      <div style={{
        background: 'var(--color-card, #141414)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,.07)',
        padding: '24px 28px',
      }}>
        {/* list header + filters */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          marginBottom: 20,
        }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>
              Detalle de pagos
            </h2>
            <span style={{ color: '#a7a7a7', fontSize: 13 }}>
              {filteredList.length} pago{filteredList.length !== 1 ? 's' : ''} · Total: ${totalFiltrado.toFixed(2)} USD
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={filterYear} onChange={v => setFilterYear(Number(v))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select value={filterMonth ?? ''} onChange={v => setFilterMonth(v === '' ? null : Number(v))}>
              <option value="">Todos los meses</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </Select>
          </div>
        </div>

        {/* table */}
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#a7a7a7', padding: '40px 0', fontSize: 14 }}>
            No hay pagos para el período seleccionado.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  {['Fecha', 'Monto', 'Moneda', 'Estado', 'ID Stripe'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', color: '#a7a7a7', fontSize: 12,
                      fontWeight: 600, padding: '0 12px 12px',
                      letterSpacing: '.4px', textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredList
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((pago, i) => (
                    <tr
                      key={pago.id}
                      style={{
                        borderBottom: i < filteredList.length - 1
                          ? '1px solid rgba(255,255,255,.04)' : 'none',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 12px', color: 'white', fontSize: 14 }}>
                        {new Date(pago.createdAt).toLocaleDateString('es-BO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#A855F7', fontSize: 14, fontWeight: 700 }}>
                        {formatMonto(pago.monto, pago.moneda)}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#a7a7a7', fontSize: 13 }}>
                        {pago.moneda.toUpperCase()}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {estadoBadge(pago.estado)}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#555', fontSize: 12, fontFamily: 'monospace' }}>
                        {pago.stripePaymentIntentId}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}