import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

const NAV_ITEMS = [
  { to: '/',          label: 'Inicio' },
  { to: '/create',    label: 'Crear canción' },
  { to: '/library',   label: 'Tu biblioteca' },
  { to: '/community', label: 'Comunidad' },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div
      className="grid h-screen bg-night gap-2 p-2 box-border"
      style={{ gridTemplateColumns: '280px 1fr', gridTemplateRows: '1fr 90px' }}
    >
      {/* ── Sidebar ────────────────────────────────── */}
      <aside className="flex flex-col gap-2 overflow-hidden">

        {/* Navegación */}
        <div className="bg-surface rounded-lg p-4">
          <p className="text-primary text-xl font-bold tracking-tight mb-5">MusicGen</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm transition-all ${
                    isActive
                      ? 'bg-card-hover text-white font-bold'
                      : 'text-muted hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Cuenta */}
        <div className="bg-surface rounded-lg p-4 flex-1 flex flex-col">
          <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">
            Tu cuenta
          </p>
          <p className="text-white text-sm font-medium truncate">{user?.full_name ?? '—'}</p>
          <p className="text-muted text-xs mt-0.5 mb-4">{user?.credit_balance ?? 0} créditos</p>
          <button
            onClick={handleLogout}
            className="mt-auto border border-card-hover text-muted text-xs rounded-pill px-4 py-1.5 hover:text-white hover:border-muted transition-colors w-fit"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main View ──────────────────────────────── */}
      <main className="bg-surface rounded-lg overflow-y-auto">
        {/* Gradiente lila → negro */}
        <div className="h-20 bg-gradient-to-b from-[#2e1a4a] to-surface" />
        <div className="-mt-8">
          <Outlet />
        </div>
      </main>

      {/* ── Player Bar ─────────────────────────────── */}
      <footer
        className="bg-surface rounded-lg flex items-center justify-between px-6 border-t border-card-hover"
        style={{ gridColumn: '1 / -1' }}
      >
        <p className="text-muted text-sm">Player — próximamente</p>
      </footer>
    </div>
  )
}
