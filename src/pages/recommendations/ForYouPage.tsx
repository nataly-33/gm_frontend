import { useEffect, useState } from 'react'
import { getForYou, getSuggestedTags } from '../../api/modules/recommendations.api'
import type { SuggestedTag } from '../../api/modules/recommendations.api'
import type { LibrarySong } from '../../api/modules/songs.api'
import { getSongPlayUrl } from '../../api/modules/songs.api'
import SongCard from '../../components/song/SongCard'
import styles from './ForYouPage.module.css'

export default function ForYouPage() {
  const [songs, setSongs]           = useState<LibrarySong[]>([])
  const [tags, setTags]             = useState<SuggestedTag[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeUrl, setActiveUrl]   = useState<string | null>(null)
  const [activeSong, setActiveSong] = useState<LibrarySong | null>(null)
  const [loadingPlay, setLoadingPlay] = useState(false)

  useEffect(() => {
    Promise.all([getForYou(), getSuggestedTags()])
      .then(([s, t]) => { setSongs(s); setTags(t) })
      .finally(() => setLoading(false))
  }, [])

  async function handlePlay(song: LibrarySong) {
    if (activeSong?.id === song.id) return
    setLoadingPlay(true)
    setActiveSong(song)
    try {
      const url = song.play_url ?? await getSongPlayUrl(song.id)
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
        <h1 className={styles.pageTitle}>Para ti</h1>
        <p className={styles.pageSubtitle}>
          Canciones públicas basadas en tus gustos musicales
        </p>
      </div>

      {tags.length > 0 && (
        <div className={styles.tagsSection}>
          <p className={styles.tagsLabel}>Tus géneros favoritos</p>
          <div className={styles.tagChips}>
            {tags.map(t => (
              <span key={t.id} className={styles.tagChip}>{t.name}</span>
            ))}
          </div>
        </div>
      )}

      {songs.length > 0 ? (
        <div className={styles.grid}>
          {songs.map(song => (
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
            Escucha y crea más canciones para que el sistema aprenda tus gustos.
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
