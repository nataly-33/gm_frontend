# Estructura real del frontend — Guía de modificación rápida

> Documento actualizado con la estructura REAL del proyecto.
> Propósito: cuando el ingeniero pida modificar un título, subtítulo o texto, saber exactamente en qué archivo y línea buscarlo.

---

## Rutas de la aplicación → archivo que las renderiza

| URL en el navegador | Componente/Página | Archivo |
|---|---|---|
| `/` | Página de bienvenida pública | `src/pages/home/Home.tsx` |
| `/login` | Login | `src/pages/auth/login-page.tsx` |
| `/register` | Registro | `src/pages/auth/register-page.tsx` |
| `/inicio` | Dashboard del usuario (inicio) | `src/pages/cliente/Inicio.tsx` |
| `/library` | Biblioteca personal | `src/pages/library/library-page.tsx` |
| `/create` | Crear canción | `src/pages/create/create-page.tsx` |
| `/stems` | Separar pistas | `src/pages/stems/stems-page.tsx` |
| `/community` | Comunidad | `src/pages/cliente/community-page.tsx` |
| `/recommendations` | Para ti (recomendaciones) | `src/pages/recommendations/for-you-page.tsx` |
| `/playlists` | Playlists | `src/pages/playlists/playlists-page.tsx` |
| `/playlists/:id` | Detalle de playlist | `src/pages/playlists/playlist-detail-page.tsx` |
| `/profile` | Perfil del cliente | `src/pages/cliente/cliente-profile-page.tsx` |
| `/payments` | Historial de pagos | `src/pages/cliente/payments-page.tsx` |
| `/mix` | Mix DJ (lista de proyectos) | `src/pages/mix/mix-page.tsx` |
| `/mix/:id` | Editor de Mix | `src/pages/mix/mix-editor-page.tsx` |
| `/karaoke` | Catálogo Karaoke | `src/pages/karaoke/karaoke-page.tsx` |
| `/karaoke/generate/:songId` | Generar karaoke | `src/pages/karaoke/karaoke-generate-page.tsx` |
| `/karaoke/play/:karaokeId` | Reproductor karaoke | `src/pages/karaoke/karaoke-player-page.tsx` |
| `/karaoke/room/:roomCode` | Sala de karaoke | `src/pages/karaoke/karaoke-room-page.tsx` |
| `/admin` | Dashboard admin | `src/pages/admin/dashboard-page.tsx` |
| `/admin/usuarios` | Gestión de usuarios | `src/pages/admin/users-admin-page.tsx` |
| `/admin/reportes` | Reportes | `src/pages/admin/reports-admin-page.tsx` |
| `/admin/roles` | Roles | `src/pages/admin/roles-page.tsx` |
| `/admin/planes` | Planes de pago | `src/pages/admin/planes-page.tsx` |

---

## Menú lateral (sidebar) — dónde modificar los ítems

**Archivo:** `src/layouts/app-layout.tsx`
**Línea ~14:** constante `NAV_ITEMS` — array con todos los ítems del menú izquierdo.

```
Inicio             → to: '/Inicio',         label: 'Inicio'
Crear canción      → to: '/create',         label: 'Crear canción'
Tu biblioteca      → to: '/library',        label: 'Tu biblioteca'
Separar pistas     → to: '/stems',          label: 'Separar pistas'
Playlists          → to: '/playlists',      label: 'Playlists'
Para ti            → to: '/recommendations',label: 'Para ti'
Comunidad          → to: '/community',      label: 'Comunidad'
Karaoke            → to: '/karaoke',        label: 'Karaoke'
Mix DJ             → to: '/mix',            label: 'Mix DJ'
Historial de pagos → to: '/payments',       label: 'Historial de pagos'
Perfil             → to: '/profile',        label: 'Perfil'
```

Cambiar un label del menú = modificar el string `label:` en `NAV_ITEMS`.

**Topbar (header superior):** mismo archivo, línea ~233.
- Muestra: créditos del usuario, botón "✦ Upgrade", campana de notificaciones, avatar con iniciales + nombre + email.
- Texto "créditos": línea ~259 `<span className="text-muted text-xs">créditos</span>`
- Botón upgrade: `✦ Upgrade` (línea ~264)
- Panel notificaciones — título: `Notificaciones` (línea ~344)
- Panel notificaciones — marcar leídas: `Marcar todas leídas` (línea ~357)
- Sin notificaciones: `Sin notificaciones` (línea ~379)
- Botón logout (parte inferior sidebar): `Cerrar sesión` (línea ~228)

---

## PÁGINAS — textos modificables por página

---

### `/` — Página de bienvenida pública
**Archivo:** `src/pages/home/Home.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Tag sobre el título | `INTELIGENCIA ARTIFICIAL + MÚSICA` | 28 |
| Título H1 principal | `Crea música increíble con solo describirla` | 29 |
| Párrafo descripción 1 | `MusicGen transforma tus ideas en canciones reales...` | 30-34 |
| Párrafo descripción 2 | `Pero MusicGen es mucho más que un generador...` | 35-40 |
| Botón CTA | `¡Empieza gratis ahora!` | 43 |
| Logo/marca navbar | `MusicGen` | 66 |
| Botón navbar izquierdo | `Iniciar sesión` | 68 |
| Botón navbar derecho | `Cuenta gratuita` | 69 |
| Tag sección features | `TODO LO QUE NECESITAS` | 108 |
| Título sección features | `Una plataforma completa para creadores` | 109 |

**Cards de features** (línea 76, array `FEATURES` con 5 objetos `{ icon, title, desc }`):
- `Generación de Música IA` / `Karaoke & Separación` / `Mix DJ` / `Comunidad` / `Colaborativo`
- Para cambiar una card: buscar el `title:` o `desc:` dentro del objeto correspondiente.

---

### `/inicio` — Dashboard del usuario
**Archivo:** `src/pages/cliente/Inicio.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 | `Inicio` | 181 |
| Subtítulo | `Bienvenida de nuevo, sigamos creando.` | 182 |
| Botón crear | `+ Crear Canción` | 199 |
| Sección 1 — título | `Tendencias` | 207 |
| Sección 1 — subtítulo | `Lo que la comunidad está generando ahora` | 208 |
| Sección 2 — título | `Para ti` | 216 |
| Sección 2 — subtítulo | `Según tus géneros y estilos favoritos` | 217 |

> Las canciones en esta página son datos MOCK (no vienen del backend real). Generados por `generateMockSongs()` con títulos, autores y portadas de Unsplash.

---

### `/create` — Crear canción
**Archivo:** `src/pages/create/create-page.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 | `Crear canción` | 368 |
| Subtítulo | `Elige un modo, selecciona estilos y deja que la IA haga el resto.` | 376-378 |
| Label créditos | `Créditos disponibles` | 371 |
| Tab modo 1 — label | `Solo Descripción` | 36 |
| Tab modo 1 — hint | `La IA elige letra e instrumentos` | 36 |
| Tab modo 2 — label | `Letra Exacta` | 37 |
| Tab modo 2 — hint | `Tú escribes la letra completa` | 37 |
| Tab modo 3 — label | `Letra Autogenerada` | 38 |
| Tab modo 3 — hint | `Describes de qué trata, la IA redacta` | 38 |
| Label campo título | `Título de la canción` | 402 |
| Placeholder campo título | `Ej: Midnight Echoes` | 408 |
| Label descripción | `Descripción` | 420 |
| Hint descripción | `¿Qué quieres expresar con esta canción?` | 421 |
| Placeholder descripción | `Ej: Una canción melancólica sobre un viaje nocturno...` | 431 |
| Label estilo musical | `Estilo musical` | 445 |
| Hint estilo | `Género, BPM, instrumentos, mood...` | 446 |
| Label duración | `Duración aproximada` | 507 |
| Label voz | `Voz` | 526 |
| Label idioma | `Idioma de la letra` | 542 |
| Botón generar | `Generar canción` | 575 |
| Botón generando | `Generando...` | 575 |
| Msg submitting | `Enviando tu solicitud...` | 55 |
| Msg polling | `Generando tu canción… esto puede tardar un minuto 🎶` | 57 |
| Msg lista | `¡Lista!` | 58 |
| Msg sin créditos | `Créditos insuficientes` | 59 |
| Hint sin créditos | `No tienes suficientes créditos. Considera hacer upgrade a un plan Pro.` | 615-617 |
| Hint espera | `Puedes esperar aquí. Te avisaremos cuando esté lista.` | 620-622 |
| Texto canción lista | `Guardada en Tu biblioteca.` | 646-650 |
| Botón reiniciar | `Nueva canción` | 625 |

**Opciones de duración** (línea 45, array `DURATION_OPTIONS`):
- `30-40 seg` (40s), `1 min` (60s), `2:30+ min` (150s)

**Opciones de voz** (línea 24, array `VOCAL_OPTIONS`):
- `♀ Femenina`, `♂ Masculina`, `✦ Auto`

**Tags disponibles** (línea 70, constante `TAG_GROUPS`):
- Género: lofi, pop, reggaeton, rock, bachata, kpop, jazz, cumbia, ranchera, techno, electronic, hip-hop, r&b, folk, salsa, classical
- Mood: chill, sad, happy, energetic, romantic, melancholic, nostalgic, dark, angry, playful, hopeful, motivated
- Tempo: slow, medium, fast

---

### `/library` — Biblioteca personal
**Archivo:** `src/pages/library/library-page.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 | `Tu biblioteca` | 125 y 144 |
| Subtítulo (vacía) | `Aún no has generado ninguna canción` | 148 |
| Subtítulo (con canciones) | `X canción(es) generada(s)` | 147 |
| Botón crear | `+ Crear Cancion` | 155 |
| Placeholder búsqueda | `Buscar en tu biblioteca...` | 178 |
| Botón orden | `Recientes` / `Antiguas` / `A–Z` | 193 |
| Título vacío | `Tu biblioteca está vacía` | 222 |
| Texto vacío | `Genera tu primera canción en la pestaña "Crear canción".` | 225 |
| Sin resultados | `Sin resultados` | 222 |
| Texto sin resultados | `Prueba con otro término de búsqueda.` | 226 |
| Mini-player cargando | `Cargando audio...` | 236 |
| Botón ver letra | `Letra` | 261 |

---

### `/recommendations` — Para ti
**Archivo:** `src/pages/recommendations/for-you-page.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 (loading) | `Para ti` | 59 |
| Subtítulo (loading) | `Cargando recomendaciones...` | 60 |
| Título H1 | `Para ti` | 77 |
| Subtítulo | `Canciones públicas recomendadas por el modelo musical` | 78-79 |
| Botón actualizar | `Actualizar` | 96 |
| Botón actualizando | `Actualizando...` | 96 |
| Label géneros | `Tus géneros detectados` | 103 |
| Título vacío | `Sin recomendaciones todavía` | 127 |
| Texto vacío | `Crea canciones con descripción libre para que el modelo aprenda tus gustos.` | 129-131 |

---

### `/stems` — Separar pistas
**Archivo:** `src/pages/stems/stems-page.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 | `Separar pistas` | 66 |
| Subtítulo | `Separa vocals y karaoke de cualquier archivo de audio (2 créditos).` | 67-69 |
| Título sección historial | `Historial de separaciones` | 93 |
| Sin historial | `Aún no tienes separaciones.` | 95 |

Componentes usados:
- `src/components/stems/audio-uploader.tsx` — zona drag & drop para subir archivo
- `src/components/stems/stem-progress.tsx` — barra de progreso
- `src/components/stems/stem-result-card.tsx` — cards de resultado con botones de descarga

---

### `/community` — Comunidad
**Archivo:** `src/pages/cliente/community-page.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 | `Comunidad` | 280 |
| Subtítulo | `Descubre canciones creadas por la comunidad.` | 281-283 |
| Botón publicar | `+ Publicar canción` | 287-291 |
| Placeholder búsqueda | `Buscar canciones o creadores...` | 300 |
| Tags filtro | `Todos, Trending, reggaeton, lofi, techno, pop, rock, electronic` | línea 13 |
| Vacío búsqueda | `No se encontraron canciones` | 387 |
| Texto vacío | `Prueba con otro término o filtro, o sé el primero en publicar.` | 388-390 |
| Botón paginación | `Ver más` | 412 |
| Botón ver letra | `Letra` | 492 |

**Stats cards** (línea 349): 3 tarjetas con datos del API:
- `Canciones publicadas`, `Usuarios activos`, `Reproducciones hoy`

---

### `/playlists` — Playlists
**Archivo:** `src/pages/playlists/playlists-page.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 | `Playlists` | 178 |
| Subtítulo tab manual | `Tus playlists creadas a mano` | 180-183 |
| Subtítulo tab auto | `Playlists generadas automáticamente por tus géneros y estados de ánimo` | 183 |
| Botón nueva playlist | `+ Nueva playlist` | 186-192 |
| Tab 1 | `Mis playlists` | 458 |
| Tab 2 | `Automáticas` | 463 |
| Hint automáticas | `El sistema genera playlists a partir de tus géneros y estados de ánimo más usados.` | 475 |
| Botón regenerar | `↺ Regenerar` | 481 |
| Vacío manual | `Aún no tienes playlists` | 513 |
| Vacío auto | `Sin playlists automáticas` | 513 |

**Modal crear playlist** (aparece al hacer click en "+ Nueva playlist"):
- Paso 1: título `Nueva playlist` (línea 249), placeholder `Nombre de la playlist...`
- Botones paso 1: `Cancelar` / `Siguiente →`
- Paso 2: título `Agregar canciones` (línea 299)
- Botones paso 2: `Omitir` / `Agregar X y ver playlist` / `Ver playlist vacía`

---

### `/karaoke` — Karaoke
**Archivo:** `src/pages/karaoke/karaoke-page.tsx`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Título H1 | `Karaoke` | 272 |
| Subtítulo | `Elegí una canción para empezar a cantar` | 273 |
| Botón unirse a sala | `Unirse a sala` | 303 |
| Tab 1 | `Mi Biblioteca` | 317 |
| Tab 2 | `Comunidad` | 322 |
| Tab 3 | `Mis Karaokes` | 327 |
| Placeholder búsqueda | `Buscar canción...` | 345 |
| Botón tarjeta cantar | `Cantar` | 93 y 164 |
| Vacío biblioteca | `Tu biblioteca está vacía` | 418 |
| Texto vacío biblioteca | `Generá tu primera canción en "Crear canción".` | 424 |
| Vacío comunidad | `Sin canciones en la comunidad` | 418 |
| Vacío mis karaokes | `Todavía no tenés karaokes generados` | 438 |

---

## COMPONENTES COMPARTIDOS

---

### SongCard — Tarjeta de canción
**Archivo:** `src/components/song/song-card.tsx`
**Usado en:** `/library`, `/recommendations`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Botón publicar | `Publicar` / `Publicada` | 155-166 |
| Botón descargar | `Descargar` | 178 |
| Botón reproducir (inferior) | `Reproducir` | 212 |
| Confirm eliminar | `¿Eliminar "X"? Esta acción no se puede deshacer.` | 220 |

La tarjeta tiene: portada con overlay oscuro, título y tags sobre el gradiente, botón play blanco en hover, fecha de creación, botones de acción abajo.

---

### LyricsView — Vista de letra a pantalla completa
**Archivo:** `src/components/song/lyrics-view.tsx`
**Usado en:** `/library`, `/community`

| Elemento | Texto actual | Línea aprox. |
|---|---|---|
| Estado cargando | `Cargando letra...` | 144 |
| Instrumental | `Canción instrumental — sin letra` | 157 |
| Label "Letra" | `Letra` | 136 |
| aria-label cerrar | `Cerrar letra` | 129 |

Lógica: si `detail.lyrics_timestamps` tiene datos (Whisper), los usa para sincronización real. Si no, estima con 4.5s por línea.

---

### KaraokeLines — Líneas estilo Apple Music
**Archivo:** `src/components/karaoke/karaoke-lyrics.tsx`
**Usado en:** `/karaoke/play/:id`

Sin textos fijos — solo renderiza los timestamps recibidos como prop.
Detecta marcadores de sección cuando el texto empieza y termina con `♪`.

---

## LAYOUTS

### AppLayout — Layout principal
**Archivo:** `src/layouts/app-layout.tsx`
Envuelve todas las rutas de usuario logueado. Tiene sidebar izquierdo (280px) + topbar + contenido principal.

### UpgradeModal — Modal de upgrade
**Archivo:** `src/layouts/upgrade-modal.tsx`
Se abre al hacer click en "✦ Upgrade" en el topbar.

### AuthLayout / AdminLayout
**Archivos:** `src/layouts/auth-layout.tsx`, `src/layouts/admin-layout.tsx`

---

## Estructura de archivos real (completa)

```
gm_frontend/src/
│
├── api/
│   ├── client.ts                    # Axios con interceptors JWT (refresh token automático)
│   ├── client.service.ts
│   ├── auth-service.ts              # login, register, logout, getProfile
│   ├── admin.service.ts
│   ├── endpoints.ts                 # TODAS las URLs de la API como constantes
│   └── modules/
│       ├── songs.api.ts             # generateSong, getLibrary, getSongDetail, deleteSong...
│       │                              Tipos: LibrarySong, SongDetail, LyricsSegment
│       ├── recommendations.api.ts   # getForYou, getSuggestedTags
│       ├── community.api.ts         # getCommunityFeed, toggleLike, recordPlay, getCommunityStats
│       ├── playlists.api.ts         # getPlaylists, createPlaylist, addSongToPlaylist, getAutoPlaylists
│       ├── stems.api.ts             # uploadAndSeparate, getStemJobs
│       ├── karaoke.api.ts           # getKaraokeCatalog, getMyKaraokes, getKaraokePlayData
│       ├── mix.api.ts               # getMixProjects, createMix, exportMix
│       └── notifications.api.ts     # getNotifications, markAllRead, markRead
│
├── store/
│   └── auth.store.ts                # Zustand: user, token, isAuthenticated, login, logout, setUser
│
├── hooks/
│   ├── useStemJob.ts                # Polling progreso de separación de pistas
│   ├── useMixExport.ts              # Estado de exportación del mix
│   └── useKaraokeRoom.ts            # Firebase realtime para sala de karaoke multijugador
│
├── layouts/
│   ├── app-layout.tsx               # Sidebar NAV_ITEMS + topbar créditos/notifs/avatar + <Outlet>
│   ├── auth-layout.tsx              # Centrado para login/register
│   ├── admin-layout.tsx             # Panel admin con su propio sidebar
│   └── upgrade-modal.tsx            # Modal de upgrade de plan
│
├── pages/
│   ├── home/
│   │   └── Home.tsx                 # "/" — hero, FEATURES cards, navbar con logo MusicGen
│   ├── auth/
│   │   ├── login-page.tsx           # "/login"
│   │   ├── register-page.tsx        # "/register"
│   │   └── auth-page.module.css
│   ├── cliente/
│   │   ├── Inicio.tsx               # "/inicio" — Tendencias + Para ti (datos mock con Unsplash)
│   │   ├── community-page.tsx       # "/community" — feed real, stats, filtros por tag, mini-player
│   │   ├── cliente-profile-page.tsx # "/profile"
│   │   └── payments-page.tsx        # "/payments" — historial de créditos/pagos
│   ├── library/
│   │   ├── library-page.tsx         # "/library" — SongCards, búsqueda, ordenamiento, mini-player, LyricsView
│   │   └── library-page.module.css
│   ├── create/
│   │   ├── create-page.tsx          # "/create" — 3 modos, TagPicker, duración, voz, idioma, polling
│   │   └── create-page.module.css
│   ├── recommendations/
│   │   ├── for-you-page.tsx         # "/recommendations" — recomendaciones con ML + botón Actualizar
│   │   └── for-you-page.module.css
│   ├── stems/
│   │   └── stems-page.tsx           # "/stems" — AudioUploader + StemProgress + historial
│   ├── playlists/
│   │   ├── playlists-page.tsx       # "/playlists" — manual/auto con modal de 2 pasos
│   │   ├── playlist-detail-page.tsx # "/playlists/:id"
│   │   └── playlists-page.module.css
│   ├── karaoke/
│   │   ├── karaoke-page.tsx         # "/karaoke" — catálogo con 3 tabs + preview de audio
│   │   ├── karaoke-generate-page.tsx# "/karaoke/generate/:songId" — inicia generación
│   │   ├── karaoke-player-page.tsx  # "/karaoke/play/:karaokeId" — reproductor + KaraokeLines
│   │   ├── karaoke-room-page.tsx    # "/karaoke/room/:code" — sala multijugador Firebase
│   │   └── *.module.css
│   ├── mix/
│   │   ├── mix-page.tsx             # "/mix" — lista de proyectos de mezcla
│   │   └── mix-editor-page.tsx      # "/mix/:id" — editor visual de clips con timeline
│   └── admin/
│       ├── dashboard-page.tsx       # "/admin"
│       ├── users-admin-page.tsx     # "/admin/usuarios"
│       ├── reports-admin-page.tsx   # "/admin/reportes"
│       ├── roles-page.tsx           # "/admin/roles"
│       ├── planes-page.tsx          # "/admin/planes"
│       ├── admin-profile-page.tsx   # "/admin/profile"
│       └── profile-page.tsx
│
├── components/
│   ├── song/
│   │   ├── song-card.tsx            # Tarjeta: portada + overlay + tags + play + Publicar/Descargar/Like/Eliminar
│   │   ├── song-card.module.css
│   │   ├── lyrics-view.tsx          # Overlay pantalla completa: letra sincronizada (Whisper o estimado)
│   │   └── lyrics-view.module.css
│   ├── karaoke/
│   │   ├── karaoke-lyrics.tsx       # Líneas karaoke: auto-scroll, blur por distancia, estilo Apple Music
│   │   └── join-room-modal.tsx      # Modal para ingresar código de sala karaoke
│   ├── mix/
│   │   ├── clip-card.tsx            # Tarjeta de clip de audio en el mix
│   │   ├── clip-timeline.tsx        # Timeline visual del mix
│   │   ├── add-clip-modal.tsx       # Modal para agregar canción al mix
│   │   └── save-mix-modal.tsx       # Modal para guardar el mix
│   └── stems/
│       ├── audio-uploader.tsx       # Zona drag & drop para subir audio
│       ├── stem-progress.tsx        # Barra de progreso de la separación
│       └── stem-result-card.tsx     # Card con resultado: botones de descarga por stem
│
├── router/
│   ├── index.tsx                    # Todas las rutas con lazy loading + PageLoader fallback
│   ├── private-route.tsx            # Redirige a /login si no hay sesión activa
│   └── admin-route.tsx              # Redirige si el usuario no tiene rol admin
│
├── types/
│   └── index.ts                     # Interfaces TypeScript: AuthUser, LyricTimestamp, KaraokeRoom...
│
├── App.tsx                          # Root: QueryClientProvider + RouterProvider
├── main.tsx                         # ReactDOM.createRoot
├── index.css                        # Variables CSS globales + Tailwind base
└── App.css                          # Estilos globales adicionales
```

---

## Guía de modificación rápida para la defensa

### "Cambie el título de esta página"
1. Identificar la URL en el navegador
2. Buscar en la tabla de rutas qué archivo la renderiza
3. Buscar `<h1` en ese archivo → cambiar el texto dentro del tag

### "Cambie este subtítulo / descripción"
- Mismo archivo que el título
- Buscar `<p` cerca del `<h1` → suele estar en el componente con clase `pageSubtitle`

### "Cambie el texto de este botón"
- Buscar el texto visible del botón en el archivo de la página con Ctrl+F
- Los botones son `<button>texto</button>` o tienen el texto como JSX directo

### "Cambie el texto de esta tarjeta de canción (Publicar, Descargar, Reproducir)"
- Archivo: `src/components/song/song-card.tsx`
- Buscar el texto exacto: `Publicar`, `Publicada`, `Descargar`, `Reproducir`

### "Cambie un ítem del menú lateral"
- Archivo: `src/layouts/app-layout.tsx`
- Línea ~14: array `NAV_ITEMS` → modificar el string `label:` del ítem

### "Cambie el placeholder de un campo de formulario"
- Archivo del formulario correspondiente
- Buscar `placeholder=` cerca del campo en cuestión

### "Cambie el mensaje de error o estado vacío"
- Buscar `emptyTitle`, `emptyText`, o `errorBanner` en el archivo de la página

### "Cambie los tags disponibles para crear canciones"
- Archivo: `src/pages/create/create-page.tsx`
- Línea ~70: constante `TAG_GROUPS` — array de grupos con sus tags

### "Cambie las opciones de duración"
- Archivo: `src/pages/create/create-page.tsx`
- Línea ~45: array `DURATION_OPTIONS` con `{ label, value }`

---

## Reglas de arquitectura (para si preguntan cómo está estructurado)

- **Todas las URLs de API** en `src/api/endpoints.ts`. Ningún componente escribe URLs directamente.
- **Ninguna página llama a fetch/axios directamente**. Todo pasa por `src/api/modules/`.
- **Estado global** solo en `src/store/auth.store.ts` con Zustand.
- **Tipos TypeScript** compartidos en `src/types/index.ts`. No se usa `any`.
- **Todos los imports de páginas** son lazy (`lazy(() => import(...))`) — lazy loading para reducir el bundle inicial.
- **Estilos**: CSS Modules (`.module.css`) para páginas complejas, Tailwind para componentes simples.
- **Autenticación**: JWT con refresh automático en el interceptor de `src/api/client.ts`.
