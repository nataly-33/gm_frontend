import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

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
