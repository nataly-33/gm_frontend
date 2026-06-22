import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getKaraokeCatalog, getMyKaraokes } from '../../api/modules/karaoke.api'
import { getSongThumbnailUrl, getSongPlayUrl } from '../../api/modules/songs.api'
import JoinRoomModal from '../../components/karaoke/join-room-modal'
import type { KaraokeCatalogSong, MyKaraokeItem } from '../../types'
import styles from './karaoke-page.module.css'

type Source = 'library' | 'community' | 'my-karaokes'

// ── Tarjeta individual ────────────────────────────────────────────────────────

function KaraokeSongCard({
  song,
  onSelect,
  isPreviewing,
  onTogglePreview,
}: {
  song: KaraokeCatalogSong
  onSelect: (song: KaraokeCatalogSong) => void
  isPreviewing: boolean
  onTogglePreview: (song: KaraokeCatalogSong) => void
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSongThumbnailUrl(song.id)
      .then((url) => {
        if (!cancelled) setThumbnailUrl(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [song.id])

  const tags = song.tags?.slice(0, 3) ?? []

  return (
    <article className={styles.songCard}>
      <div className={styles.songCover}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Portada de ${song.title}`}
            className={styles.songCoverImg}
            onError={() => setThumbnailUrl(null)}
          />
        ) : (
          <div className={styles.songCoverPlaceholder}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
        )}
        <div className={styles.songCoverOverlay} />

        {/* Botón reproducir (preview) sobre la portada */}
        <button
          className={`${styles.previewBtn} ${isPreviewing ? styles.previewBtnActive : ''}`}
          onClick={() => onTogglePreview(song)}
          aria-label={isPreviewing ? 'Pausar' : 'Reproducir'}
          title={isPreviewing ? 'Pausar' : 'Escuchar'}
        >
          {isPreviewing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      <div className={styles.songInfo}>
        <p className={styles.songTitle}>{song.title}</p>
        {song.user_name && <p className={styles.songAuthor}>por {song.user_name}</p>}
      </div>

      {tags.length > 0 && (
        <div className={styles.tagRow}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tagPill}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <button className={styles.singBtn} onClick={() => onSelect(song)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
        Cantar
      </button>
    </article>
  )
}

// ── Tarjeta "Mis Karaokes" ────────────────────────────────────────────────────

const STATUS_LABEL: Record<MyKaraokeItem['status'], string> = {
  ready: '',
  queued: 'En cola',
  processing: 'Procesando...',
  failed: 'Error',
}

function MyKaraokeCard({
  item,
  onPlay,
}: {
  item: MyKaraokeItem
  onPlay: (item: MyKaraokeItem) => void
}) {
  const isReady = item.status === 'ready'

  return (
    <article className={styles.songCard}>
      <div className={styles.songCover}>
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={`Portada de ${item.song_title}`}
            className={styles.songCoverImg}
          />
        ) : (
          <div className={styles.songCoverPlaceholder}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
        )}
        <div className={styles.songCoverOverlay} />
        {!isReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {STATUS_LABEL[item.status] || item.status}
          </div>
        )}
      </div>

      <div className={styles.songInfo}>
        <p className={styles.songTitle}>{item.song_title}</p>
      </div>

      <button
        className={styles.singBtn}
        onClick={() => onPlay(item)}
        disabled={!isReady}
        title={isReady ? 'Cantar' : STATUS_LABEL[item.status]}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
        Cantar
      </button>
    </article>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function KaraokePage() {
  const navigate = useNavigate()
  const [source, setSource] = useState<Source>('library')
  const [songs, setSongs] = useState<KaraokeCatalogSong[]>([])
  const [myKaraokes, setMyKaraokes] = useState<MyKaraokeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)

  // Preview de audio: un solo <audio> para todo el catálogo
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Detener el preview al cambiar de tab/búsqueda o desmontar
  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause()
    }
  }, [])

  async function handleTogglePreview(song: KaraokeCatalogSong) {
    const audio = previewAudioRef.current
    if (!audio) return

    // Si ya está sonando esta canción → pausar
    if (previewId === song.id) {
      audio.pause()
      setPreviewId(null)
      return
    }

    try {
      const url = await getSongPlayUrl(song.id)
      audio.src = url
      await audio.play()
      setPreviewId(song.id)
    } catch {
      setPreviewId(null)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    setSongs([])
    setMyKaraokes([])
    // Cortar cualquier preview al cambiar de fuente
    previewAudioRef.current?.pause()
    setPreviewId(null)

    if (source === 'my-karaokes') {
      getMyKaraokes()
        .then(setMyKaraokes)
        .catch(() => setError('No se pudieron cargar tus karaokes. Intentá de nuevo.'))
        .finally(() => setLoading(false))
    } else {
      getKaraokeCatalog(source)
        .then(setSongs)
        .catch(() => setError('No se pudieron cargar las canciones. Intentá de nuevo.'))
        .finally(() => setLoading(false))
    }
  }, [source])

  function handleSelect(song: KaraokeCatalogSong) {
    navigate(`/karaoke/generate/${song.id}`, {
      state: { songTitle: song.title, source, thumbnailUrl: song.thumbnail_url },
    })
  }

  function handlePlayKaraoke(item: MyKaraokeItem) {
    navigate(`/karaoke/play/${item.karaoke_id}`, {
      state: { songId: item.song_id, songTitle: item.song_title, source: 'my-karaokes' },
    })
  }

  const filtered = search
    ? songs.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : songs

  const filteredMyKaraokes = search
    ? myKaraokes.filter((k) => k.song_title.toLowerCase().includes(search.toLowerCase()))
    : myKaraokes

  return (
    <div className={styles.page}>
      {/* Audio único para los previews del catálogo */}
      <audio ref={previewAudioRef} onEnded={() => setPreviewId(null)} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Karaoke</h1>
          <p className={styles.pageSubtitle}>Elegí una canción para empezar a cantar</p>
        </div>
        <button
          onClick={() => setShowJoinModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 18px',
            borderRadius: 500,
            border: '1px solid var(--border)',
            background: 'none',
            color: 'var(--text-subdued)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-base)'
            e.currentTarget.style.borderColor = 'var(--color-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-subdued)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          Unirse a sala
        </button>
      </div>

      {showJoinModal && <JoinRoomModal onClose={() => setShowJoinModal(false)} />}

      {/* ── Controls: picker + búsqueda ────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.sourcePicker}>
          <button
            className={`${styles.sourceBtn} ${source === 'library' ? styles.sourceBtnActive : ''}`}
            onClick={() => setSource('library')}
          >
            Mi Biblioteca
          </button>
          <button
            className={`${styles.sourceBtn} ${source === 'community' ? styles.sourceBtnActive : ''}`}
            onClick={() => setSource('community')}
          >
            Comunidad
          </button>
          <button
            className={`${styles.sourceBtn} ${source === 'my-karaokes' ? styles.sourceBtnActive : ''}`}
            onClick={() => setSource('my-karaokes')}
          >
            Mis Karaokes
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.searchIcon}
          >
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16a6.471 6.471 0 004.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar canción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
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

      {/* ── Skeletons ──────────────────────────────────────────── */}
      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {/* ── Grid de canciones ──────────────────────────────────── */}
      {!loading && source !== 'my-karaokes' && filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((song) => (
            <KaraokeSongCard
              key={song.id}
              song={song}
              onSelect={handleSelect}
              isPreviewing={previewId === song.id}
              onTogglePreview={handleTogglePreview}
            />
          ))}
        </div>
      )}

      {!loading && source === 'my-karaokes' && filteredMyKaraokes.length > 0 && (
        <div className={styles.grid}>
          {filteredMyKaraokes.map((item) => (
            <MyKaraokeCard key={item.karaoke_id} item={item} onPlay={handlePlayKaraoke} />
          ))}
        </div>
      )}

      {/* ── Estado vacío ───────────────────────────────────────── */}
      {!loading && !error && source !== 'my-karaokes' && filtered.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>
            {search
              ? 'Sin resultados'
              : source === 'library'
                ? 'Tu biblioteca está vacía'
                : 'Sin canciones en la comunidad'}
          </h3>
          <p className={styles.emptyText}>
            {search
              ? 'Probá con otro término de búsqueda.'
              : source === 'library'
                ? 'Generá tu primera canción en "Crear canción".'
                : 'Aún no hay canciones publicadas en la comunidad.'}
          </p>
        </div>
      )}

      {!loading && !error && source === 'my-karaokes' && filteredMyKaraokes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>
            {search ? 'Sin resultados' : 'Todavía no tenés karaokes generados'}
          </h3>
          <p className={styles.emptyText}>
            {search
              ? 'Probá con otro término de búsqueda.'
              : 'Elegí una canción de tu biblioteca o de la comunidad para empezar.'}
          </p>
        </div>
      )}
    </div>
  )
}
