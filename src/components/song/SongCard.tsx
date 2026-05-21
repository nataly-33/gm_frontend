// ─────────────────────────────────────────────────────────────────────────────
// src/components/song/SongCard.tsx
// Tarjeta estilo Community: imagen grande full-width con título y tags encima
// del overlay, play button blanco flotante, contenido reducido debajo.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { getSongThumbnailUrl } from '../../api/modules/songs.api'
import type { LibrarySong, SongTag } from '../../api/modules/songs.api'
import styles from './SongCard.module.css'

interface SongCardProps {
  song: LibrarySong
  onPlay?: (song: LibrarySong) => void
  onLike?: (songId: string) => void
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function CoverPlaceholder() {
  return (
    <div className={styles.coverPlaceholder} aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
      </svg>
    </div>
  )
}

export default function SongCard({ song, onPlay, onLike }: SongCardProps) {
  const [liked, setLiked] = useState(false)

  type CoverState = 'loading' | 'loaded' | 'error'
  const [coverState,   setCoverState]   = useState<CoverState>('loading')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchThumbnail() {
      try {
        const url = await getSongThumbnailUrl(song.id)
        if (!cancelled) { setThumbnailUrl(url); setCoverState('loaded') }
      } catch {
        if (!cancelled) setCoverState('error')
      }
    }
    fetchThumbnail()
    return () => { cancelled = true }
  }, [song.id])

  function handleLike() {
    setLiked(prev => !prev)
    onLike?.(song.id)
  }

  // Tags: prioriza song.tags del backend, cae a genre/mood como fallback
  const tags: string[] = song.tags && song.tags.length > 0
    ? song.tags.map((t: SongTag) => t.name)
    : [song.genre, song.mood].filter(Boolean) as string[]

  return (
    <article className={styles.card}>

      {/* ── Cover: imagen grande con overlay y metadatos encima ── */}
      <div className={styles.coverWrapper}>

        {coverState === 'loading' && (
          <div className={styles.coverSkeleton} aria-label="Cargando portada..." />
        )}

        {coverState === 'loaded' && thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={`Portada de ${song.title ?? 'canción'}`}
            className={styles.cover}
            onError={() => setCoverState('error')}
          />
        )}

        {coverState === 'error' && <CoverPlaceholder />}

        {/* Degradado oscuro permanente en la parte inferior */}
        <div className={styles.coverOverlay} />

        {/* Título + tags sobre el gradiente */}
        <div className={styles.coverMeta}>
          <h3 className={styles.coverTitle}>{song.title || 'Sin título'}</h3>
          {tags.length > 0 && (
            <div className={styles.coverTagRow}>
              {tags.map(tag => (
                <span key={tag} className={styles.coverTagBadge}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Play blanco — aparece en hover */}
        <button
          className={styles.playBtn}
          onClick={() => onPlay?.(song)}
          aria-label={`Reproducir ${song.title}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      {/* ── Contenido debajo: fecha, descripción, acciones ─────── */}
      <div className={styles.content}>

        <div className={styles.subRow}>
          <span className={styles.date}>{formatDate(song.created_at)}</span>
          <span className={styles.duration}>{formatDuration(song.audio_duration)}</span>
        </div>

        {song.description && (
          <p className={styles.description}>{song.description}</p>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
            onClick={handleLike}
            aria-label={liked ? 'Quitar like' : 'Dar like'}
            aria-pressed={liked}
          >
            <svg
              width="15" height="15" viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Me gusta
          </button>

          <button
            className={styles.actionBtnPlay}
            onClick={() => onPlay?.(song)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Reproducir
          </button>
        </div>

      </div>
    </article>
  )
}