import client from '../client'
import { ENDPOINTS } from '../endpoints'
import type { LibrarySong } from './songs.api'

export interface SuggestedTag {
  id: number
  name: string
}

export async function getForYou(): Promise<LibrarySong[]> {
  const { data } = await client.get<LibrarySong[]>(ENDPOINTS.recommendations.forYou)
  return data
}

export async function getSuggestedTags(): Promise<SuggestedTag[]> {
  const { data } = await client.get<SuggestedTag[]>(ENDPOINTS.recommendations.suggestedTags)
  return data
}
