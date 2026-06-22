import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useKaraokeRoom } from '../../hooks/useKaraokeRoom'
import { useAuthStore } from '../../store/auth.store'
import KaraokeLines from '../../components/karaoke/karaoke-lyrics'
import type { KaraokeParticipant, LyricTimestamp } from '../../types'
import styles from './karaoke-room-page.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Calcula el nivel RMS de volumen (0-1) del stream del micrófono. */
function getRmsVolume(analyser: AnalyserNode): number {
  const buf = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteTimeDomainData(buf)
  let sum = 0
  for (let i = 0; i < buf.length; i++) {
    const n = buf[i] / 128 - 1 // normalizado a -1..1
    sum += n * n
  }
  return Math.sqrt(sum / buf.length)
}

// ── ParticipantBubble ─────────────────────────────────────────────────────────

interface BubbleProps {
  participant: KaraokeParticipant
  isHost: boolean
  volume?: number
  size?: number
}

function ParticipantBubble({ participant, isHost, volume = 0, size = 80 }: BubbleProps) {
  // Amplificar volumen para que el efecto visual sea perceptible incluso en voz baja
  const v = Math.min(1, volume * 4)
  const ringSpread = 2 + v * 10
  const ringOpacity = 0.15 + v * 0.55
  const glow = v * 28

  if (size <= 48) {
    // Mini versión para el header del modo playing
    return (
      <div
        className={styles.miniBubble}
        title={participant.userName}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.34,
          boxShadow: `0 0 0 ${2 + v * 6}px rgba(74,222,128,${ringOpacity}), 0 0 ${v * 16}px rgba(74,222,128,${v * 0.5})`,
        }}
      >
        {initials(participant.userName)}
      </div>
    )
  }

  return (
    <div className={styles.bubble}>
      <div
        className={styles.bubbleAvatar}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.27,
          boxShadow: `0 0 0 ${ringSpread}px rgba(74,222,128,${ringOpacity}), 0 0 ${glow}px rgba(74,222,128,${v * 0.45})`,
        }}
      >
        {initials(participant.userName)}
      </div>
      <span className={styles.bubbleName}>{participant.userName}</span>
      {isHost && <span className={styles.bubbleHostBadge}>host</span>}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function KaraokeRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const { state } = useLocation() as {
    state?: {
      isCreating?: boolean
      songId?: string
      songTitle?: string
      karaokeId?: string
      playUrl?: string
      lyricsTimestamps?: LyricTimestamp[]
    }
  }
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const hasCreatedRef = useRef(false)

  // Micrófono y volumen propio
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [ownVolume, setOwnVolume] = useState(0)

  const lyricsScrollRef = useRef<HTMLDivElement>(null)

  const { room, status, isHost, createRoom, joinRoom, startPlaying, endRoom, leaveRoom, publishVolume } =
    useKaraokeRoom({
      roomCode: roomCode!,
      userId: user?.id ?? '',
      userName: user?.full_name ?? 'Invitado',
      audioRef,
    })

  // Invitado abandona la sala: se quita de Firebase y vuelve al catálogo.
  function handleLeave() {
    leaveRoom().finally(() => navigate('/karaoke'))
  }

  // ── Crear sala si somos el host ─────────────────────────────────────────────
  useEffect(() => {
    if (!state?.isCreating || hasCreatedRef.current) return
    if (!state.songId || !state.playUrl || !state.lyricsTimestamps) return

    hasCreatedRef.current = true
    setCreating(true)

    // TODO BACKEND: cuando exista endpoint de salas, mover el cobro al servidor
    const currentUser = useAuthStore.getState().user
    if (currentUser) {
      useAuthStore.getState().setUser({
        ...currentUser,
        credit_balance: Math.max(0, currentUser.credit_balance - 1),
      })
    }

    createRoom({
      songId: state.songId,
      songTitle: state.songTitle ?? 'Canción',
      karaokeId: state.karaokeId ?? '',
      playUrl: state.playUrl,
      lyricsTimestamps: state.lyricsTimestamps,
    })
      .then(() => setCreating(false))
      .catch(() => setCreating(false))
  }, []) // eslint-disable-line

  // ── Guest: unirse cuando el doc existe ─────────────────────────────────────
  const hasJoinedRef = useRef(false)
  useEffect(() => {
    if (!room || isHost || hasJoinedRef.current) return
    hasJoinedRef.current = true
    joinRoom().catch(() => {})
  }, [room, isHost, joinRoom])

  // ── Bug fix: iniciar reproducción cuando state → 'playing' ─────────────────
  // startPlaying() solo escribe en Firebase; el <audio> no existe en estado waiting.
  // Este useEffect corre DESPUÉS de que React monta el <audio> del estado playing.
  const prevRoomStateRef = useRef<string | undefined>()
  useEffect(() => {
    if (room?.state === 'playing' && prevRoomStateRef.current !== 'playing') {
      prevRoomStateRef.current = 'playing'
      if (audioRef.current?.paused) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } else if (room?.state) {
      prevRoomStateRef.current = room.state
    }
  }, [room?.state])

  // ── Micrófono: captura de volumen con Web Audio API ─────────────────────────
  useEffect(() => {
    let stopped = false
    let interval: ReturnType<typeof setInterval> | null = null

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((s) => {
        // Si el componente desmontó mientras esperábamos el permiso, apagar de inmediato
        if (stopped) { s.getTracks().forEach((t) => t.stop()); return }

        micStreamRef.current = s
        const ctx = new AudioContext()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(s)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser

        interval = setInterval(() => {
          if (!analyserRef.current) return
          setOwnVolume(getRmsVolume(analyserRef.current))
        }, 150)
      })
      .catch(() => {
        // Permiso denegado — los anillos se muestran sin animación de volumen propio
      })

    return () => {
      stopped = true
      if (interval) clearInterval(interval)
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
      audioCtxRef.current?.close().catch(() => {})
      audioCtxRef.current = null
      analyserRef.current = null
    }
  }, []) // eslint-disable-line

  // ── Apagar micrófono cuando la sala termina ───────────────────────────────
  // El componente NO desmonta al pasar a 'ended' (solo cambia el render condicional),
  // por eso necesitamos apagar el micro explícitamente aquí.
  useEffect(() => {
    if (room?.state !== 'ended') return
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    analyserRef.current = null
    setOwnVolume(0)
  }, [room?.state])

  // ── Publicar volumen propio a Firebase para que los demás lo vean ───────────
  useEffect(() => {
    if (!roomCode) return
    publishVolume(ownVolume)
  }, [ownVolume, publishVolume, roomCode])

  // ── Handlers de audio ───────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(
    () => setCurrentTime(audioRef.current?.currentTime ?? 0),
    [],
  )
  const handleDurationChange = useCallback(
    () => setDuration(audioRef.current?.duration ?? 0),
    [],
  )
  const handlePlay = useCallback(() => setIsPlaying(true), [])
  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handleEnded = useCallback(() => setIsPlaying(false), [])

  function togglePlay() {
    if (!audioRef.current) return
    isPlaying ? audioRef.current.pause() : audioRef.current.play()
  }

  function skip(secs: number) {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + secs))
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  function handleCopy() {
    navigator.clipboard.writeText(roomCode ?? '').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const playUrl = room?.playUrl ?? state?.playUrl
  const lyricsTimestamps = room?.lyricsTimestamps ?? state?.lyricsTimestamps ?? []
  const songTitle = room?.songTitle ?? state?.songTitle ?? 'Karaoke'

  // Volumen de un participante: propio desde estado local, ajenos desde Firebase
  function volumeOf(p: KaraokeParticipant): number {
    if (p.userId === user?.id) return ownVolume
    return room?.volumes?.[p.userId] ?? 0
  }

  // ── Creando sala ────────────────────────────────────────────────────────────

  if (creating || (state?.isCreating && status === 'loading' && !room)) {
    return (
      <div className={`${styles.page} ${styles.centerState}`}>
        <div className={styles.spinner} />
        <p className={styles.centerTitle}>Creando sala...</p>
        <p className={styles.centerText}>Tu sala de karaoke se está configurando.</p>
      </div>
    )
  }

  // ── Sala no encontrada ──────────────────────────────────────────────────────

  if (status === 'not_found') {
    return (
      <div className={`${styles.page} ${styles.centerState}`}>
        <p className={styles.centerTitle}>Sala no encontrada</p>
        <p className={styles.centerText}>
          El código &ldquo;{roomCode}&rdquo; no corresponde a ninguna sala activa.
        </p>
        <button className={styles.centerBtn} onClick={() => navigate('/karaoke')}>
          Volver al catálogo
        </button>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (status === 'error') {
    return (
      <div className={`${styles.page} ${styles.centerState}`}>
        <p className={styles.centerTitle}>Error de conexión</p>
        <p className={styles.centerText}>No se pudo conectar a la sala. Intentá de nuevo.</p>
        <button className={styles.centerBtn} onClick={() => navigate('/karaoke')}>
          Volver al catálogo
        </button>
      </div>
    )
  }

  // ── Cargando ────────────────────────────────────────────────────────────────

  if (!room) {
    return (
      <div className={`${styles.page} ${styles.centerState}`}>
        <div className={styles.spinner} />
        <p className={styles.centerText}>Conectando a la sala...</p>
      </div>
    )
  }

  // ── Sala terminada ──────────────────────────────────────────────────────────

  if (room.state === 'ended') {
    return (
      <div className={`${styles.page} ${styles.centerState} ${styles.endedPage}`}>
        <p className={styles.centerTitle}>La sala terminó</p>
        <p className={styles.centerText}>El host cerró la sesión de karaoke.</p>
        <button className={styles.centerBtn} onClick={() => navigate('/karaoke')}>
          Volver al catálogo
        </button>
      </div>
    )
  }

  // ── Sala en espera ──────────────────────────────────────────────────────────

  if (room.state === 'waiting') {
    return (
      <div className={`${styles.page} ${styles.waitingPage}`}>
        <div className={styles.waitingInner}>
          <button
            className={styles.backBtn}
            onClick={isHost ? () => navigate('/karaoke') : handleLeave}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            {isHost ? 'Volver' : 'Abandonar sala'}
          </button>

          <div className={styles.roomHeading}>
            <span className={styles.roomLabel}>Código de sala</span>
            <div className={styles.roomCodeRow}>
              <span className={styles.roomCode}>{roomCode}</span>
              <button
                className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
                onClick={handleCopy}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className={styles.songChip}>
            <svg
              className={styles.songChipIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            <span className={styles.songChipTitle}>{songTitle}</span>
          </div>

          {/* Bolitas con anillo de volumen */}
          <div className={styles.participantsSection}>
            <span className={styles.participantsLabel}>
              Participantes ({room.participants.length})
            </span>
            <div className={styles.bubblesRow}>
              {room.participants.map((p) => (
                <ParticipantBubble
                  key={p.userId}
                  participant={p}
                  isHost={p.userId === room.hostId}
                  volume={volumeOf(p)}
                  size={104}
                />
              ))}
            </div>
          </div>

          {isHost ? (
            <button className={styles.startBtn} onClick={startPlaying}>
              Empezar Karaoke
            </button>
          ) : (
            <div className={styles.waitingMsg}>
              <span className={styles.waitingDot} />
              Esperando que {room.hostName} empiece...
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Sala en reproducción ────────────────────────────────────────────────────

  return (
    <div className={`${styles.page} ${styles.playingPage}`}>
      {playUrl && (
        <audio
          ref={audioRef}
          src={playUrl}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      )}

      {/* Header */}
      <div className={styles.playingHeader}>
        <div className={styles.roomPill}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          {roomCode}
        </div>

        {/* Mini bolitas con volumen en el header */}
        <div className={styles.miniBubblesRow}>
          {room.participants.map((p) => (
            <ParticipantBubble
              key={p.userId}
              participant={p}
              isHost={p.userId === room.hostId}
              volume={volumeOf(p)}
              size={42}
            />
          ))}
          {isHost ? (
            <button className={styles.endBtn} onClick={endRoom}>
              Terminar
            </button>
          ) : (
            <button className={styles.endBtn} onClick={handleLeave}>
              Salir
            </button>
          )}
        </div>
      </div>

      {/* Letras */}
      <div className={styles.lyricsWrapper}>
        <div className={styles.fadeTop} />
        <div className={styles.lyricsScroll} ref={lyricsScrollRef}>
          <KaraokeLines
            timestamps={lyricsTimestamps}
            audioRef={audioRef}
            scrollRef={lyricsScrollRef}
          />
        </div>
        <div className={styles.fadeBottom} />
      </div>

      {/* Footer: host con controles, guest solo info */}
      {isHost ? (
        <div className={styles.playingFooter}>
          <div className={styles.footerInfo}>
            <span className={styles.footerTitle}>{songTitle}</span>
            <span className={styles.footerTime}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className={styles.progressWrapper} onClick={handleSeek}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.controls}>
            <button className={styles.skipBtn} onClick={() => skip(-10)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            <button className={styles.playBtn} onClick={togglePlay}>
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button className={styles.skipBtn} onClick={() => skip(10)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.guestFooter}>
          <p className={styles.guestSyncMsg}>Sincronizado con {room.hostName}</p>
          <button className={styles.leaveBtn} onClick={handleLeave}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Abandonar sala
          </button>
        </div>
      )}
    </div>
  )
}
