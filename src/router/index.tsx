import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import AuthLayout from '../layouts/auth-layout'
import AppLayout from '../layouts/app-layout'
import AdminLayout from '../layouts/admin-layout'
import PrivateRoute from './private-route'
import AdminRoute from './admin-route'

// ── Lazy-loaded pages ─────────────────────────────────────────────────────
// Cada import() genera un chunk separado que solo se carga cuando se navega
// a esa ruta, reduciendo el bundle inicial.

const LoginPage = lazy(() => import('../pages/auth/login-page'))
const RegisterPage = lazy(() => import('../pages/auth/register-page'))

const DashboardPage = lazy(() => import('../pages/admin/dashboard-page'))
const PlanesPage = lazy(() => import('../pages/admin/planes-page'))
const RolesPage = lazy(() => import('../pages/admin/roles-page'))
const AdminProfilePage = lazy(() => import('../pages/admin/admin-profile-page'))
const UsersAdminPage = lazy(() => import('../pages/admin/users-admin-page'))
const ReportsAdminPage = lazy(() => import('../pages/admin/reports-admin-page'))

const ClienteProfilePage = lazy(() => import('../pages/cliente/cliente-profile-page'))
const PaymentsPage = lazy(() => import('../pages/cliente/payments-page'))
const CommunityPage = lazy(() => import('../pages/cliente/community-page'))

const LibraryPage = lazy(() => import('../pages/library/library-page'))
const CreatePage = lazy(() => import('../pages/create/create-page'))
const StemsPage = lazy(() => import('../pages/stems/stems-page'))
const ForYouPage = lazy(() => import('../pages/recommendations/for-you-page'))
const PlaylistsPage = lazy(() => import('../pages/playlists/playlists-page'))
const PlaylistDetailPage = lazy(() => import('../pages/playlists/playlist-detail-page'))
const MixPage = lazy(() => import('../pages/mix/mix-page'))
const MixEditorPage = lazy(() => import('../pages/mix/mix-editor-page'))

// ── Fallback de carga ─────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-subdued)',
        fontSize: 14,
      }}
    >
      Cargando...
    </div>
  )
}

function withSuspense(element: React.ReactElement) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

// ── Placeholder para rutas en construcción ────────────────────────────────

const placeholder = (label: string) => (
  <div style={{ padding: '32px', color: 'var(--text-base)' }}>
    <h2>{label}</h2>
    <p style={{ marginTop: '8px' }}>Próximamente.</p>
  </div>
)

// ── Router ────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Auth ────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: withSuspense(<LoginPage />) },
      { path: '/register', element: withSuspense(<RegisterPage />) },
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
          { path: '/', element: placeholder('Inicio') },
          { path: '/library', element: withSuspense(<LibraryPage />) },
          { path: '/create', element: withSuspense(<CreatePage />) },
          { path: '/stems', element: withSuspense(<StemsPage />) },
          { path: '/community', element: withSuspense(<CommunityPage />) },
          { path: '/recommendations', element: withSuspense(<ForYouPage />) },
          { path: '/playlists', element: withSuspense(<PlaylistsPage />) },
          { path: '/playlists/:id', element: withSuspense(<PlaylistDetailPage />) },
          { path: '/profile', element: withSuspense(<ClienteProfilePage />) },
          { path: '/payments', element: withSuspense(<PaymentsPage />) },
          { path: '/mix', element: withSuspense(<MixPage />) },
          { path: '/mix/:id', element: withSuspense(<MixEditorPage />) },
        ],
      },

      // Rutas admin
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: withSuspense(<DashboardPage />) },
              { path: '/admin/roles', element: withSuspense(<RolesPage />) },
              { path: '/admin/planes', element: withSuspense(<PlanesPage />) },
              { path: '/admin/usuarios', element: withSuspense(<UsersAdminPage />) },
              { path: '/admin/reportes', element: withSuspense(<ReportsAdminPage />) },
              { path: '/admin/profile', element: withSuspense(<AdminProfilePage />) },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
