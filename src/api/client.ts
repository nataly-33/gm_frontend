import axios from 'axios'

import { useAuthStore } from '../store/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

/**
 * Instancia centralizada de Axios configurada con la URL base de la API.
 * Todos los módulos de API deben usar este cliente en lugar de axios directamente.
 */
const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token JWT Bearer en cada petición saliente si existe sesión activa.
client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Refresca el token automáticamente ante un 401 y reintenta la petición original.
// Si el refresco falla, cierra la sesión y redirige al login.
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { refreshToken, setTokens, logout } = useAuthStore.getState()
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken })
          setTokens(data.access, refreshToken)
          original.headers.Authorization = `Bearer ${data.access}`
          return client(original)
        } catch {
          logout()
          window.location.href = '/login'
        }
      } else {
        logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
