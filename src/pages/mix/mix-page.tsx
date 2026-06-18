import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMixProjects, createMixProject, deleteMixProject } from '../../api/modules/mix.api'
import type { MixProject } from '../../api/modules/mix.api'

const STATUS_COLOR: Record<string, string> = {
  draft: '#a7a7a7',
  processing: '#facc15',
  ready: '#4ade80',
  failed: '#f87171',
}

export default function MixPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<MixProject[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMixProjects()
      .then(setProjects)
      .catch(() => setError('No se pudieron cargar los proyectos.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!newTitle.trim()) {
      return
    }
    setCreating(true)
    try {
      const p = await createMixProject({ title: newTitle.trim() })
      setProjects((prev) => [p, ...prev])
      setNewTitle('')
      setShowForm(false)
      navigate(`/mix/${p.id}`)
    } catch {
      setError('No se pudo crear el proyecto.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este proyecto de mix?')) {
      return
    }
    try {
      await deleteMixProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('No se pudo eliminar el proyecto.')
    }
  }

  return (
    <div style={{ minHeight: '100%', padding: '28px 32px', color: 'var(--text-base)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Mix DJ
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-subdued)', margin: '4px 0 0' }}>
            Combina canciones y pistas de audio para crear secuencias estilo DJ
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            borderRadius: '500px',
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          + Nuevo proyecto
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {showForm && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Nombre del proyecto..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            style={{
              flex: 1,
              maxWidth: 360,
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--color-primary)',
              borderRadius: 4,
              padding: '10px 14px',
              fontSize: 14,
              color: 'var(--text-base)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: 500,
              fontSize: 13,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? 'Creando...' : 'Crear'}
          </button>
          <button
            onClick={() => setShowForm(false)}
            style={{
              padding: '10px 14px',
              borderRadius: 500,
              fontSize: 13,
              background: 'none',
              color: 'var(--text-subdued)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 130,
                borderRadius: 10,
                background: 'linear-gradient(90deg,#282828 25%,#333 50%,#282828 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          ))}
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      ) : projects.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '80px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--bg-card-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-subdued)',
              marginBottom: 20,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9h2v6H3V9zm4-2h2v10H7V7zm4-4h2v18h-2V3zm4 4h2v10h-2V7zm4 2h2v6h-2V9z" />
            </svg>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Sin proyectos de mix</h3>
          <p style={{ fontSize: 14, color: 'var(--text-subdued)', maxWidth: 300 }}>
            Crea tu primer proyecto para combinar canciones estilo DJ.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/mix/${p.id}`)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '18px',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)'
                ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'
                ;(e.currentTarget as HTMLDivElement).style.transform = ''
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M3 9h2v6H3V9zm4-2h2v10H7V7zm4-4h2v18h-2V3zm4 4h2v10h-2V7zm4 2h2v6h-2V9z" />
                  </svg>
                </div>
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-subdued)',
                    padding: 4,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: '0 0 4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.title}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-subdued)', margin: '0 0 12px' }}>
                {p.clip_count} clip{p.clip_count !== 1 ? 's' : ''}
                {p.bpm ? ` · ${p.bpm} BPM` : ''}
                {p.duration_seconds
                  ? ` · ${Math.floor(p.duration_seconds / 60)}:${String(p.duration_seconds % 60).padStart(2, '0')}`
                  : ''}
              </p>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 500,
                  background: 'rgba(255,255,255,0.05)',
                  color: STATUS_COLOR[p.status] ?? 'white',
                }}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
