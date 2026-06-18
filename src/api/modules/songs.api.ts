// ─────────────────────────────────────────────────────────────────────────────
// src/api/modules/songs.api.ts
// Todas las llamadas HTTP relacionadas con canciones.
// Ninguna página llama a fetch/axios directamente: todo pasa por aquí.
// ─────────────────────────────────────────────────────────────────────────────

import client from '../client'
import { ENDPOINTS } from '../endpoints'

// ── Types ────────────────────────────────────────────────────────────────────

export interface LyricsSegment {
  start: number
  end: number
  text: string
}

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

export interface GenerateSongResponse {
  job_id: string
  song_id: string
  status: 'queued'
}

export type JobStatus = 'processing' | 'ready' | 'no_credits' | 'error'

export interface JobStatusResponse {
  status: JobStatus
  song_id: string
}

export interface SignedUrlResponse {
  url: string
}

export interface SongTag {
  id: number | string
  name: string
  slug?: string
}

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
}

export interface SongDetail extends LibrarySong {
  lyrics?: string
  described_lyrics?: string
  lyrics_source?: string
  instrumental?: boolean
  guidance_scale?: number
  infer_step?: number
  seed?: number
  status?: string
  is_public?: boolean
  updated_at?: string
  lyrics_timestamps?: LyricsSegment[]
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Inicia la generación de una canción.
 * Requiere al menos `description` o `prompt`.
 * Lanza error 402 si no hay créditos suficientes.
 */
export async function generateSong(payload: GenerateSongPayload): Promise<GenerateSongResponse> {
  const { data } = await client.post<GenerateSongResponse>(ENDPOINTS.songs.generate, payload)
  return data
}

/**
 * Consulta el estado de un job de generación.
 * Usado en el polling cada 5 segundos.
 */
export async function getSongJob(jobId: string): Promise<JobStatusResponse> {
  const { data } = await client.get<JobStatusResponse>(ENDPOINTS.songs.job(jobId))
  return data
}

/**
 * Obtiene la URL firmada de S3 para reproducir el audio de una canción.
 */
export async function getSongPlayUrl(songId: string): Promise<string> {
  const { data } = await client.get<SignedUrlResponse>(ENDPOINTS.songs.playUrl(songId))
  return data.url
}

/**
 * Obtiene la URL firmada de S3 para el thumbnail/portada de una canción.
 */
export async function getSongThumbnailUrl(songId: string): Promise<string> {
  const { data } = await client.get<SignedUrlResponse>(ENDPOINTS.songs.thumbnailUrl(songId))
  return data.url
}

/**
 * Devuelve la biblioteca del usuario (canciones propias), ordenadas por fecha
 * descendente (el backend ya las ordena así).
 */
export async function getLibrary(): Promise<LibrarySong[]> {
  const { data } = await client.get<LibrarySong[]>(ENDPOINTS.songs.library)
  return data
}

/**
 * Devuelve el detalle completo de una canción, incluyendo letra.
 */
export async function getSongDetail(songId: string): Promise<SongDetail> {
  const { data } = await client.get<SongDetail>(ENDPOINTS.songs.detail(songId))
  return data
}

/**
 * Elimina una canción (soft delete). Retorna 204 sin cuerpo.
 */
export async function deleteSong(songId: string): Promise<void> {
  await client.delete(ENDPOINTS.songs.delete(songId))
}

/**
 * Publica o despublica una canción cambiando su campo is_public.
 */
export async function toggleSongPublic(songId: string, isPublic: boolean): Promise<void> {
  await client.patch(ENDPOINTS.songs.update(songId), { is_public: isPublic })
}
