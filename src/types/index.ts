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
