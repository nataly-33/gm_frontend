export default function RolesPage() {
  const ROLES = [
    {
      id: 1,
      name: 'admin',
      description:
        'Acceso total al panel de administración. Asignado manualmente desde el backend.',
      is_system: true,
    },
    {
      id: 2,
      name: 'user',
      description: 'Usuario estándar. Se asigna automáticamente al registrarse.',
      is_system: true,
    },
  ]

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-2">Roles del sistema</h2>
      <p className="text-muted text-sm mb-6">
        Los roles son gestionados desde el backend y asignados por el seeder o manualmente. No es
        necesario crearlos desde el panel.
      </p>

      <div className="rounded-xl overflow-hidden border border-card-hover">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card-hover text-muted text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role, i) => (
              <tr key={role.id} className={i % 2 === 0 ? 'bg-surface' : 'bg-night'}>
                <td className="px-4 py-3 font-mono text-sm font-bold text-primary">{role.name}</td>
                <td className="px-4 py-3 text-muted text-sm">{role.description}</td>
                <td className="px-4 py-3">
                  {role.is_system && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                      Sistema
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted text-xs mt-4">
        Para cambiar el rol de un usuario utilizá el panel de Usuarios o el seeder del backend.
      </p>
    </div>
  )
}
