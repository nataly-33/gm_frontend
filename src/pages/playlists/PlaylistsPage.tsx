import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPlaylists,
  createPlaylist,
  addSongToPlaylist,
  getAutoPlaylists,
  generateAutoPlaylists,
} from '../../api/modules/playlists.api'
import type { Playlist } from '../../api/modules/playlists.api'
import { getLibrary } from '../../api/modules/songs.api'
import type { LibrarySong } from '../../api/modules/songs.api'
import styles from './PlaylistsPage.module.css'

type Tab = 'manual' | 'auto'

// Step 1: enter title. Step 2: pick songs.
type CreateStep = 'title' | 'songs'

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

  // Song-selection state for the two-step create flow
  const [createStep, setCreateStep]           = useState<CreateStep>('title')
  const [library, setLibrary]                 = useState<LibrarySong[]>([])
  const [libraryLoading, setLibraryLoading]   = useState(false)
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set())
  const [pendingPlaylist, setPendingPlaylist]  = useState<Playlist | null>(null)
  const [addingSongs, setAddingSongs]         = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getPlaylists(), getAutoPlaylists()])
      .then(([m, a]) => { setManual(m); setAuto(a) })
      .catch(() => setError('No se pudieron cargar las playlists.'))
      .finally(() => setLoading(false))
  }, [])

  function openCreateModal() {
    setNewTitle('')
    setSelectedSongIds(new Set())
    setPendingPlaylist(null)
    setCreateStep('title')
    setShowCreate(true)
  }

  function closeCreateModal() {
    setShowCreate(false)
    setNewTitle('')
    setSelectedSongIds(new Set())
    setPendingPlaylist(null)
    setCreateStep('title')
  }

  // Step 1 → Step 2: create the playlist then load the library
  async function handleCreateAndNext() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const p = await createPlaylist({ title: newTitle.trim() })
      setPendingPlaylist(p)
      setManual(prev => [p, ...prev])
      // Load library for song selection
      setLibraryLoading(true)
      try {
        const songs = await getLibrary()
        setLibrary(songs)
      } finally {
        setLibraryLoading(false)
      }
      setCreateStep('songs')
    } catch {
      setError('No se pudo crear la playlist.')
    } finally {
      setCreating(false)
    }
  }

  function toggleSong(id: string) {
    setSelectedSongIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Step 2 finish: add all selected songs then navigate
  async function handleFinishCreate() {
    if (!pendingPlaylist) { closeCreateModal(); return }
    setAddingSongs(true)
    try {
      const ids = Array.from(selectedSongIds)
      for (let i = 0; i < ids.length; i++) {
        await addSongToPlaylist(pendingPlaylist.id, ids[i], i)
      }
      // Update local song_count
      if (ids.length > 0) {
        setManual(prev => prev.map(p =>
          p.id === pendingPlaylist.id ? { ...p, song_count: ids.length } : p
        ))
      }
      closeCreateModal()
      navigate(`/playlists/${pendingPlaylist.id}`)
    } catch {
      setError('No se pudieron agregar algunas canciones.')
      closeCreateModal()
    } finally {
      setAddingSongs(false)
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
            onClick={openCreateModal}
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

      {/* Two-step create modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={e => { if (e.target === e.currentTarget) closeCreateModal() }}
        >
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '28px 32px',
            width: '100%',
            maxWidth: 520,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            {createStep === 'title' ? (
              <>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Nueva playlist</h2>
                <input
                  type="text"
                  className={styles.createInput}
                  style={{ maxWidth: '100%' }}
                  placeholder="Nombre de la playlist..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateAndNext()}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeCreateModal}
                    style={{ padding: '8px 18px', borderRadius: 500, fontSize: 13, background: 'none', border: '1px solid var(--border)', color: 'var(--text-subdued)', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateAndNext}
                    disabled={creating || !newTitle.trim()}
                    style={{
                      padding: '8px 18px', borderRadius: 500, fontSize: 13, fontWeight: 700,
                      background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                      border: 'none', color: '#fff', cursor: 'pointer',
                      opacity: (creating || !newTitle.trim()) ? 0.6 : 1,
                    }}
                  >
                    {creating ? 'Creando...' : 'Siguiente →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Agregar canciones</h2>
                  <span style={{ fontSize: 13, color: 'var(--text-subdued)' }}>
                    {selectedSongIds.size} seleccionada{selectedSongIds.size !== 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-subdued)' }}>
                  Selecciona las canciones para "{pendingPlaylist?.title}". Puedes agregar más desde el detalle de la playlist.
                </p>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0, maxHeight: 340 }}>
                  {libraryLoading ? (
                    <p style={{ color: 'var(--text-subdued)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Cargando canciones...</p>
                  ) : library.length === 0 ? (
                    <p style={{ color: 'var(--text-subdued)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                      No tienes canciones en tu biblioteca aún.
                    </p>
                  ) : (
                    library.map(song => {
                      const selected = selectedSongIds.has(song.id)
                      return (
                        <div
                          key={song.id}
                          onClick={() => toggleSong(song.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '9px 12px', borderRadius: 6, cursor: 'pointer',
                            background: selected ? 'rgba(168,85,247,0.15)' : 'transparent',
                            border: `1px solid ${selected ? 'rgba(168,85,247,0.5)' : 'transparent'}`,
                            transition: 'background 0.12s, border-color 0.12s',
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                            border: `2px solid ${selected ? '#A855F7' : 'var(--border)'}`,
                            background: selected ? '#A855F7' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.12s, border-color 0.12s',
                          }}>
                            {selected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? 'var(--color-primary)' : 'var(--text-base)' }}>
                              {song.title || 'Sin título'}
                            </p>
                            {song.tags && song.tags.length > 0 && (
                              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-subdued)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {song.tags.map(t => t.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeCreateModal}
                    style={{ padding: '8px 18px', borderRadius: 500, fontSize: 13, background: 'none', border: '1px solid var(--border)', color: 'var(--text-subdued)', cursor: 'pointer' }}
                  >
                    Omitir
                  </button>
                  <button
                    onClick={handleFinishCreate}
                    disabled={addingSongs}
                    style={{
                      padding: '8px 18px', borderRadius: 500, fontSize: 13, fontWeight: 700,
                      background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                      border: 'none', color: '#fff', cursor: 'pointer',
                      opacity: addingSongs ? 0.6 : 1,
                    }}
                  >
                    {addingSongs ? 'Guardando...' : selectedSongIds.size > 0 ? `Agregar ${selectedSongIds.size} y ver playlist` : 'Ver playlist vacía'}
                  </button>
                </div>
              </>
            )}
          </div>
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
