import { useCallback, useEffect, useRef, useState } from 'react'
import { ref, set, update, onValue } from 'firebase/database'
// @ts-ignore — firebase.js es JS puro; Vite resuelve el módulo correctamente
import { db } from '../firebase.js'
import type { KaraokeRoom, KaraokeParticipant, LyricTimestamp } from '../types'

export function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// Tipo raw que llega de Realtime DB: participants y lyricsTimestamps vienen como objetos con claves numéricas
interface RawRoom extends Omit<KaraokeRoom, 'participants' | 'lyricsTimestamps'> {
  participants?: Record<string, KaraokeParticipant>
  lyricsTimestamps?: LyricTimestamp[] | Record<string, LyricTimestamp>
  volumes?: Record<string, number>
}

interface Params {
  roomCode: string
  userId: string
  userName: string
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export function useKaraokeRoom({ roomCode, userId, userName, audioRef }: Params) {
  const [room, setRoom] = useState<KaraokeRoom | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading')
  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isHost = !!room && room.hostId === userId

  // Escuchar cambios en tiempo real con onValue
  useEffect(() => {
    if (!roomCode) return

    const roomRef = ref(db, `karaokeRooms/${roomCode}`)
    const unsub = onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setStatus('not_found')
          return
        }

        const raw = snapshot.val() as RawRoom

        // Realtime DB puede devolver arrays como objetos con claves numéricas; normalizar
        const normalized: KaraokeRoom = {
          ...raw,
          participants: Object.values(raw.participants ?? {}),
          lyricsTimestamps: Array.isArray(raw.lyricsTimestamps)
            ? raw.lyricsTimestamps
            : Object.values(raw.lyricsTimestamps ?? {}),
          volumes: raw.volumes,
        }

        setRoom(normalized)
        setStatus('ready')

        // Guest: sincronizar audio con el currentTime que escribe el host
        if (raw.hostId !== userId && audioRef.current) {
          if (raw.state === 'playing') {
            const drift = Math.abs(audioRef.current.currentTime - raw.currentTime)
            if (drift > 0.5) audioRef.current.currentTime = raw.currentTime
            if (audioRef.current.paused) audioRef.current.play().catch(() => {})
          }
          if (raw.state === 'ended' && !audioRef.current.paused) {
            audioRef.current.pause()
          }
        }
      },
      () => setStatus('error'),
    )

    return () => unsub()
  }, [roomCode, userId, audioRef])

  // Host: escribir currentTime a Realtime DB cada segundo mientras reproduce
  useEffect(() => {
    if (syncRef.current) clearInterval(syncRef.current)
    if (!isHost || room?.state !== 'playing') return

    syncRef.current = setInterval(async () => {
      if (!audioRef.current) return
      try {
        await update(ref(db, `karaokeRooms/${roomCode}`), {
          currentTime: audioRef.current.currentTime,
        })
      } catch {
        // silencioso — el guest sigue con el último valor conocido
      }
    }, 1000)

    return () => {
      if (syncRef.current) clearInterval(syncRef.current)
    }
  }, [isHost, room?.state, roomCode, audioRef])

  async function createRoom(data: {
    songId: string
    songTitle: string
    karaokeId: string
    playUrl: string
    lyricsTimestamps: LyricTimestamp[]
  }) {
    const participant: KaraokeParticipant = { userId, userName, joinedAt: Date.now() }
    const roomData: RawRoom = {
      roomCode,
      hostId: userId,
      hostName: userName,
      ...data,
      state: 'waiting',
      currentTime: 0,
      startedAt: null,
      participants: { [userId]: participant },
      creditsCharged: 1,
    }
    await set(ref(db, `karaokeRooms/${roomCode}`), roomData)
  }

  async function joinRoom() {
    const participant: KaraokeParticipant = { userId, userName, joinedAt: Date.now() }
    // update con path anidado: solo escribe el slot del usuario, no borra a los demás
    await update(ref(db, `karaokeRooms/${roomCode}`), {
      [`participants/${userId}`]: participant,
    })
  }

  // Bug fix: startPlaying no requiere audioRef — en la sala waiting el <audio> aún no está montado.
  // La reproducción se inicia en la página via useEffect cuando room.state cambia a 'playing'.
  async function startPlaying() {
    await update(ref(db, `karaokeRooms/${roomCode}`), {
      state: 'playing',
      startedAt: Date.now(),
      currentTime: 0,
    })
  }

  async function endRoom() {
    await update(ref(db, `karaokeRooms/${roomCode}`), { state: 'ended' })
    audioRef.current?.pause()
  }

  // Un invitado abandona la sala: se quita de participants y volumes en Firebase.
  // (El host usa endRoom; esto es solo para guests.)
  async function leaveRoom() {
    audioRef.current?.pause()
    try {
      await update(ref(db, `karaokeRooms/${roomCode}`), {
        [`participants/${userId}`]: null,
        [`volumes/${userId}`]: null,
      })
    } catch {
      // silencioso — igual navegamos fuera de la sala
    }
  }

  // Publicar el nivel de volumen del micrófono propio a Firebase (cada ~200ms)
  const publishVolume = useCallback(
    async (level: number) => {
      if (!roomCode) return
      try {
        await update(ref(db, `karaokeRooms/${roomCode}`), {
          [`volumes/${userId}`]: Math.round(level * 100) / 100,
        })
      } catch {
        // silencioso
      }
    },
    [roomCode, userId],
  )

  return { room, status, isHost, createRoom, joinRoom, startPlaying, endRoom, leaveRoom, publishVolume }
}
