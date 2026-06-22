import client from '../client'
import { ENDPOINTS } from '../endpoints'
import { getLibrary } from './songs.api'
import { getCommunityFeed } from './community.api'
import type {
  KaraokeCatalogSong,
  KaraokeGenerateResult,
  KaraokePlayData,
  LyricTimestamp,
  MyKaraokeItem,
} from '../../types'

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Devuelve las canciones disponibles para karaoke según la fuente elegida.
 * Usa los endpoints de biblioteca y comunidad directamente para mantener
 * el picker "Mi Biblioteca / Comunidad" del catálogo.
 */
export async function getKaraokeCatalog(
  source: 'library' | 'community',
): Promise<KaraokeCatalogSong[]> {
  if (source === 'library') {
    const songs = await getLibrary()
    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      thumbnail_url: s.thumbnail_url,
      source: 'library' as const,
      tags: s.tags?.map((t) => t.name) ?? [],
    }))
  }

  const { results } = await getCommunityFeed()
  return results.map((s) => ({
    id: s.id,
    title: s.title,
    thumbnail_url: undefined,
    source: 'community' as const,
    user_name: s.user_name,
    tags: s.tags?.map((t) => t.name) ?? [],
  }))
}

/**
 * Inicia la generación de karaoke para una canción.
 * Devuelve karaoke_id + status: 'queued' de inmediato.
 * El backend cobra 2 créditos y lanza 402 si no hay saldo.
 */
export async function generateKaraoke(songId: string): Promise<KaraokeGenerateResult> {
  const { data } = await client.post<KaraokeGenerateResult>(ENDPOINTS.karaoke.generate(songId))
  return data
}

/**
 * Consulta el estado de un karaoke en procesamiento.
 * Llamar periódicamente hasta que status sea 'ready' o 'failed'.
 */
export async function pollKaraokeStatus(karaokeId: string): Promise<{ status: string }> {
  const { data } = await client.get<{ status: string }>(ENDPOINTS.karaoke.status(karaokeId))
  return data
}

// Tipo interno que refleja la forma exacta que devuelve KaraokePlaySerializer
interface PlayApiResponse {
  id?: string
  play_url?: string
  audio_url?: string
  instrumental_url?: string
  lyrics?: string
  lyrics_timestamps?: LyricTimestamp[]
  song_title?: string
  title?: string
  song?: { id?: string; title?: string; duration?: number }
  song_thumbnail?: string
  thumbnail_url?: string
}

/**
 * Obtiene los datos para reproducir un karaoke: URL de audio + letra sincronizada.
 * El backend devuelve la URL presignada del instrumental y los timestamps de Whisper.
 * El campo song_title puede venir plano o anidado dentro de `song.title`.
 */
export async function getKaraokePlayData(karaokeId: string): Promise<KaraokePlayData> {
  const { data } = await client.get<PlayApiResponse>(ENDPOINTS.karaoke.play(karaokeId))
  return {
    play_url: data.play_url ?? data.audio_url ?? data.instrumental_url ?? '',
    lyrics: data.lyrics ?? '',
    lyrics_timestamps: data.lyrics_timestamps ?? [],
    song_title: data.song_title ?? data.title ?? data.song?.title ?? '',
    song_thumbnail: data.song_thumbnail ?? data.thumbnail_url,
  }
}

/** Devuelve los karaokes ya generados del usuario autenticado. */
export async function getMyKaraokes(): Promise<MyKaraokeItem[]> {
  const { data } = await client.get<MyKaraokeItem[]>(ENDPOINTS.karaoke.myLibrary)
  return data
}
