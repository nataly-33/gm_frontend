// ─────────────────────────────────────────────────────────────────────────────
// src/api/modules/songs.api.ts
// Todas las llamadas HTTP relacionadas con canciones.
// Ninguna página llama a fetch/axios directamente: todo pasa por aquí.
// ─────────────────────────────────────────────────────────────────────────────

import client from '../client'
import { ENDPOINTS } from '../endpoints'

// ── Types ────────────────────────────────────────────────────────────────────

export interface GenerateSongPayload {
  description?: string
  prompt?: string
  audio_duration?: number
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
  audio_duration?: number          // segundos
  created_at: string
  thumbnail_url?: string     // puede llegar pre-firmada desde el listado
  play_url?: string
  tags?: SongTag[]
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Inicia la generación de una canción.
 * Requiere al menos `description` o `prompt`.
 * Lanza error 402 si no hay créditos suficientes.
 */
export async function generateSong(
  payload: GenerateSongPayload,
): Promise<GenerateSongResponse> {
  const { data } = await client.post<GenerateSongResponse>(
    ENDPOINTS.songs.generate,
    payload,
  )
  return data
}

/**
 * Consulta el estado de un job de generación.
 * Usado en el polling cada 5 segundos.
 */
export async function getSongJob(jobId: string): Promise<JobStatusResponse> {
  const { data } = await client.get<JobStatusResponse>(
    ENDPOINTS.songs.job(jobId),
  )
  return data
}

/**
 * Obtiene la URL firmada de S3 para reproducir el audio de una canción.
 */
export async function getSongPlayUrl(songId: string): Promise<string> {
  const { data } = await client.get<SignedUrlResponse>(
    ENDPOINTS.songs.playUrl(songId),
  )
  return data.url
}

/**
 * Obtiene la URL firmada de S3 para el thumbnail/portada de una canción.
 */
export async function getSongThumbnailUrl(songId: string): Promise<string> {
  const { data } = await client.get<SignedUrlResponse>(
    ENDPOINTS.songs.thumbnailUrl(songId),
  )
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