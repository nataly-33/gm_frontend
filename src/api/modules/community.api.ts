import client from '../client'
import { ENDPOINTS } from '../endpoints'

export interface CommunitySong {
  id: string
  title: string
  description: string | null
  thumbnail_s3_key: string | null
  tags: { id: number; name: string; category: string }[]
  play_count: number
  like_count: number
  user_name: string
  is_liked: boolean
  created_at: string
}

export interface CommunityFeedResponse {
  results: CommunitySong[]
  count: number
  page: number
  has_next: boolean
}

export interface CommunityStats {
  public_songs: number
  active_users: number
  plays_today: number
}

export async function getCommunityFeed(params: { search?: string; tag?: string; page?: number } = {}): Promise<CommunityFeedResponse> {
  const { data } = await client.get<CommunityFeedResponse>(ENDPOINTS.community.feed, { params })
  return data
}

export async function getTrending(): Promise<CommunitySong[]> {
  const { data } = await client.get<CommunitySong[]>(ENDPOINTS.community.trending)
  return data
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const { data } = await client.get<CommunityStats>(ENDPOINTS.community.stats)
  return data
}

export async function toggleLike(songId: string): Promise<{ liked: boolean; like_count: number }> {
  const { data } = await client.post(ENDPOINTS.community.like(songId))
  return data
}

export async function recordPlay(songId: string, durationSeconds = 0): Promise<void> {
  await client.post(ENDPOINTS.community.play(songId), { duration_seconds: durationSeconds })
}
