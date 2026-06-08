import { useState, useEffect } from 'react'

interface StatCard {
  label: string
  value: string
  change: string
  positive: boolean
  icon: React.ReactNode
}

interface RecentUser {
  nombre: string
  email: string
  plan: string
  fecha: string
  canciones: number
}

const RECENT_USERS: RecentUser[] = [
  { nombre: 'Valentina Ríos',    email: 'vale.rios@gmail.com',      plan: 'Pro',   fecha: 'Hoy, 10:23',    canciones: 47 },
  { nombre: 'Mateo Fernández',   email: 'mateof@hotmail.com',       plan: 'Free',  fecha: 'Hoy, 09:11',    canciones: 3  },
  { nombre: 'Camila Herrera',    email: 'cami.herrera@gmail.com',   plan: 'Pro',   fecha: 'Hoy, 08:54',    canciones: 82 },
  { nombre: 'Sebastián Mora',    email: 'sebas.mora@outlook.com',   plan: 'Basic', fecha: 'Ayer, 22:10',   canciones: 18 },
  { nombre: 'Lucía Vargas',      email: 'lucia.v@gmail.com',        plan: 'Pro',   fecha: 'Ayer, 18:45',   canciones: 134},
  { nombre: 'Diego Castillo',    email: 'diegocast@gmail.com',      plan: 'Free',  fecha: 'Ayer, 14:30',   canciones: 7  },
  { nombre: 'Isabella Romero',   email: 'isa.romero@yahoo.com',     plan: 'Basic', fecha: '10 may, 20:15', canciones: 29 },
]

const PLAN_DATA = [
  { nombre: 'Free',  usuarios: 8420, color: '#6B7280' },
  { nombre: 'Basic', usuarios: 2180, color: '#A855F7' },
  { nombre: 'Pro',   usuarios: 940,  color: '#7C3AED' },
]

const GENRE_DATA = [
  { genero: 'Reggaeton', canciones: 4821, color: '#F59E0B' },
  { genero: 'LoFi',      canciones: 3642, color: '#10B981' },
  { genero: 'Pop',       canciones: 3190, color: '#3B82F6' },
  { genero: 'Trap',      canciones: 2870, color: '#EF4444' },
  { genero: 'Techno',    canciones: 1940, color: '#A855F7' },
  { genero: 'Otros',     canciones: 1967, color: '#6B7280' },
]

const MONTHLY = [
  { mes: 'Ene', ganancias: 4200,  usuarios: 310,  canciones: 6820  },
  { mes: 'Feb', ganancias: 5800,  usuarios: 420,  canciones: 8940  },
  { mes: 'Mar', ganancias: 5100,  usuarios: 380,  canciones: 7650  },
  { mes: 'Abr', ganancias: 7400,  usuarios: 540,  canciones: 11200 },
  { mes: 'May', ganancias: 6900,  usuarios: 490,  canciones: 9800  },
  { mes: 'Jun', ganancias: 9200,  usuarios: 680,  canciones: 14300 },
  { mes: 'Jul', ganancias: 8700,  usuarios: 620,  canciones: 13100 },
  { mes: 'Ago', ganancias: 11400, usuarios: 820,  canciones: 17600 },
  { mes: 'Sep', ganancias: 10800, usuarios: 760,  canciones: 16200 },
  { mes: 'Oct', ganancias: 13200, usuarios: 940,  canciones: 21400 },
  { mes: 'Nov', ganancias: 12100, usuarios: 870,  canciones: 19800 },
  { mes: 'Dic', ganancias: 15600, usuarios: 1120, canciones: 26430 },
]

const MAX_GANANCIAS = Math.max(...MONTHLY.map(m => m.ganancias))
const MAX_USUARIOS  = Math.max(...MONTHLY.map(m => m.usuarios))
const MAX_CANCIONES = Math.max(...MONTHLY.map(m => m.canciones))

function StatCardWidget({ label, value, change, positive, icon }: StatCard) {
  return (
    <div className="bg-surface rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs font-semibold uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#A855F720' }}>
          {icon}
        </div>
      </div>
      <span className="text-white text-2xl font-black">{value}</span>
      <span className={`text-xs font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? '▲' : '▼'} {change} vs mes anterior
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const [animated, setAnimated] = useState(false)
  const [activeChart, setActiveChart] = useState<'ganancias' | 'usuarios' | 'canciones'>('ganancias')

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const STATS: StatCard[] = [
    {
      label: 'Usuarios totales',
      value: '11,540',
      change: '+8.7%',
      positive: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#A855F7"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
    },
    {
      label: 'Ingresos del mes',
      value: '$15,600',
      change: '+29.0%',
      positive: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#A855F7"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
    },
    {
      label: 'Suscripciones activas',
      value: '3,120',
      change: '+11.4%',
      positive: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#A855F7"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>,
    },
    {
      label: 'Canciones generadas',
      value: '172,430',
      change: '+33.5%',
      positive: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#A855F7"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>,
    },
    {
      label: 'Churn rate',
      value: '3.2%',
      change: '+0.4%',
      positive: false,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#A855F7"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
    },
    {
      label: 'Ingresos anuales',
      value: '$110,400',
      change: '+22.1%',
      positive: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#A855F7"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>,
    },
  ]

  const totalUsuarios = PLAN_DATA.reduce((a, b) => a + b.usuarios, 0)
  const totalGenre    = GENRE_DATA.reduce((a, b) => a + b.canciones, 0)

  const chartConfig = {
    ganancias: { label: 'Ingresos en USD',     max: MAX_GANANCIAS, fmt: (v: number) => `$${(v/1000).toFixed(1)}k`, color: 'linear-gradient(180deg,#A855F7,#7C3AED)' },
    usuarios:  { label: 'Nuevos registros',    max: MAX_USUARIOS,  fmt: (v: number) => `${v}`,                     color: 'linear-gradient(180deg,#10B981,#059669)' },
    canciones: { label: 'Canciones generadas', max: MAX_CANCIONES, fmt: (v: number) => `${(v/1000).toFixed(1)}k`,  color: 'linear-gradient(180deg,#F59E0B,#D97706)' },
  }
  const cfg = chartConfig[activeChart]

  return (
    <div className="p-6 text-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black">Dashboard</h2>
          <p className="text-muted text-xs mt-0.5">Resumen general de la plataforma</p>
        </div>
        <span className="text-xs text-muted bg-card-hover px-3 py-1.5 rounded-full">
          Datos acumulados — 2026
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {STATS.map(s => <StatCardWidget key={s.label} {...s} />)}
      </div>

      {/* Gráfico principal con tabs + distribución por plan */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: '1fr 320px' }}>

        <div className="bg-surface rounded-xl p-5">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['ganancias', 'usuarios', 'canciones'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveChart(tab)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  activeChart === tab
                    ? 'bg-primary text-black'
                    : 'text-muted bg-card-hover hover:text-white'
                }`}
              >
                {tab === 'ganancias' ? 'Ingresos' : tab === 'usuarios' ? 'Usuarios' : 'Canciones'}
              </button>
            ))}
          </div>
          <p className="text-muted text-xs mb-4">{cfg.label} por mes — 2026</p>
          <div className="flex items-end gap-2 h-40">
            {MONTHLY.map((row) => {
              const val = row[activeChart]
              const h   = animated ? (val / cfg.max) * 100 : 0
              return (
                <div key={row.mes} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-muted text-[9px]">{cfg.fmt(val)}</span>
                  <div
                    className="w-full rounded-t-md transition-all duration-700"
                    style={{ height: `${h}%`, background: cfg.color, minHeight: '4px' }}
                  />
                  <span className="text-muted text-[9px]">{row.mes}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Distribución por plan */}
        <div className="bg-surface rounded-xl p-5">
          <h3 className="text-sm font-bold mb-1">Usuarios por plan</h3>
          <p className="text-muted text-xs mb-4">Distribución actual</p>
          <div className="flex flex-col gap-3">
            {PLAN_DATA.map(({ nombre, usuarios, color }) => {
              const pct = Math.round((usuarios / totalUsuarios) * 100)
              const w   = animated ? pct : 0
              return (
                <div key={nombre}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">{nombre}</span>
                    <span className="text-muted">{usuarios.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-card-hover rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-card-hover flex justify-around">
            {PLAN_DATA.map(({ nombre, usuarios, color }) => (
              <div key={nombre} className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-white text-sm font-bold">{usuarios.toLocaleString()}</span>
                <span className="text-muted text-[10px]">{nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Géneros + Usuarios recientes */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>

        {/* Géneros más generados */}
        <div className="bg-surface rounded-xl p-5">
          <h3 className="text-sm font-bold mb-1">Géneros más generados</h3>
          <p className="text-muted text-xs mb-4">Total: {totalGenre.toLocaleString()} canciones</p>
          <div className="flex flex-col gap-3">
            {GENRE_DATA.map(({ genero, canciones, color }) => {
              const pct = Math.round((canciones / totalGenre) * 100)
              const w   = animated ? pct : 0
              return (
                <div key={genero}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                      {genero}
                    </span>
                    <span className="text-muted">{canciones.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-card-hover rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Usuarios recientes */}
        <div className="bg-surface rounded-xl p-5">
          <h3 className="text-sm font-bold mb-4">Usuarios recientes</h3>
          <div className="flex flex-col gap-2">
            {RECENT_USERS.map((u, i) => {
              const initials  = u.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              const planColor = u.plan === 'Pro' ? '#A855F7' : u.plan === 'Basic' ? '#6366F1' : '#6B7280'
              return (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{u.nombre}</p>
                    <p className="text-muted text-[10px] truncate">{u.canciones} canciones generadas</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${planColor}20`, color: planColor }}
                    >
                      {u.plan}
                    </span>
                    <span className="text-muted text-[9px]">{u.fecha}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}