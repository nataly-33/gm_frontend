import client from '../client'
import { ENDPOINTS } from '../endpoints'
import type { LibrarySong } from './songs.api'

export interface PlaylistSongItem {
  id: string
  song: LibrarySong
  position: number
  added_at: string
}

export interface Playlist {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  type: 'manual' | 'auto_mood' | 'auto_genre' | 'recommended'
  is_public: boolean
  share_token: string | null
  song_count: number
  playlist_songs: PlaylistSongItem[]
  created_at: string
  updated_at: string
}

export async function getPlaylists(): Promise<Playlist[]> {
  const { data } = await client.get<Playlist[]>(ENDPOINTS.playlists.list)
  return data
}

export async function createPlaylist(payload: { title: string; description?: string }): Promise<Playlist> {
  const { data } = await client.post<Playlist>(ENDPOINTS.playlists.list, payload)
  return data
}

export async function getPlaylist(id: string): Promise<Playlist> {
  const { data } = await client.get<Playlist>(ENDPOINTS.playlists.detail(id))
  return data
}

export async function updatePlaylist(id: string, payload: { title?: string; description?: string }): Promise<Playlist> {
  const { data } = await client.patch<Playlist>(ENDPOINTS.playlists.detail(id), payload)
  return data
}

export async function deletePlaylist(id: string): Promise<void> {
  await client.delete(ENDPOINTS.playlists.detail(id))
}

export async function addSongToPlaylist(playlistId: string, songId: string, position?: number): Promise<void> {
  await client.post(ENDPOINTS.playlists.songs(playlistId), { song_id: songId, position })
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
  await client.delete(ENDPOINTS.playlists.songRemove(playlistId, songId))
}

export async function sharePlaylist(id: string): Promise<{ share_url: string }> {
  const { data } = await client.post<{ share_url: string }>(ENDPOINTS.playlists.share(id))
  return data
}

export async function getAutoPlaylists(): Promise<Playlist[]> {
  const { data } = await client.get<Playlist[]>(ENDPOINTS.playlists.auto)
  return data
}

export async function generateAutoPlaylists(): Promise<void> {
  await client.post(ENDPOINTS.playlists.autoGenerate)
}
