import { useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../api/authService'

export default function AdminProfilePage() {
  const { user, setUser } = useAuthStore()

  const [editando, setEditando] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  const [form, setForm] = useState({
    full_name:  user?.full_name  ?? '',
    avatar_url: user?.avatar_url ?? '',
  })

  const fileRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, avatar_url: reader.result as string }))
    reader.readAsDataURL(file)
  }

  function handleCancelar() {
    setForm({ full_name: user?.full_name ?? '', avatar_url: user?.avatar_url ?? '' })
    setEditando(false)
    setError(null)
  }

  async function handleGuardar() {
    if (!user) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: { full_name?: string; avatar_url?: string } = {}
      if (form.full_name  !== user.full_name)  payload.full_name  = form.full_name
      if (form.avatar_url !== (user.avatar_url ?? '')) payload.avatar_url = form.avatar_url

      await authService.updateProfile(payload)
      const actualizado = await authService.getProfile()
      setUser(actualizado)
      setEditando(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="p-6 text-white max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black">Mi perfil</h2>
          {joinDate && <p className="text-muted text-xs mt-0.5">Miembro desde {joinDate}</p>}
        </div>
        {success && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/20 text-green-400">
            Guardado correctamente
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        {form.avatar_url ? (
          <img
            src={form.avatar_url}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover"
            style={{ border: '2px solid #A855F7' }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black select-none"
            style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
          >
            {initials}
          </div>
        )}
        {editando && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs px-4 py-2 rounded-lg border border-card-hover text-muted hover:text-white hover:border-primary transition-colors"
            >
              Cambiar foto
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </>
        )}
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">Nombre completo</label>
          {editando ? (
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="bg-card-hover border border-transparent rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-white"
            />
          ) : (
            <p className="text-white text-sm font-medium">{user?.full_name ?? '—'}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">Email</label>
          <p className="text-white text-sm font-medium">{user?.email ?? '—'}</p>
          <p className="text-muted text-xs">El email no se puede cambiar desde el panel.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">Rol</label>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold w-fit">
            {user?.role ?? 'admin'}
          </span>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      {/* Botones */}
      <div className="flex gap-3">
        {editando ? (
          <>
            <button
              onClick={handleGuardar}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-black disabled:opacity-50 transition-all"
              style={{ background: '#A855F7' }}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              onClick={handleCancelar}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-muted hover:text-white border border-card-hover transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-black transition-all"
            style={{ background: '#A855F7' }}
          >
            Editar perfil
          </button>
        )}
      </div>
    </div>
  )
}
