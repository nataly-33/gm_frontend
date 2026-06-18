import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { ENDPOINTS } from '../api/endpoints'
import client from '../api/client'
import UpgradeModal from './upgrade-modal'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/modules/notifications.api'
import type { Notification } from '../api/modules/notifications.api'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Inicio',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    to: '/create',
    label: 'Crear canción',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
      </svg>
    ),
  },
  {
    to: '/library',
    label: 'Tu biblioteca',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
      </svg>
    ),
  },
  {
    to: '/stems',
    label: 'Separar pistas',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 9h2v6H3V9zm4-2h2v10H7V7zm4-4h2v18h-2V3zm4 4h2v10h-2V7zm4 2h2v6h-2V9z" />
      </svg>
    ),
  },
  {
    to: '/playlists',
    label: 'Playlists',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18A3 3 0 1 0 19 17V8h3V6h-5z" />
      </svg>
    ),
  },
  {
    to: '/recommendations',
    label: 'Para ti',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ),
  },
  {
    to: '/community',
    label: 'Comunidad',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    to: '/mix',
    label: 'Mix DJ',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 9h2v6H3V9zm4-2h2v10H7V7zm4-4h2v18h-2V3zm4 4h2v10h-2V7zm4 2h2v6h-2V9z" />
      </svg>
    ),
  },
  {
    to: '/payments',
    label: 'Historial de pagos',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Perfil',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
  },
]

interface Suscripcion {
  id: string
  plan: { id: number; slug: string; name: string }
  status: string
}

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuthStore()

  const [planBadge, setPlanBadge] = useState<string | null>(null)
  const [checkingPlan, setCheckingPlan] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.id) {
      setCheckingPlan(false)
      return
    }

    client
      .get(ENDPOINTS.auth.me)
      .then(({ data }) => {
        setUser(data)
      })
      .catch((err) => {
        console.error('Error al sincronizar perfil:', err)
      })

    getNotifications()
      .then((r) => {
        setNotifs(r.results)
        setUnread(r.unread_count)
      })
      .catch(() => {})

    client
      .get(ENDPOINTS.credits.subscriptions)
      .then(({ data }: { data: Suscripcion[] }) => {
        const activa = data.find((s) => s.status === 'active')
        if (activa?.plan?.slug && activa.plan.slug !== 'free') {
          setPlanBadge(activa.plan.name.toUpperCase())
        }
      })
      .catch(() => {})
      .finally(() => setCheckingPlan(false))
  }, [user?.id])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.full_name
    ? user.full_name
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
      <aside className="flex flex-col overflow-hidden">
        <div className="bg-surface rounded-lg p-1 flex flex-col h-full">
          <img
            src="/logo.png"
            alt="MusicGen"
            className="w-[32px] h-[32px] object-contain mt-2 mb-4 ml-1"
          />
          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
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
          <div className="border-t border-card-hover my-3" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[15px] text-muted hover:text-white hover:bg-card-hover transition-all duration-150 w-full text-left"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="bg-night rounded-lg overflow-hidden flex flex-col gap-2">
        <header className="bg-surface rounded-lg flex items-center justify-end gap-4 px-6 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-card-hover px-3 py-1.5 rounded-full">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: 'var(--color-primary)' }}
              >
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
              </svg>
              {checkingPlan ? (
                <span className="text-xs" style={{ color: '#a7a7a7' }}>
                  ...
                </span>
              ) : planBadge ? (
                <span className="text-xs font-bold" style={{ color: '#A855F7' }}>
                  {planBadge}
                </span>
              ) : (
                <>
                  <span className="text-white text-xs font-semibold">
                    {user?.credit_balance ?? 0}
                  </span>
                  <span className="text-muted text-xs">créditos</span>
                </>
              )}
            </div>
            {!checkingPlan && !planBadge && (
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-150"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  color: 'white',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                ✦ Upgrade
              </button>
            )}
          </div>
          {/* Notification bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifs((v) => !v)}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-subdued)',
                display: 'flex',
                alignItems: 'center',
                padding: 6,
                borderRadius: 6,
              }}
              title="Notificaciones"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {unread > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#A855F7',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: 320,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                    Notificaciones
                  </span>
                  {unread > 0 && (
                    <button
                      onClick={() =>
                        markAllNotificationsRead()
                          .then(() => {
                            setUnread(0)
                            setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
                          })
                          .catch(() => {})
                      }
                      style={{
                        fontSize: 11,
                        color: 'var(--color-primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Marcar todas leídas
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'var(--text-subdued)',
                        fontSize: 13,
                      }}
                    >
                      Sin notificaciones
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.is_read) {
                            markNotificationRead(n.id).catch(() => {})
                            setNotifs((prev) =>
                              prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
                            )
                            setUnread((prev) => Math.max(0, prev - 1))
                          }
                          setShowNotifs(false)
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: n.is_read ? 'transparent' : 'rgba(168,85,247,0.06)',
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.background =
                            'var(--bg-card-hover)')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.background = n.is_read
                            ? 'transparent'
                            : 'rgba(168,85,247,0.06)')
                        }
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: n.is_read ? 400 : 600,
                              color: 'var(--text-base)',
                            }}
                          >
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#A855F7',
                                flexShrink: 0,
                                marginTop: 3,
                              }}
                            />
                          )}
                        </div>
                        {n.message && (
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: 12,
                              color: 'var(--text-subdued)',
                            }}
                          >
                            {n.message}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-card-hover" />
          <div className="flex items-center gap-2.5 mr-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none"
              style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
            >
              {initials}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white text-sm font-medium truncate max-w-[220px]">
                {user?.full_name ?? '—'}
              </span>
              <span className="text-muted text-[10px] truncate max-w-[220px]">
                {user?.email ?? '—'}
              </span>
            </div>
          </div>
        </header>

        <div className="bg-surface rounded-lg flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <UpgradeModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(planName) => {
          setPlanBadge(planName)
          setShowModal(false)
        }}
      />
    </div>
  )
}
