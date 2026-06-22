import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getKaraokePlayData } from '../../api/modules/karaoke.api'
import { generateRoomCode } from '../../hooks/useKaraokeRoom'
import { useAuthStore } from '../../store/auth.store'
import KaraokeLines from '../../components/karaoke/karaoke-lyrics'
import type { KaraokePlayData } from '../../types'
import styles from './karaoke-player-page.module.css'

const ROOM_COST = 1

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function KaraokePlayerPage() {
  const { karaokeId } = useParams<{ karaokeId: string }>()
  const { state } = useLocation() as {
    state?: { songId?: string; songTitle?: string; source?: string }
  }
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const creditBalance = user?.credit_balance ?? 0

  const audioRef = useRef<HTMLAudioElement>(null)
  const lyricsScrollRef = useRef<HTMLDivElement>(null)
  const [playData, setPlayData] = useState<KaraokePlayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Cargar datos del karaoke desde el backend (URL del instrumental + timestamps de Whisper)
  useEffect(() => {
    if (!karaokeId) return
    setLoading(true)
    getKaraokePlayData(karaokeId)
      .then(setPlayData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [karaokeId])

  const handleTimeUpdate = useCallback(() => {
    setCurrentTime(audioRef.current?.currentTime ?? 0)
  }, [])

  const handleDurationChange = useCallback(() => {
    setDuration(audioRef.current?.duration ?? 0)
  }, [])

  const handleEnded = useCallback(() => setIsPlaying(false), [])

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  function skip(secs: number) {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + secs))
  }

  function handleCreateRoom() {
    if (!playData) return
    if (creditBalance < ROOM_COST) {
      setRoomError(`Necesitás ${ROOM_COST} crédito para crear una sala. Tenés ${creditBalance}.`)
      return
    }
    const code = generateRoomCode()
    navigate(`/karaoke/room/${code}`, {
      state: {
        isCreating: true,
        songId: state?.songId,
        songTitle,
        karaokeId,
        playUrl: playData.play_url,
        lyricsTimestamps: playData.lyrics_timestamps,
      },
    })
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const songTitle = playData?.song_title ?? state?.songTitle ?? 'Karaoke'

  return (
    <div className={styles.page}>
      {playData && (
        <audio
          ref={audioRef}
          src={playData.play_url}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/karaoke')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Catálogo
        </button>

        <button className={styles.roomBtn} onClick={handleCreateRoom} disabled={!playData}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          Crear sala
          <span className={styles.roomCost}>{ROOM_COST} crédito</span>
        </button>
      </div>

      {roomError && (
        <div className={styles.roomError} onClick={() => setRoomError(null)}>
          {roomError}
        </div>
      )}

      {/* ── Letras ───────────────────────────────────────────── */}
      <div className={styles.lyricsWrapper}>
        <div className={styles.fadeTop} />

        {loading && <p className={styles.loadingMsg}>Cargando karaoke...</p>}

        {!loading && playData && playData.lyrics_timestamps.length > 0 && (
          <div className={styles.lyricsScroll} ref={lyricsScrollRef}>
            <KaraokeLines
              timestamps={playData.lyrics_timestamps}
              audioRef={audioRef}
              scrollRef={lyricsScrollRef}
            />
          </div>
        )}

        {!loading && playData && playData.lyrics_timestamps.length === 0 && (
          <div className={styles.loadingMsg} style={{ opacity: 0.45, textAlign: 'center', padding: '0 32px' }}>
            <p style={{ fontSize: 15, marginBottom: 6 }}>Las letras no están disponibles.</p>
            <p style={{ fontSize: 12 }}>
              Instalá ffmpeg en el servidor y regenerá el karaoke para obtenerlas.
            </p>
          </div>
        )}

        <div className={styles.fadeBottom} />
      </div>

      {/* ── Footer: controles ─────────────────────────────────── */}
      <div className={styles.footer}>
        <div className={styles.songInfo}>
          <span className={styles.songTitle}>{songTitle}</span>
          <span className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className={styles.progressWrapper} onClick={handleSeek}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.controls}>
          <button className={styles.skipBtn} onClick={() => skip(-10)} aria-label="Retroceder 10s">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>

          <button className={styles.playBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button className={styles.skipBtn} onClick={() => skip(10)} aria-label="Adelantar 10s">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
