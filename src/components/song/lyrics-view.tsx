import { useState, useEffect, useRef, useMemo } from 'react'
import type { LibrarySong, LyricsSegment } from '../../api/modules/songs.api'
import { getSongDetail } from '../../api/modules/songs.api'
import styles from './lyrics-view.module.css'

interface LyricsLine {
  text: string
  type: 'lyric' | 'section' | 'cue'
  startTime: number
}

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

  // Detect whether the first section tag is [intro]
  const firstSection = lines.find((l) => l.type === 'section')
  const hasIntro = firstSection !== undefined && /^\[intro\]$/i.test(firstSection.text)

  // Detect whether any section tag is [outro]
  const hasOutro = lines.some((l) => l.type === 'section' && /^\[outro\]$/i.test(l.text))

  // Dynamic intro time: ACE-Step generates long intros when the prompt includes [intro]
  const introTime = hasIntro ? audioDuration * 0.3 : Math.min(8, audioDuration * 0.08)

  // Dynamic outro time
  const outroTime = hasOutro ? audioDuration * 0.08 : audioDuration * 0.03

  const singableTime = audioDuration - introTime - outroTime

  // Only lyric lines consume time slots; section/cue lines inherit the next lyric's startTime
  const lyricLines = lines.filter((l) => l.type === 'lyric')
  const n = Math.max(lyricLines.length, 1)

  // First pass: assign startTime to every lyric line
  let lyricIdx = 0
  const timed = lines.map((line) => {
    if (line.type !== 'lyric') {
      return line
    }
    const t = introTime + (lyricIdx / n) * singableTime
    lyricIdx++
    return { ...line, startTime: t }
  })

  // Second pass: section/cue lines get the startTime of the next lyric line
  // so the section header appears just before the verse that follows it
  for (let i = 0; i < timed.length; i++) {
    if (timed[i].type !== 'lyric') {
      // Look ahead for the nearest lyric line
      let nextLyricTime = introTime // fallback: show at song start
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

interface TimedLine {
  text: string
  type: 'lyric' | 'section' | 'cue'
  startTime: number
  endTime: number
}

function buildTimedLines(storedLyrics: string, timestamps: LyricsSegment[]): TimedLine[] {
  const rawLines = storedLyrics
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const sectionRegex = /^\[.+\]$/
  const cueRegex = /^\(.+\)$/

  // Count total sung (non-section, non-cue) lines for proportional mapping
  const totalLyricLines = rawLines.filter((t) => !sectionRegex.test(t) && !cueRegex.test(t)).length

  let lyricIdx = 0

  return rawLines.map((text) => {
    if (sectionRegex.test(text)) {
      // Section: use the timestamp of the next sung line (proportional)
      const nextSegIdx =
        totalLyricLines > 0
          ? Math.round((lyricIdx * (timestamps.length - 1)) / Math.max(totalLyricLines - 1, 1))
          : 0
      const ts = timestamps[Math.min(nextSegIdx, timestamps.length - 1)] ?? { start: 0, end: 0 }
      return { text, type: 'section' as const, startTime: ts.start, endTime: ts.start }
    }
    if (cueRegex.test(text)) {
      const prevSegIdx = Math.max(
        0,
        Math.round(((lyricIdx - 1) * (timestamps.length - 1)) / Math.max(totalLyricLines - 1, 1))
      )
      const ts = timestamps[prevSegIdx] ?? { start: 0, end: 0 }
      return { text, type: 'cue' as const, startTime: ts.start, endTime: ts.start }
    }
    // Sung line: proportional mapping — line lyricIdx out of totalLyricLines
    const segIdx = Math.round(
      (lyricIdx * (timestamps.length - 1)) / Math.max(totalLyricLines - 1, 1)
    )
    const ts = timestamps[Math.min(segIdx, timestamps.length - 1)] ?? { start: 0, end: 999 }
    lyricIdx++
    return { text, type: 'lyric' as const, startTime: ts.start, endTime: ts.end }
  })
}

interface Props {
  song: LibrarySong
  audioRef: React.RefObject<HTMLAudioElement | null>
  onClose: () => void
}

export default function LyricsView({ song, audioRef, onClose }: Props) {
  const [lines, setLines] = useState<LyricsLine[]>([])
  const [fullLyrics, setFullLyrics] = useState<string | null>(null)
  const [songTimestamps, setSongTimestamps] = useState<LyricsSegment[] | null>(null)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [isInstrumental, setIsInstrumental] = useState(false)
  const activeLineRef = useRef<HTMLDivElement>(null)

  // Build timed lines from real Whisper timestamps when available
  const timedLines = useMemo<TimedLine[] | null>(() => {
    if (!fullLyrics || !songTimestamps?.length) {
      return null
    }
    return buildTimedLines(fullLyrics, songTimestamps)
  }, [fullLyrics, songTimestamps])

  // Visual lines: prefer timedLines (real timestamps), fall back to estimated lines
  const visualLines: Array<LyricsLine | TimedLine> = timedLines ?? lines

  useEffect(() => {
    setLoading(true)
    setLines([])
    setFullLyrics(null)
    setSongTimestamps(null)
    setActiveIdx(-1)
    setIsInstrumental(false)

    getSongDetail(song.id)
      .then((detail) => {
        const lyricsText = detail.lyrics || ''
        if (!lyricsText || detail.instrumental) {
          setIsInstrumental(true)
        } else {
          // Always keep the raw lyrics for buildTimedLines
          setFullLyrics(lyricsText)
          // Store real timestamps if the backend provided them
          const timestamps = (detail as any).lyrics_timestamps as LyricsSegment[] | undefined
          if (timestamps?.length) {
            setSongTimestamps(timestamps)
          }
          // Also build the estimated fallback lines
          setLines(parseLyrics(lyricsText, detail.audio_duration ?? 180))
        }
      })
      .catch(() => setIsInstrumental(true))
      .finally(() => setLoading(false))
  }, [song.id])

  // Poll currentTime to sync lines
  useEffect(() => {
    if (visualLines.length === 0) {
      return
    }

    const intervalMs = timedLines ? 100 : 200

    const id = setInterval(() => {
      if (!audioRef.current) {
        return
      }
      const t = audioRef.current.currentTime

      if (timedLines && timedLines.length > 0) {
        // Real timestamps: find the last lyric whose startTime <= currentTime
        let found = -1
        for (let i = timedLines.length - 1; i >= 0; i--) {
          if (timedLines[i].type === 'lyric' && t >= timedLines[i].startTime) {
            found = i
            break
          }
        }
        setActiveIdx((prev) => (prev === found ? prev : found))
      } else {
        // Fallback: estimated approach
        const lyricEntries = lines
          .map((l, i) => ({ ...l, i }))
          .filter((l) => l.type === 'lyric' && l.startTime >= 0)

        let next = -1
        for (const entry of lyricEntries) {
          if (entry.startTime <= t) {
            next = entry.i
          } else {
            break
          }
        }
        setActiveIdx((prev) => (prev === next ? prev : next))
      }
    }, intervalMs)

    return () => clearInterval(id)
  }, [timedLines, lines, audioRef, visualLines.length])

  // Scroll active line to center
  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIdx])

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
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
            visualLines.map((line, i) => {
              const isActive = i === activeIdx
              const dist = Math.abs(i - activeIdx)

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

              const opacity = isActive ? 1 : dist === 1 ? 0.45 : dist === 2 ? 0.22 : 0.1

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
