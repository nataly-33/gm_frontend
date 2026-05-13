import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function AdminRoute() {
  const user = useAuthStore(s => s.user)
  if (!user || !user.roles?.includes('admin')) return <Navigate to="/" replace />
  return <Outlet />
}