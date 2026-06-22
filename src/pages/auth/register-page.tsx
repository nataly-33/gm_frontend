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
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await client.post(ENDPOINTS.auth.register, {
  full_name: form.full_name,
  email: form.email,
  password: form.password,
})
      const { data } = await client.post(ENDPOINTS.auth.login, {
        email: form.email,
        password: form.password,
      })
      setTokens(data.access, data.refresh)
      const { data: me } = await client.get(ENDPOINTS.auth.me)
      setUser(me)
      navigate(me.role === 'admin' ? '/admin' : '/library')
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
    <>
      <style>{`
        .register-input:-webkit-autofill,
        .register-input:-webkit-autofill:hover,
        .register-input:-webkit-autofill:focus,
        .register-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 9999px #121212 inset !important;
          box-shadow: 0 0 0 9999px #121212 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff;
        }
        .register-input {
          background-color: #121212 !important;
          color: #ffffff !important;
        }
        .register-input:focus {
          border-color: #ffffff !important;
        }
      `}</style>
      <div
        className="min-h-screen bg-black flex flex-col items-center px-4 pt-16 pb-10"
        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
      >
        <div className="w-full max-w-[260px] flex flex-col items-center text-center">
          <img src="/logo.png" alt="MusicGen" className="w-[40px] h-[40px] object-contain mb-2" />
          <h1
            className="text-white font-black text-center mb-7 leading-tight"
            style={{ fontSize: '2.25rem', letterSpacing: '-0.03em' }}
          >
            Regístrate<br />para empezar<br />a escuchar<br />contenido
          </h1>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1">
              <label htmlFor="full_name" className="text-white text-xs font-bold">Nombre completo</label>
              <input
                id="full_name" type="text" name="full_name"
                value={form.full_name} onChange={handleChange}
                required autoComplete="name"
                className="register-input w-full rounded-[4px] px-3 py-2.5 text-xs outline-none"
                style={{ border: '1px solid #727272', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#fff')}
                onBlur={e => (e.currentTarget.style.borderColor = '#727272')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-white text-xs font-bold">Correo electrónico</label>
              <input
                id="email" type="email" name="email"
                value={form.email} onChange={handleChange}
                required autoComplete="email"
                className="register-input w-full rounded-[4px] px-3 py-2.5 text-xs outline-none"
                style={{ border: '1px solid #727272', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#fff')}
                onBlur={e => (e.currentTarget.style.borderColor = '#727272')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-white text-xs font-bold">Contraseña</label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  required minLength={8} autoComplete="new-password"
                  className="register-input w-full rounded-[4px] px-3 py-2.5 text-xs outline-none pr-10"
                  style={{ border: '1px solid #727272', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#fff')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#727272')}
                />
                <button
                  type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                      <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="mt-1 w-full font-bold text-sm text-black rounded-lg py-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#A855F7', letterSpacing: '0.01em', fontFamily: 'inherit' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#C084FC') }}
              onMouseLeave={e => { e.currentTarget.style.background = '#A855F7' }}
            >
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-muted text-sm mt-2 hover:text-white transition-colors cursor-pointer bg-transparent border-none w-full"
            >
              ← Volver al inicio
            </button>
          </form>
          <div className="w-full flex items-center gap-2 mt-4 mb-6">
            <div className="flex-1 h-px" style={{ background: '#000000' }} />
            <span className="text-sm" style={{ color: '#a7a7a7' }}>o</span>
            <div className="flex-1 h-px" style={{ background: '#000000' }} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs" style={{ color: '#a7a7a7' }}>¿Ya tenés cuenta?</p>
            <Link to="/login" className="font-bold text-xs text-white transition-transform duration-150 inline-block hover:scale-105">
              Iniciar sesión
            </Link>
          </div>
        </div>
        <p className="text-center leading-relaxed mt-auto pt-10" style={{ color: '#a7a7a7', fontSize: '0.6rem', maxWidth: '260px' }}>
          Este sitio está protegido por reCAPTCHA. Se aplican los{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#a7a7a7' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A855F7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a7a7a7')}>
            Términos del servicio
          </a>{' '}y la{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#a7a7a7' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A855F7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a7a7a7')}>
            Política de privacidad
          </a>{' '}de Google.
        </p>
      </div>
    </>
  )
}