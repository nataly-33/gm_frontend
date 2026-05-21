// ─────────────────────────────────────────────────────────────────────────────
// src/pages/library/LibraryPage.tsx
// Biblioteca del usuario. Consume /api/songs/library/ y renderiza SongCards.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { getLibrary, getSongPlayUrl } from '../../api/modules/songs.api'
import type { LibrarySong } from '../../api/modules/songs.api'
import SongCard from '../../components/song/SongCard'
import styles from './LibraryPage.module.css'
import { useNavigate } from 'react-router-dom';

type SortOption = 'recent' | 'oldest' | 'title'

export default function LibraryPage() {
  const [songs, setSongs]     = useState<LibrarySong[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<SortOption>('recent')

  // ── Audio player state ─────────────────────────────────────
  const [activeUrl, setActiveUrl]   = useState<string | null>(null)
  const [activeSong, setActiveSong] = useState<LibrarySong | null>(null)
  const [loadingPlay, setLoadingPlay] = useState(false)

  // ── Fetch library ──────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    getLibrary()
      .then(data => setSongs(data))
      .catch(() => setError('No se pudo cargar tu biblioteca. Intenta de nuevo.'))
      .finally(() => setLoading(false))
  }, [])

  const navigate = useNavigate();
  // ── Play handler ───────────────────────────────────────────
  async function handlePlay(song: LibrarySong) {
    // Si el mismo song ya está activo, no volver a pedir la URL
    if (activeSong?.id === song.id) return

    setLoadingPlay(true)
    setActiveSong(song)
    try {
      // Si la canción ya tiene play_url en el objeto, usarla directamente
      const url = song.play_url ?? await getSongPlayUrl(song.id)
      setActiveUrl(url)
    } catch {
      setActiveUrl(null)
      setActiveSong(null)
    } finally {
      setLoadingPlay(false)
    }
  }

  // ── Derived list ───────────────────────────────────────────
  const filtered = songs
    .filter(s =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.genre?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'recent')  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest')  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'title')   return (a.title ?? '').localeCompare(b.title ?? '')
      return 0
    })

  // ── Skeletons ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Tu biblioteca</h1>
            <p className={styles.pageSubtitle}>Cargando tus canciones...</p>
          </div>
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Tu biblioteca</h1>
          <p className={styles.pageSubtitle}>
            {songs.length > 0
              ? `${songs.length} canción${songs.length !== 1 ? 'es' : ''} generada${songs.length !== 1 ? 's' : ''}`
              : 'Aún no has generado ninguna canción'}
          </p>
        </div>
            <button
            onClick={() => navigate('/create')} 
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
            style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            }}
            >
            + Crear Cancion
            </button>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className={styles.errorBanner}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Controls ───────────────────────────────────────────── */}
      {songs.length > 0 && (
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.searchIcon}>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16a6.471 6.471 0 004.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar en tu biblioteca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.sortGroup}>
            {(['recent', 'oldest', 'title'] as SortOption[]).map(opt => (
              <button
                key={opt}
                onClick={() => setSort(opt)}
                className={`${styles.sortBtn} ${sort === opt ? styles.sortBtnActive : ''}`}
              >
                {{ recent: 'Recientes', oldest: 'Antiguas', title: 'A–Z' }[opt]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Grid ───────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map(song => (
            <SongCard key={song.id} song={song} onPlay={handlePlay} />
          ))}
        </div>
      ) : !loading && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>
            {search ? 'Sin resultados' : 'Tu biblioteca está vacía'}
          </h3>
          <p className={styles.emptyText}>
            {search
              ? 'Prueba con otro término de búsqueda.'
              : 'Genera tu primera canción en la pestaña "Crear canción".'}
          </p>
        </div>
      )}

      {/* ── Mini player ────────────────────────────────────────── */}
      {activeSong && (
        <div className={styles.miniPlayer}>
          {loadingPlay ? (
            <span className={styles.miniPlayerLoading}>Cargando audio...</span>
          ) : activeUrl ? (
            <>
              <div className={styles.miniPlayerInfo}>
                <span className={styles.miniPlayerTitle}>{activeSong.title ?? 'Sin título'}</span>
                {activeSong.genre && (
                  <span className={styles.miniPlayerGenre}>{activeSong.genre}</span>
                )}
              </div>
              <audio
                key={activeUrl}
                src={activeUrl}
                controls
                autoPlay
                className={styles.miniPlayerAudio}
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}