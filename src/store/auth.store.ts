import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Datos del usuario autenticado persistidos en localStorage. */
export interface AuthUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  credit_balance: number
  role: string
  created_at: string
}

/** Estado global de autenticación gestionado por Zustand. */
interface AuthState {
  /** Usuario autenticado actualmente, o null si no hay sesión. */
  user: AuthUser | null
  /** JWT de acceso de corta duración. */
  accessToken: string | null
  /** JWT de refresco de larga duración. */
  refreshToken: string | null
  /**
   * Almacena los tokens tras un login exitoso.
   * @param access - Token de acceso JWT.
   * @param refresh - Token de refresco JWT.
   */
  setTokens: (access: string, refresh: string) => void
  /**
   * Actualiza los datos del usuario en el store.
   * @param user - Objeto de usuario actualizado.
   */
  setUser: (user: AuthUser) => void
  /** Cierra la sesión y limpia todos los datos del store. */
  logout: () => void
}

/**
 * Store global de autenticación con persistencia en localStorage.
 * Persiste bajo la clave 'auth-storage'.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage' }
  )
)
