import { useEffect, useState } from 'react'
import client from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import type { LibrarySong } from '../../api/modules/songs.api'

interface UsageStats {
  total_users: number
  new_users_30d: number
  total_songs_generated: number
  songs_last_30d: number
  failed_jobs_30d: number
  public_songs: number
}

interface StatCardProps {
  label: string
  value: number | string
  sublabel?: string
  color?: string
  icon: React.ReactNode
}

function StatCard({ label, value, sublabel, color = 'var(--color-primary)', icon }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-subdued)', fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: 'var(--bg-card-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-base)' }}>
          {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
        </p>
        {sublabel && <p style={{ fontSize: 12, color: 'var(--text-subdued)', margin: '4px 0 0' }}>{sublabel}</p>}
      </div>
    </div>
  )
}

export default function ReportsAdminPage() {
  const [stats, setStats]       = useState<UsageStats | null>(null)
  const [topSongs, setTopSongs] = useState<LibrarySong[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      client.get<UsageStats>(ENDPOINTS.reports.usage),
      client.get<LibrarySong[]>(ENDPOINTS.reports.topSongs),
    ])
      .then(([u, t]) => { setStats(u.data); setTopSongs(t.data) })
      .catch(() => setError('No se pudieron cargar los reportes.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100%', padding: '28px 32px', color: 'var(--text-base)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Reportes</h1>
        <p style={{ fontSize: 14, color: 'var(--text-subdued)', margin: '4px 0 0' }}>Estadísticas de uso de la plataforma</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 110, borderRadius: 10, background: 'linear-gradient(90deg,#282828 25%,#333 50%,#282828 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Total usuarios"
              value={stats.total_users}
              sublabel={`+${stats.new_users_30d} en los últimos 30 días`}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>}
            />
            <StatCard
              label="Canciones generadas"
              value={stats.total_songs_generated}
              sublabel={`${stats.songs_last_30d} en los últimos 30 días`}
              color="#4ade80"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>}
            />
            <StatCard
              label="Canciones públicas"
              value={stats.public_songs}
              sublabel="Visibles en la comunidad"
              color="#60a5fa"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V18c0-.55.45-1 1-1s1 .45 1 1v1.93C7.06 19.44 4 16.07 4 12c0-1.07.18-2.1.49-3.07l3.51 3.5v.57c0 1.1.9 2 2 2h.01v2.93zM18.92 17A8.013 8.013 0 0 0 12 4c-1.07 0-2.1.18-3.07.49l1.57 1.57h.5c1.1 0 2 .9 2 2v1h2c1.1 0 2 .9 2 2v2h-1c-.55 0-1 .45-1 1v2h.07c.52-.84.93-1.76 1.18-2.74l.66.66A7.96 7.96 0 0 1 18.92 17z" /></svg>}
            />
            <StatCard
              label="Nuevos usuarios (30d)"
              value={stats.new_users_30d}
              color="#f59e0b"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}
            />
            <StatCard
              label="Canciones (30d)"
              value={stats.songs_last_30d}
              color="#a3e635"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
            />
            <StatCard
              label="Jobs fallidos (30d)"
              value={stats.failed_jobs_30d}
              color="#f87171"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>}
            />
          </>
        ) : null}
      </div>

      {/* Top songs table */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Top canciones públicas</h2>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-hover)' }}>
              {['#', 'Título', 'Tags', 'Reproducciones', 'Fecha'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-subdued)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div style={{ height: 14, borderRadius: 4, background: 'linear-gradient(90deg,#282828 25%,#333 50%,#282828 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', width: j === 1 ? '70%' : '50%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : topSongs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subdued)', fontSize: 14 }}>
                  Sin canciones públicas aún.
                </td>
              </tr>
            ) : (
              topSongs.map((song, idx) => (
                <tr key={song.id} style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-subdued)', width: 40 }}>{idx + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{song.title ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(song.tags ?? []).slice(0, 3).map(t => (
                        <span key={t.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 500, background: 'rgba(168,85,247,0.12)', color: 'var(--color-primary)' }}>
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-subdued)' }}>
                    {/* play_count not in LibrarySong serializer but backend orders by it */}
                    —
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-subdued)' }}>
                    {new Date(song.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  )
}
