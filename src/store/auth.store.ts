import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  nombreCompleto: string
  fotoBase64: string | null
  credito: number
  rolIds: string[]
  roles: string[]        // ✅ agregado
  biografia: string | null
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  setToken: (access: string) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: 'auth-storage' }
  )
)