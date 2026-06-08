import client from '../client'
import { ENDPOINTS } from '../endpoints'

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  reference_id: string
  is_read: boolean
  created_at: string
}

export interface NotificationsResponse {
  results: Notification[]
  unread_count: number
}

export async function getNotifications(): Promise<NotificationsResponse> {
  const { data } = await client.get<NotificationsResponse>(ENDPOINTS.notifications.list)
  return data
}

export async function markNotificationRead(id: number): Promise<void> {
  await client.patch(ENDPOINTS.notifications.markRead(id))
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.post(ENDPOINTS.notifications.markAllRead)
}
