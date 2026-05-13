import { useState, useEffect } from 'react'
import { adminService, type Rol } from '../../api/admin.service'

const EMPTY: Omit<Rol, 'id'> = { nombre: '', descripcion: '', esSystem: false }

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchRoles() {
    const data = await adminService.getRoles()
    setRoles(data)
  }

  useEffect(() => { fetchRoles() }, [])

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (editId) {
        await adminService.updateRol(editId, form)
      } else {
        await adminService.createRol(form)
      }
      setForm(EMPTY)
      setEditId(null)
      await fetchRoles()
    } catch {
      setError('Error al guardar el rol')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este rol?')) return
    await adminService.deleteRol(id)
    await fetchRoles()
  }

  function handleEdit(rol: Rol) {
    setEditId(rol.id)
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion, esSystem: rol.esSystem })
  }

  function handleCancel() {
    setEditId(null)
    setForm(EMPTY)
    setError('')
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-6">Gestión de Roles</h2>

      {/* Formulario */}
      <div className="bg-card-hover rounded-xl p-5 mb-8 flex flex-col gap-3 max-w-lg">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
          {editId ? 'Editar rol' : 'Nuevo rol'}
        </h3>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold">Nombre</label>
          <input
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary"
            placeholder="ej: admin, cliente"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold">Descripción</label>
          <input
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="bg-surface rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:border-primary"
            placeholder="Descripción del rol"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.esSystem}
            onChange={e => setForm(f => ({ ...f, esSystem: e.target.checked }))}
            className="accent-primary"
          />
          Es rol de sistema
        </label>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSubmit}
            disabled={loading || !form.nombre}
            className="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
            style={{ background: '#A855F7' }}
          >
            {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
          </button>
          {editId && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-sm font-bold text-muted hover:text-white border border-card-hover"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden border border-card-hover">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card-hover text-muted text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Sistema</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((rol, i) => (
              <tr key={rol.id} className={i % 2 === 0 ? 'bg-surface' : 'bg-night'}>
                <td className="px-4 py-3 font-medium">{rol.nombre}</td>
                <td className="px-4 py-3 text-muted">{rol.descripcion || '—'}</td>
                <td className="px-4 py-3">
                  {rol.esSystem
                    ? <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Sí</span>
                    : <span className="text-xs text-muted">No</span>}
                </td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(rol)}
                    className="text-xs px-3 py-1 rounded-md bg-card-hover hover:text-white text-muted"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(rol.id)}
                    className="text-xs px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">
                  No hay roles registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}