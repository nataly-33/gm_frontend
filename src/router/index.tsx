import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'

const placeholder = (label: string) => (
  <div style={{ padding: '32px', color: 'var(--text-base)' }}>
    <h2>{label}</h2>
    <p style={{ marginTop: '8px' }}>Próximamente.</p>
  </div>
)

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/',          element: placeholder('Inicio') },
          { path: '/library',   element: placeholder('Tu biblioteca') },
          { path: '/create',    element: placeholder('Crear canción') },
          { path: '/community', element: placeholder('Comunidad') },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: '/admin', element: placeholder('Panel de administración') },
        ],
      },
    ],
  },
])
