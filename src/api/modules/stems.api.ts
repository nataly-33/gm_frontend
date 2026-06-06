import client from '../client'
import { ENDPOINTS } from '../endpoints'

export interface StemFile {
  id: string
  stem_type: 'vocals' | 'no_vocals' | 'bass' | 'drums' | 'other'
  duration_seconds: number | null
  file_size_bytes: number | null
  created_at: string
}

export interface StemJob {
  id: string
  source_filename: string
  source_file_size_bytes: number
  model_used?: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress_pct: number
  credits_used: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  stem_files?: StemFile[]
}

export async function uploadAndSeparate(file: File): Promise<{ job_id: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post(ENDPOINTS.stems.separate, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getStemJobs(): Promise<StemJob[]> {
  const { data } = await client.get(ENDPOINTS.stems.jobs)
  return data
}

export async function getStemJobStatus(jobId: string): Promise<StemJob> {
  const { data } = await client.get(ENDPOINTS.stems.jobStatus(jobId))
  return data
}

export async function getStemDownloadUrl(fileId: string): Promise<string> {
  const { data } = await client.get(ENDPOINTS.stems.downloadUrl(fileId))
  return data.url
}
