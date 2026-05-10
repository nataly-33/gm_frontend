
## FRONTEND — `gm-frontend`

```
gm-frontend/
│
├── .github/
│   └── workflows/
│       └── ci.yml               # Lint + build check en cada PR
│
├── public/
│   ├── favicon.ico
│   └── assets/                  # Imágenes estáticas que no pasan por Vite
│
├── src/
│   │
│   ├── api/                     # TODAS las llamadas HTTP centralizadas aquí
│   │   ├── client.ts            # Axios instance con baseURL, interceptors de auth y errores
│   │   ├── endpoints.ts         # CONSTANTES de endpoints: export const SONGS_GENERATE = '/api/songs/generate'
│   │   └── modules/             # Una función por módulo, llama solo a endpoints.ts
│   │       ├── auth.api.ts      # login(), register(), logout(), refreshToken()
│   │       ├── songs.api.ts     # generateSong(), getSongs(), getSong(), deleteSong()
│   │       ├── stems.api.ts     # uploadAudio(), getStemJob(), downloadStem()
│   │       ├── credits.api.ts   # getBalance(), getPlans(), subscribe(), getTransactions()
│   │       ├── community.api.ts # getTrending(), likeSong(), recordPlay()
│   │       ├── playlists.api.ts # getPlaylists(), createPlaylist(), addSong()
│   │       ├── recommendations.api.ts  # getForYou(), getSuggestedTags()
│   │       ├── mix.api.ts       # getMixProjects(), createMix(), exportMix()
│   │       └── admin.api.ts     # getUsers(), getReports(), getAuditLogs()
│   │
│   ├── store/                   # Estado global con Zustand
│   │   ├── auth.store.ts        # user, token, isAuthenticated, login(), logout()
│   │   ├── player.store.ts      # currentSong, isPlaying, queue, play(), pause(), next()
│   │   ├── notifications.store.ts
│   │   └── ui.store.ts          # sidebar abierto, tema, modales activos
│   │
│   ├── hooks/                   # Custom hooks reutilizables
│   │   ├── useAuth.ts           # Wrapper del auth.store
│   │   ├── usePlayer.ts         # Wrapper del player.store
│   │   ├── useSongs.ts          # Fetching + estado local de canciones (React Query)
│   │   ├── useGenerationJob.ts  # Polling del status de un job de generación
│   │   └── useStemJob.ts        # Polling del progreso de separación
│   │
│   ├── layouts/                 # Layouts reutilizables (el "contenedor" de páginas)
│   │   ├── AppLayout.tsx        # Layout principal: sidebar + player fijo + contenido
│   │   ├── AuthLayout.tsx       # Layout para login/registro: centrado, sin sidebar
│   │   └── AdminLayout.tsx      # Layout del panel admin: sidebar diferente
│   │
│   ├── pages/                   # Una carpeta por módulo, espeja la estructura del back
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── home/
│   │   │   └── HomePage.tsx     # Feed de tendencias
│   │   ├── library/
│   │   │   └── LibraryPage.tsx  # Canciones propias del usuario
│   │   ├── create/
│   │   │   └── CreatePage.tsx   # Formulario de generación de canción
│   │   ├── stems/
│   │   │   └── StemsPage.tsx    # Subir audio y separar pistas
│   │   ├── playlists/
│   │   │   ├── PlaylistsPage.tsx
│   │   │   └── PlaylistDetailPage.tsx
│   │   ├── recommendations/
│   │   │   └── ForYouPage.tsx
│   │   ├── mix/
│   │   │   ├── MixPage.tsx
│   │   │   └── MixEditorPage.tsx
│   │   ├── profile/
│   │   │   └── ProfilePage.tsx
│   │   └── admin/               # Todo el panel de administración
│   │       ├── AdminDashboardPage.tsx
│   │       ├── UsersAdminPage.tsx
│   │       ├── TenantsAdminPage.tsx    # Solo superadmin
│   │       ├── ReportsAdminPage.tsx
│   │       └── AuditLogAdminPage.tsx
│   │
│   ├── components/              # Componentes reutilizables
│   │   ├── ui/                  # Componentes primitivos (sin lógica de negocio)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Avatar.tsx
│   │   ├── player/              # Reproductor de música (fijo en la parte inferior)
│   │   │   ├── PlayerBar.tsx    # Barra inferior estilo Spotify
│   │   │   ├── PlayerControls.tsx
│   │   │   └── VolumeSlider.tsx
│   │   ├── song/                # Componentes relacionados a canciones
│   │   │   ├── SongCard.tsx     # Tarjeta de canción (cover, título, tags, botones)
│   │   │   ├── SongRow.tsx      # Fila de canción en lista (estilo Spotify)
│   │   │   ├── SongGrid.tsx     # Grid de SongCards
│   │   │   └── TagSelector.tsx  # Selector de tags con chips clicables
│   │   ├── playlist/
│   │   │   ├── PlaylistCard.tsx
│   │   │   └── PlaylistRow.tsx
│   │   ├── stems/
│   │   │   ├── AudioUploader.tsx
│   │   │   └── StemProgress.tsx
│   │   ├── admin/               # Componentes exclusivos del panel admin
│   │   │   ├── StatsCard.tsx
│   │   │   ├── UserTable.tsx
│   │   │   └── AuditTable.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx      # Sidebar usuario (estilo Spotify)
│   │       ├── AdminSidebar.tsx # Sidebar admin
│   │       └── Topbar.tsx       # Barra superior con búsqueda y avatar
│   │
│   ├── router/
│   │   ├── index.tsx            # Definición de rutas con React Router v6
│   │   ├── PrivateRoute.tsx     # Redirige a login si no está autenticado
│   │   ├── AdminRoute.tsx       # Redirige si no tiene rol admin
│   │   └── SuperAdminRoute.tsx  # Redirige si no es superadmin
│   │
│   ├── types/                   # Tipos TypeScript globales
│   │   ├── auth.types.ts        # User, Role, Permission, Token
│   │   ├── song.types.ts        # Song, GenerationJob, Tag
│   │   ├── stem.types.ts        # StemJob, StemFile
│   │   ├── playlist.types.ts
│   │   ├── credit.types.ts
│   │   └── api.types.ts         # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   │
│   ├── constants/               # Valores fijos
│   │   ├── roles.ts             # ROLES = { SUPERADMIN: 'superadmin', ADMIN: 'admin', USER: 'user' }
│   │   ├── tags.ts              # TAG_CATEGORIES, MOOD_EMOJIS
│   │   └── routes.ts            # ROUTES = { HOME: '/', CREATE: '/create', ADMIN: '/admin' }
│   │
│   ├── utils/                   # Funciones helper puras (sin efectos secundarios)
│   │   ├── formatters.ts        # formatDuration(seconds), formatDate(), formatCredits()
│   │   ├── validators.ts        # isValidEmail(), isValidAudioFile()
│   │   └── audio.ts             # Utilidades de audio: getFileDuration(), validateFileSize()
│   │
│   ├── styles/
│   │   ├── globals.css          # Variables CSS globales, reset
│   │   └── spotify-theme.css    # Variables del tema visual (colores Spotify-like)
│   │
│   ├── App.tsx                  # Componente raíz: providers + router
│   └── main.tsx                 # Punto de entrada: ReactDOM.render
│
├── .env.example
├── .gitignore
├── index.html
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── CONTRIBUTING.md
└── README.md
```

## Reglas de estructura que TODO el equipo debe seguir


### Frontend
- **Todas las URLs de API en `src/api/endpoints.ts`** como constantes. Ningún componente o página escribe strings de URL directamente.
- **Ninguna página llama a `fetch` o `axios` directamente**. Todo pasa por las funciones de `src/api/modules/`.
- **Estado global solo en `src/store/`** con Zustand. No usar `useState` para estado compartido entre páginas.
- **Tipos en `src/types/`**. Nunca usar `any`. Todo tipado con TypeScript estricto.
- **Componentes de UI en `src/components/ui/`** son puros: no tienen llamadas a la API ni acceso al store.