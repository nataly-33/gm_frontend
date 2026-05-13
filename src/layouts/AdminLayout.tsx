import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

const ADMIN_NAV = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    to: '/admin/usuarios',
    label: 'Usuarios',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    to: '/admin/roles',
    label: 'Roles',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08A7.23 7.23 0 0 1 12 19z" />
      </svg>
    ),
  },
  {
    to: '/admin/planes',
    label: 'Planes',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
      </svg>
    ),
  },
  {
    to: '/admin/profile',
    label: 'Mi perfil',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.nombreCompleto
    ? user.nombreCompleto
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  return (
    <div
      className="grid h-screen bg-night gap-2 p-2 box-border"
      style={{ gridTemplateColumns: '280px 1fr', gridTemplateRows: '1fr' }}
    >
      {/* ── Sidebar ────────────────────────────────── */}
      <aside className="flex flex-col overflow-hidden">
        <div className="bg-surface rounded-lg p-1 flex flex-col h-full">

          {/* Logo */}
          <img
            src="/logo.png"
            alt="MusicGen"
            className="w-[32px] h-[32px] object-contain mt-2 mb-4 ml-1"
          />

          {/* Navegación admin */}
          <nav className="flex flex-col gap-1 flex-1">
            {ADMIN_NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-black font-bold text-[16px]'
                      : 'text-muted hover:text-white hover:bg-card-hover text-[15px]'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-card-hover my-3" />

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[15px] text-muted hover:text-white hover:bg-card-hover transition-all duration-150 w-full text-left"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Cerrar sesión
          </button>

        </div>
      </aside>

      {/* ── Main View ──────────────────────────────── */}
      <main className="bg-night rounded-lg overflow-hidden flex flex-col gap-2">

        {/* ── Navbar superior ── */}
        <header className="bg-surface rounded-lg flex items-center justify-end gap-4 px-6 py-2 shrink-0">

          {/* Badge admin */}
          <div className="flex items-center gap-1.5 bg-card-hover px-3 py-1.5 rounded-full">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
              style={{ color: 'var(--color-primary)' }}
              aria-hidden="true"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            <span className="text-white text-xs font-semibold">Administrador</span>
          </div>

          {/* Divider vertical */}
          <div className="h-6 w-px bg-card-hover" />

          {/* Avatar clickeable → va al perfil */}
          <NavLink
            to="/admin/profile"
            className="flex items-center gap-2.5 mr-2 hover:opacity-80 transition-opacity"
          >
            {user?.fotoBase64 ? (
              <img
                src={user.fotoBase64}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover shrink-0"
                style={{ border: '2px solid #A855F7' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none"
                style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
              >
                {initials}
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="text-white text-sm font-medium truncate max-w-[220px]">
                {user?.nombreCompleto ?? '—'}
              </span>
              <span className="text-muted text-[10px] truncate max-w-[220px]">
                {user?.email ?? '—'}
              </span>
            </div>
          </NavLink>

        </header>

        {/* ── Contenido de la ruta ── */}
        <div className="bg-surface rounded-lg flex-1 overflow-y-auto">
          <Outlet />
        </div>

      </main>
    </div>
  )
}