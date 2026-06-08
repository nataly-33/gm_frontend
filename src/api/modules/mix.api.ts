import client from '../client'
import { ENDPOINTS } from '../endpoints'
import type { LibrarySong } from './songs.api'

export interface MixClip {
  id: string
  position: number
  start_time_ms: number
  end_time_ms: number
  fade_in_ms: number
  fade_out_ms: number
  volume: number
  song: string | null
  stem_file: string | null
  song_detail: LibrarySong | null
  duration_ms: number
  created_at: string
}

export interface MixProject {
  id: string
  title: string
  description: string | null
  bpm: number | null
  status: 'draft' | 'processing' | 'ready' | 'failed'
  output_s3_key: string | null
  duration_seconds: number | null
  clips: MixClip[]
  clip_count: number
  created_at: string
  updated_at: string
}

export interface ExportStatus {
  status: 'queued' | 'processing' | 'ready' | 'failed'
  format: string
  error_message: string | null
  download_url?: string
}

export async function getMixProjects(): Promise<MixProject[]> {
  const { data } = await client.get<MixProject[]>(ENDPOINTS.mix.projects)
  return data
}

export async function createMixProject(payload: { title: string; description?: string; bpm?: number }): Promise<MixProject> {
  const { data } = await client.post<MixProject>(ENDPOINTS.mix.projects, payload)
  return data
}

export async function getMixProject(id: string): Promise<MixProject> {
  const { data } = await client.get<MixProject>(ENDPOINTS.mix.project(id))
  return data
}

export async function updateMixProject(id: string, payload: { title?: string; description?: string; bpm?: number }): Promise<MixProject> {
  const { data } = await client.patch<MixProject>(ENDPOINTS.mix.project(id), payload)
  return data
}

export async function deleteMixProject(id: string): Promise<void> {
  await client.delete(ENDPOINTS.mix.project(id))
}

export async function addClip(mixId: string, payload: {
  song_id?: string
  stem_file_id?: string
  position?: number
  start_time_ms: number
  end_time_ms: number
  fade_in_ms?: number
  fade_out_ms?: number
  volume?: number
}): Promise<MixClip> {
  const { data } = await client.post<MixClip>(ENDPOINTS.mix.clips(mixId), payload)
  return data
}

export async function updateClip(mixId: string, clipId: string, payload: Partial<{
  start_time_ms: number
  end_time_ms: number
  fade_in_ms: number
  fade_out_ms: number
  volume: number
  position: number
}>): Promise<MixClip> {
  const { data } = await client.patch<MixClip>(ENDPOINTS.mix.clip(mixId, clipId), payload)
  return data
}

export async function deleteClip(mixId: string, clipId: string): Promise<void> {
  await client.delete(ENDPOINTS.mix.clip(mixId, clipId))
}

export async function reorderClips(mixId: string, clipIds: string[]): Promise<void> {
  await client.post(ENDPOINTS.mix.reorder(mixId), { clip_ids: clipIds })
}

export async function startMixExport(mixId: string, payload: { format: 'mp3' | 'wav'; quality: string }): Promise<{ export_id: string }> {
  const { data } = await client.post<{ export_id: string }>(ENDPOINTS.mix.export(mixId), payload)
  return data
}

export async function getMixExportStatus(exportId: string): Promise<ExportStatus> {
  const { data } = await client.get<ExportStatus>(ENDPOINTS.mix.exportStatus(exportId))
  return data
}
