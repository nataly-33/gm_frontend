import { useState, useEffect, useRef } from 'react'
import type { LibrarySong } from '../../api/modules/songs.api'
import { getSongDetail } from '../../api/modules/songs.api'
import styles from './lyrics-view.module.css'

interface LyricsLine {
  text: string
  type: 'lyric' | 'section' | 'cue'
  startTime: number
}

const SECONDS_PER_LINE = 4.5
const INTRO_SECONDS    = 8

function parseLyrics(text: string, audioDuration: number): LyricsLine[] {
  const raw = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const lines: LyricsLine[] = raw.map((t) => ({
    text: t,
    type: /^\[.+\]$/.test(t) ? 'section' : /^\(.+\)$/.test(t) ? 'cue' : 'lyric',
    startTime: -1,
  }))

  const introTime = Math.min(INTRO_SECONDS, audioDuration * 0.08)

  // Asignar startTime a cada línea de letra: introTime + idx * 4.5s
  let lyricIdx = 0
  const timed = lines.map((line) => {
    if (line.type !== 'lyric') return line
    const t = introTime + lyricIdx * SECONDS_PER_LINE
    lyricIdx++
    return { ...line, startTime: t }
  })

  // Secciones y cues heredan el tiempo de la siguiente línea de letra
  for (let i = 0; i < timed.length; i++) {
    if (timed[i].type !== 'lyric') {
      let nextLyricTime = introTime
      for (let j = i + 1; j < timed.length; j++) {
        if (timed[j].type === 'lyric') {
          nextLyricTime = timed[j].startTime
          break
        }
      }
      timed[i] = { ...timed[i], startTime: nextLyricTime }
    }
  }

  return timed
}

interface Props {
  song: LibrarySong
  audioRef: React.RefObject<HTMLAudioElement | null>
  onClose: () => void
}

export default function LyricsView({ song, audioRef, onClose }: Props) {
  const [lines, setLines]               = useState<LyricsLine[]>([])
  const [activeIdx, setActiveIdx]       = useState(-1)
  const [loading, setLoading]           = useState(true)
  const [isInstrumental, setIsInstrumental] = useState(false)
  const activeLineRef = useRef<HTMLDivElement>(null)

  // ── Cargar letra (ignorar lyrics_timestamps de la BD) ─────────────────────
  useEffect(() => {
    setLoading(true)
    setLines([])
    setActiveIdx(-1)
    setIsInstrumental(false)

    getSongDetail(song.id)
      .then((detail) => {
        const lyricsText = detail.lyrics || ''
        if (!lyricsText || detail.instrumental) {
          setIsInstrumental(true)
        } else {
          // Siempre usar el estimado — no leer lyrics_timestamps de la BD
          setLines(parseLyrics(lyricsText, detail.audio_duration ?? 180))
        }
      })
      .catch(() => setIsInstrumental(true))
      .finally(() => setLoading(false))
  }, [song.id])

  // ── Sincronización con el audio cada 200 ms ───────────────────────────────
  useEffect(() => {
    if (lines.length === 0) return

    const id = setInterval(() => {
      if (!audioRef.current) return
      const t = audioRef.current.currentTime

      const lyricEntries = lines
        .map((l, i) => ({ ...l, i }))
        .filter((l) => l.type === 'lyric' && l.startTime >= 0)

      let next = -1
      for (const entry of lyricEntries) {
        if (entry.startTime <= t) next = entry.i
        else break
      }

      setActiveIdx((prev) => (prev === next ? prev : next))
    }, 200)

    return () => clearInterval(id)
  }, [lines, audioRef])

  // ── Scroll automático a la línea activa ───────────────────────────────────
  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIdx])

  // ── Cerrar con Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className={styles.overlay}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar letra">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>

      <div className={styles.songMeta}>
        <span className={styles.lyricsLabel}>Letra</span>
        <span className={styles.songTitle}>{song.title}</span>
      </div>

      <div className={styles.lyricsWrapper}>
        <div className={styles.fadeTop} />

        <div className={styles.lyricsContainer}>
          {loading && <div className={styles.message}>Cargando letra...</div>}

          {!loading && isInstrumental && (
            <div className={styles.message}>
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ opacity: 0.25 }}
              >
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
              <p>Canción instrumental — sin letra</p>
            </div>
          )}

          {!loading &&
            !isInstrumental &&
            lines.map((line, i) => {
              const isActive = i === activeIdx
              const dist     = Math.abs(i - activeIdx)

              if (line.type === 'section') {
                return (
                  <div key={i} className={styles.sectionLabel}>
                    {line.text.replace(/[[\]]/g, '').toUpperCase()}
                  </div>
                )
              }

              if (line.type === 'cue') {
                return (
                  <div key={i} className={styles.cueLine}>
                    {line.text}
                  </div>
                )
              }

              const opacity  = isActive ? 1 : dist === 1 ? 0.45 : dist === 2 ? 0.22 : 0.1
              const fontSize = isActive ? '40px' : dist === 1 ? '28px' : '23px'

              return (
                <div
                  key={i}
                  ref={isActive ? activeLineRef : null}
                  className={`${styles.lyricLine} ${isActive ? styles.lyricLineActive : ''}`}
                  style={{ opacity, fontSize }}
                >
                  {line.text}
                </div>
              )
            })}
        </div>

        <div className={styles.fadeBottom} />
      </div>
    </div>
  )
}