import client from './client'
import { ENDPOINTS } from './endpoints'
import type { AuthUser } from '../store/auth.store'

export interface UpdateProfileRequest {
  full_name?: string
  avatar_url?: string
}

export const authService = {
  getProfile: () =>
    client.get<AuthUser>(ENDPOINTS.auth.me).then(r => r.data),

  updateProfile: (data: UpdateProfileRequest) =>
    client.patch<AuthUser>(ENDPOINTS.auth.me, data).then(r => r.data),
}
