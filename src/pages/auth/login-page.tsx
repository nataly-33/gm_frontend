import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuthStore } from '../../store/auth.store'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post(ENDPOINTS.auth.login, { email, password })
      setTokens(data.access, data.refresh)
      const { data: me } = await client.get(ENDPOINTS.auth.me)
      setUser(me)
      navigate(me.role === 'admin' ? '/admin' : '/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-lg p-12 w-full max-w-[420px] text-center">
      <h1 className="text-primary text-3xl font-bold tracking-tight mb-8">MusicGen</h1>
      <h2 className="text-white text-2xl font-bold mb-6">Iniciar sesión</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="bg-card-hover border border-transparent rounded text-white placeholder:text-muted text-sm px-4 py-3.5 w-full outline-none focus:border-primary transition-colors"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className="bg-card-hover border border-transparent rounded text-white placeholder:text-muted text-sm px-4 py-3.5 w-full outline-none focus:border-primary transition-colors"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className="text-red-400 text-xs text-left">{error}</p>}

        <button
          className="bg-primary hover:bg-primary-light text-black font-bold text-sm uppercase tracking-wider rounded-pill py-3.5 mt-2 w-full transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:[transform:none]"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-muted text-sm mt-6">
        ¿No tenés cuenta?{' '}
        <Link
          to="/register"
          className="text-white font-bold underline hover:text-primary transition-colors"
        >
          Registrarse
        </Link>
      </p>
    </div>
  )
}
