import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPlaylists,
  createPlaylist,
  getAutoPlaylists,
  generateAutoPlaylists,
} from '../../api/modules/playlists.api'
import type { Playlist } from '../../api/modules/playlists.api'
import styles from './PlaylistsPage.module.css'

type Tab = 'manual' | 'auto'

function PlaylistCard({ playlist, onClick }: { playlist: Playlist; onClick: () => void }) {
  const isAuto = playlist.type !== 'manual'
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardCover}>
        {playlist.cover_url ? (
          <img src={playlist.cover_url} alt={playlist.title} />
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18A3 3 0 1 0 19 17V8h3V6h-5z" />
          </svg>
        )}
      </div>
      <p className={styles.cardTitle}>{playlist.title}</p>
      <p className={styles.cardMeta}>{playlist.song_count} canción{playlist.song_count !== 1 ? 'es' : ''}</p>
      <span className={`${styles.typeBadge} ${isAuto ? styles.typeBadgeAuto : styles.typeBadgeManual}`}>
        {isAuto ? 'Auto' : 'Manual'}
      </span>
    </div>
  )
}

export default function PlaylistsPage() {
  const navigate = useNavigate()
  const [tab, setTab]                   = useState<Tab>('manual')
  const [manual, setManual]             = useState<Playlist[]>([])
  const [auto, setAuto]                 = useState<Playlist[]>([])
  const [loading, setLoading]           = useState(true)
  const [newTitle, setNewTitle]         = useState('')
  const [creating, setCreating]         = useState(false)
  const [generating, setGenerating]     = useState(false)
  const [showCreate, setShowCreate]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([getPlaylists(), getAutoPlaylists()])
      .then(([m, a]) => { setManual(m); setAuto(a) })
      .catch(() => setError('No se pudieron cargar las playlists.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const p = await createPlaylist({ title: newTitle.trim() })
      setManual(prev => [p, ...prev])
      setNewTitle('')
      setShowCreate(false)
    } catch {
      setError('No se pudo crear la playlist.')
    } finally {
      setCreating(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateAutoPlaylists()
      const updated = await getAutoPlaylists()
      setAuto(updated)
    } catch {
      setError('Error al generar playlists automáticas.')
    } finally {
      setGenerating(false)
    }
  }

  const list = tab === 'manual' ? manual : auto

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Playlists</h1>
          <p className={styles.pageSubtitle}>
            {tab === 'manual' ? 'Tus playlists creadas a mano' : 'Playlists generadas automáticamente por tus géneros y estados de ánimo'}
          </p>
        </div>
        {tab === 'manual' && (
          <button
            onClick={() => setShowCreate(v => !v)}
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
          >
            + Nueva playlist
          </button>
        )}
      </div>

      {error && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {showCreate && tab === 'manual' && (
        <div className={styles.createForm}>
          <input
            type="text"
            className={styles.createInput}
            placeholder="Nombre de la playlist..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)', opacity: creating ? 0.6 : 1 }}
          >
            {creating ? 'Creando...' : 'Crear'}
          </button>
          <button
            onClick={() => { setShowCreate(false); setNewTitle('') }}
            className="px-4 py-2 rounded-full text-sm text-muted hover:text-white transition-all"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'manual' ? styles.tabActive : ''}`}
          onClick={() => setTab('manual')}
        >
          Mis playlists
        </button>
        <button
          className={`${styles.tab} ${tab === 'auto' ? styles.tabActive : ''}`}
          onClick={() => setTab('auto')}
        >
          Automáticas
        </button>
      </div>

      {tab === 'auto' && (
        <div className={styles.autoBar}>
          <p className={styles.autoHint}>
            El sistema genera playlists a partir de tus géneros y estados de ánimo más usados.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: 'var(--bg-card-hover)',
              color: 'var(--text-base)',
              border: '1px solid var(--border)',
              opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? 'Generando...' : '↺ Regenerar'}
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className={styles.grid}>
          {list.map(p => (
            <PlaylistCard
              key={p.id}
              playlist={p}
              onClick={() => navigate(`/playlists/${p.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18A3 3 0 1 0 19 17V8h3V6h-5z" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>
            {tab === 'manual' ? 'Aún no tienes playlists' : 'Sin playlists automáticas'}
          </h3>
          <p className={styles.emptyText}>
            {tab === 'manual'
              ? 'Crea tu primera playlist para organizar tus canciones.'
              : 'Haz clic en "Regenerar" para crear playlists según tus géneros y moods.'}
          </p>
        </div>
      )}
    </div>
  )
}
