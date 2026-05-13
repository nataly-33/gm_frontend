import { useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../api/authService'
import type { ModificarPerfilRequest } from '../../api/authService'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()

  const [editando, setEditando] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  const [form, setForm] = useState({
    nombreCompleto: user?.nombreCompleto ?? '',
    email:          user?.email          ?? '',
    biografia:      user?.biografia      ?? '',
    password:       '',
    fotoBase64:     user?.fotoBase64     ?? '',
  })

  const fileRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, fotoBase64: reader.result as string }))
    reader.readAsDataURL(file)
  }

  function handleCancelar() {
    setForm({
      nombreCompleto: user?.nombreCompleto ?? '',
      email:          user?.email          ?? '',
      biografia:      user?.biografia      ?? '',
      password:       '',
      fotoBase64:     user?.fotoBase64     ?? '',
    })
    setEditando(false)
    setError(null)
  }

  async function handleGuardar() {
    if (!user) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: ModificarPerfilRequest = { id: user.id }
      if (form.nombreCompleto !== user.nombreCompleto)       payload.nombreCompleto = form.nombreCompleto
      if (form.email          !== user.email)                payload.email          = form.email
      if (form.biografia      !== (user.biografia ?? ''))    payload.biografia      = form.biografia
      if (form.fotoBase64     !== (user.fotoBase64 ?? ''))   payload.fotoBase64     = form.fotoBase64
      if (form.password)                                     payload.password       = form.password

      await authService.modificarPerfil(payload)
      const actualizado = await authService.obtenerPerfil(user.id)
      setUser(actualizado)
      setEditando(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.nombreCompleto
    ? user.nombreCompleto.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="text-white flex flex-col h-full overflow-y-auto">

      {/* ── Hero banner ─────────────────────────────── */}
      <div
        className="relative flex items-end gap-6 px-8 pt-12 pb-6 shrink-0"
        style={{
          background: 'linear-gradient(180deg, #4C1D95 0%, #2D1060 60%, transparent 100%)',
          minHeight: '220px',
        }}
      >
        {/* Avatar */}
        <div className="relative shrink-0 group">
          {form.fotoBase64 ? (
            <img
              src={form.fotoBase64}
              alt="Avatar"
              className="w-36 h-36 rounded-full object-cover shadow-2xl"
              style={{ border: '3px solid rgba(168,85,247,0.5)' }}
            />
          ) : (
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl select-none"
              style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
            >
              {initials}
            </div>
          )}

          {/* Overlay cambiar foto */}
          {editando && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              title="Cambiar foto"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 15.2A3.2 3.2 0 1 1 15.2 12 3.2 3.2 0 0 1 12 15.2zm6.4-9.6h-1.7l-1.5-1.6H8.8L7.3 5.6H5.6A2.4 2.4 0 0 0 3.2 8v9.6a2.4 2.4 0 0 0 2.4 2.4h12.8a2.4 2.4 0 0 0 2.4-2.4V8a2.4 2.4 0 0 0-2.4-2.4z"/>
              </svg>
              <span className="text-white text-[11px] font-semibold">Cambiar foto</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Info hero */}
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest">Perfil</span>
          {editando ? (
            <input
              name="nombreCompleto"
              value={form.nombreCompleto}
              onChange={handleChange}
              className="bg-transparent border-b-2 text-white text-4xl font-black outline-none pb-1 w-80"
              style={{
                borderColor: '#A855F7',
                caretColor: '#A855F7',
              }}
              placeholder="Tu nombre"
            />
          ) : (
            <h1 className="text-5xl font-black leading-none tracking-tight">{user?.nombreCompleto}</h1>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {user?.roles?.map(r => (
              <span
                key={r}
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: '#A855F730', color: '#C084FC' }}
              >
                {r}
              </span>
            ))}
            {joinDate && (
              <span className="text-purple-300 text-xs">Miembro desde {joinDate}</span>
            )}
          </div>
        </div>

        {/* Botón editar */}
        <div className="absolute top-4 right-6 flex gap-2">
          {!editando ? (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Editar perfil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelar}
                disabled={loading}
                className="text-xs font-semibold px-4 py-2 rounded-full transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-50"
                style={{ background: '#A855F7', color: 'white' }}
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenido ───────────────────────────────── */}
      <div className="px-8 py-6 flex flex-col gap-6" style={{ background: 'var(--color-surface)' }}>

        {/* Feedback */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            ✓ Perfil actualizado correctamente
          </div>
        )}

        {/* Campos en grid */}
        <div className="grid grid-cols-2 gap-5 max-w-2xl">

          <Field label="Correo electrónico">
            {editando ? (
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                style={{ caretColor: '#A855F7' }}
                className="input-profile"
                placeholder="correo@ejemplo.com"
              />
            ) : (
              <Value>{user?.email}</Value>
            )}
          </Field>

          {editando && (
            <Field label="Nueva contraseña">
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                style={{ caretColor: '#A855F7' }}
                className="input-profile"
                placeholder="Dejar vacío para no cambiar"
              />
            </Field>
          )}

          <Field label="Miembro desde">
            <Value>{joinDate ?? '—'}</Value>
          </Field>

        </div>

        {/* Biografía */}
        <div className="max-w-2xl">
          <Field label="Biografía">
            {editando ? (
              <textarea
                name="biografia"
                value={form.biografia}
                onChange={handleChange}
                rows={3}
                placeholder="Cuéntanos algo sobre ti..."
                style={{ caretColor: '#A855F7' }}
                className="input-profile resize-none"
              />
            ) : (
              <Value>
                {user?.biografia || <span className="text-muted italic text-sm">Sin biografía</span>}
              </Value>
            )}
          </Field>
        </div>

      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Value({ children }: { children: React.ReactNode }) {
  return <p className="text-white text-sm">{children ?? '—'}</p>
}