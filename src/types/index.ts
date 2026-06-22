/**
 * Tipos compartidos del proyecto MusicGen.
 * Centraliza interfaces reutilizadas entre múltiples módulos.
 */

// ── Usuario y autenticación ────────────────────────────────────────────────

/** Datos del usuario autenticado almacenados en el store. */
export interface AuthUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  credit_balance: number
  role: string
  created_at: string
}

// ── Canciones ──────────────────────────────────────────────────────────────

/** Etiqueta musical asociada a una canción. */
export interface SongTag {
  id: number
  name: string
}

/** Canción en la biblioteca del usuario. */
export interface LibrarySong {
  id: string
  title: string
  description: string
  prompt: string
  genre?: string
  mood?: string
  audio_duration?: number
  created_at: string
  thumbnail_url?: string
  play_url?: string
  tags?: SongTag[]
  is_public?: boolean
  lyrics?: string
}

/** Payload para generar una nueva canción. */
export interface GenerateSongPayload {
  title?: string
  description?: string
  prompt?: string
  lyrics?: string
  described_lyrics?: string
  audio_duration?: number
  vocal_type?: 'male' | 'female' | 'auto'
  language?: 'es' | 'en'
  instrumental?: boolean
  guidance_scale?: number
  infer_step?: number
}

/** Respuesta al iniciar una generación. */
export interface GenerateSongResponse {
  job_id: string
}

// ── Stems (separación de audio) ────────────────────────────────────────────

/** Tipo de stem separado por Demucs. */
export type StemType = 'vocals' | 'drums' | 'bass' | 'other' | 'karaoke'

/** Archivo de stem generado por una separación. */
export interface StemFile {
  id: string
  stem_type: StemType
  download_url?: string
  s3_key?: string
}

/** Job de separación de stems. */
export interface StemJob {
  id: string
  source_filename: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress_pct: number
  error_message?: string
  stem_files?: StemFile[]
  credits_used: number
  created_at: string
}

// ── Karaoke ───────────────────────────────────────────────────────────────

/** Timestamp de letra sincronizado con el audio (formato Whisper). */
export interface LyricTimestamp {
  start: number
  end: number
  text: string
}

/**
 * Canción normalizada para mostrar en el catálogo de karaoke.
 * TODO BACKEND: cuando exista GET /api/karaoke/catalog/ este tipo
 * vendrá directo del backend y el campo `source` desaparecerá.
 */
export interface KaraokeCatalogSong {
  id: string
  title: string
  thumbnail_url?: string
  source: 'library' | 'community'
  user_name?: string
  tags?: string[]
}

/**
 * Respuesta al iniciar la generación de un karaoke.
 * TODO BACKEND: vendrá de POST /api/karaoke/songs/{id}/generate/
 */
export interface KaraokeGenerateResult {
  karaoke_id: string
  status: 'queued' | 'processing' | 'ready'
}

/** Datos completos para reproducir un karaoke. */
export interface KaraokePlayData {
  play_url: string
  lyrics: string
  lyrics_timestamps: LyricTimestamp[]
  song_title: string
  song_thumbnail?: string
}

/** Item de la biblioteca personal de karaokes (GET /api/karaoke/my-library/). */
export interface MyKaraokeItem {
  karaoke_id: string
  song_id: string
  song_title: string
  thumbnail_url?: string
  status: 'queued' | 'processing' | 'ready' | 'failed'
  granted_at: string
}

/** Participante en una sala de karaoke Firebase. */
export interface KaraokeParticipant {
  userId: string
  userName: string
  joinedAt: number
}

/** Sala de karaoke en Realtime Database. */
export interface KaraokeRoom {
  roomCode: string
  hostId: string
  hostName: string
  songId: string
  songTitle: string
  karaokeId: string
  playUrl: string
  lyricsTimestamps: LyricTimestamp[]
  state: 'waiting' | 'playing' | 'ended'
  currentTime: number
  startedAt: number | null
  participants: KaraokeParticipant[]
  creditsCharged: number
  /** Nivel de volumen de micrófono de cada participante (0-1), actualizado cada 200ms */
  volumes?: Record<string, number>
}

// ── API utilitarios ────────────────────────────────────────────────────────

/** Error genérico de la API. */
export interface ApiError {
  detail?: string
  message?: string
  [key: string]: unknown
}

/** Respuesta paginada de la API. */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
