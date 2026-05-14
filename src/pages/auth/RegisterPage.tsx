import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuthStore } from '../../store/auth.store'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post(ENDPOINTS.auth.register, form)
      setTokens(data.access, data.refresh)
      setUser(data.user)
      navigate('/')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: unknown } })?.response?.data
      setError(
        typeof detail === 'string'
          ? detail
          : JSON.stringify(detail) ?? 'Error al registrarse'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-lg p-12 w-full max-w-[420px] text-center">
      <h1 className="text-primary text-3xl font-bold tracking-tight mb-8">MusicGen</h1>
      <h2 className="text-white text-2xl font-bold mb-6">Crear cuenta</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="bg-card-hover border border-transparent rounded text-white placeholder:text-muted text-sm px-4 py-3.5 w-full outline-none focus:border-primary transition-colors"
          type="text"
          name="full_name"
          placeholder="Nombre completo"
          value={form.full_name}
          onChange={handleChange}
          required
          autoComplete="name"
        />
        <input
          className="bg-card-hover border border-transparent rounded text-white placeholder:text-muted text-sm px-4 py-3.5 w-full outline-none focus:border-primary transition-colors"
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <input
          className="bg-card-hover border border-transparent rounded text-white placeholder:text-muted text-sm px-4 py-3.5 w-full outline-none focus:border-primary transition-colors"
          type="password"
          name="password"
          placeholder="Contraseña (mín. 8 caracteres)"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          autoComplete="new-password"
        />

        {error && (
          <p className="text-red-400 text-xs text-left">{error}</p>
        )}

        <button
          className="bg-primary hover:bg-primary-light text-black font-bold text-sm uppercase tracking-wider rounded-pill py-3.5 mt-2 w-full transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:[transform:none]"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <p className="text-muted text-sm mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-white font-bold underline hover:text-primary transition-colors">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
