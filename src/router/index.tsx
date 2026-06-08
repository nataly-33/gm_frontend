import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import AdminLayout from '../layouts/AdminLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import DashboardPage from '../pages/admin/DashboardPage'
import PlanesPage from '../pages/admin/PlanesPage'
import RolesPage from '../pages/admin/RolesPage'
import AdminProfilePage from '../pages/admin/AdminProfilePage'
import UsersAdminPage from '../pages/admin/UsersAdminPage'
import ReportsAdminPage from '../pages/admin/ReportsAdminPage'
import ClienteProfilePage from '../pages/cliente/ClienteProfilePage'
import PaymentsPage from '../pages/cliente/Paymentspage'
import CommunityPage from '../pages/cliente/CommunityPage'
import LibraryPage from '../pages/library/LibraryPage'
import CreatePage from '../pages/create/CreatePage'
import StemsPage from '../pages/stems/StemsPage'
import ForYouPage from '../pages/recommendations/ForYouPage'
import PlaylistsPage from '../pages/playlists/PlaylistsPage'
import PlaylistDetailPage from '../pages/playlists/PlaylistDetailPage'

const placeholder = (label: string) => (
  <div style={{ padding: '32px', color: 'var(--text-base)' }}>
    <h2>{label}</h2>
    <p style={{ marginTop: '8px' }}>Próximamente.</p>
  </div>
)

export const router = createBrowserRouter([
  // ── Auth ────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // ── App ─────────────────────────────────────────────────
  {
    element: <PrivateRoute />,
    children: [

      // Rutas cliente
      {
        element: <AppLayout />,
        children: [
          { path: '/',               element: placeholder('Inicio') },
          { path: '/library',        element: <LibraryPage /> },
          { path: '/create',         element: <CreatePage /> },
          { path: '/stems',          element: <StemsPage /> },
          { path: '/community',      element: <CommunityPage /> },
          { path: '/recommendations',element: <ForYouPage /> },
          { path: '/playlists',      element: <PlaylistsPage /> },
          { path: '/playlists/:id',  element: <PlaylistDetailPage /> },
          { path: '/profile',        element: <ClienteProfilePage /> },
          { path: '/payments',       element: <PaymentsPage /> },
        ],
      },

      // Rutas admin
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin',           element: <DashboardPage /> },
              { path: '/admin/roles',     element: <RolesPage /> },
              { path: '/admin/planes',    element: <PlanesPage /> },
              { path: '/admin/usuarios',  element: <UsersAdminPage /> },
              { path: '/admin/reportes',  element: <ReportsAdminPage /> },
              { path: '/admin/profile',   element: <AdminProfilePage /> },
            ],
          },
        ],
      },

    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
