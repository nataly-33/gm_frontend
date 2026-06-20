import { useCallback, useEffect, useState } from 'react'
import { getForYou, getSuggestedTags } from '../../api/modules/recommendations.api'
import type { SuggestedTag } from '../../api/modules/recommendations.api'
import type { LibrarySong } from '../../api/modules/songs.api'
import { getSongPlayUrl } from '../../api/modules/songs.api'
import SongCard from '../../components/song/song-card'
import styles from './for-you-page.module.css'

export default function ForYouPage() {
  const [songs, setSongs] = useState<LibrarySong[]>([])
  const [tags, setTags] = useState<SuggestedTag[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [activeSong, setActiveSong] = useState<LibrarySong | null>(null)
  const [loadingPlay, setLoadingPlay] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const [s, t] = await Promise.all([getForYou(), getSuggestedTags()])
      setSongs(s)
      setTags(t)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handlePlay(song: LibrarySong) {
    if (activeSong?.id === song.id) {
      return
    }
    setLoadingPlay(true)
    setActiveSong(song)
    try {
      const url = song.play_url ?? (await getSongPlayUrl(song.id))
      setActiveUrl(url)
    } catch {
      setActiveUrl(null)
      setActiveSong(null)
    } finally {
      setLoadingPlay(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Para ti</h1>
          <p className={styles.pageSubtitle}>Cargando recomendaciones...</p>
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
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Para ti</h1>
            <p className={styles.pageSubtitle}>
              Canciones públicas recomendadas por el modelo musical
            </p>
          </div>
          <button
            className={styles.refreshBtn}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Actualizar recomendaciones"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={refreshing ? styles.spinning : undefined}
            >
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className={styles.tagsSection}>
          <p className={styles.tagsLabel}>Tus géneros detectados</p>
          <div className={styles.tagChips}>
            {tags.map((t) => (
              <span key={t.id} className={styles.tagChip}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {songs.length > 0 ? (
        <div className={styles.grid}>
          {songs.map((song) => (
            <SongCard key={song.id} song={song} onPlay={handlePlay} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>Sin recomendaciones todavía</h3>
          <p className={styles.emptyText}>
            Crea canciones con descripción libre para que el modelo aprenda tus gustos.
          </p>
        </div>
      )}

      {activeSong && (
        <div className={styles.miniPlayer}>
          {loadingPlay ? (
            <span style={{ fontSize: 13, color: 'var(--text-subdued)' }}>Cargando audio...</span>
          ) : activeUrl ? (
            <>
              <div className={styles.miniPlayerInfo}>
                <span className={styles.miniPlayerTitle}>{activeSong.title ?? 'Sin título'}</span>
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
