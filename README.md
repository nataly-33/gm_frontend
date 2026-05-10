# MusicGen — Frontend

React 19 + TypeScript + Vite. Interfaz inspirada en Spotify con paleta "Lilac Night" (lilas).

## Stack

| Tecnología | Uso |
| :--- | :--- |
| React 19 + TypeScript | Framework principal |
| Vite 8 | Build tool |
| React Router v6 | Routing |
| Zustand + persist | Estado global (auth) |
| Axios | Cliente HTTP con interceptors JWT |
| @tanstack/react-query | Cache de datos del servidor |
| CSS Modules + CSS Variables | Estilos (sin Tailwind) |

## Scripts

```bash
npm run dev      # Servidor de desarrollo en http://localhost:5173
npm run build    # TypeScript check + build de producción
npm run preview  # Vista previa del build
npm run lint     # ESLint
```

## Variables de entorno

Crear un archivo `.env.local` en la raíz del frontend:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## Documentos clave — **leer antes de escribir código**

| Archivo | Qué define |
| :--- | :--- |
| [`docs/ui-specification.md`](docs/ui-specification.md) | Tokens de color, tipografía, layout de 3 áreas, reglas de componentes |
| [`docs/estructura_frontend.md`](docs/estructura_frontend.md) | Estructura de carpetas, qué va en cada capa, reglas de archivos |
| [`../gm_backend/docs/API_CONTRACT.md`](../gm_backend/docs/API_CONTRACT.md) | **Todos los endpoints** del backend — fuente de verdad para el frontend |

---

## Paleta "Lilac Night" — resumen rápido

| Variable CSS | Hex | Uso |
| :--- | :--- | :--- |
| `--color-primary` | `#A855F7` | Botones, activos, marca |
| `--color-primary-hover` | `#C084FC` | Hover de botones |
| `--bg-base` | `#000000` | Fondo de la app |
| `--bg-surface` | `#121212` | Sidebar, Main View |
| `--bg-card` | `#181818` | Tarjetas de canciones |
| `--bg-card-hover` | `#282828` | Hover de cards, inputs |
| `--text-base` | `#FFFFFF` | Títulos, texto principal |
| `--text-subdued` | `#B3B3B3` | Subtítulos, artistas, labels |

> Las variables viven en `src/index.css`. **No hardcodear colores** en los componentes.

---

## Estructura de carpetas

```
src/
├── api/
│   ├── client.ts        # Instancia Axios con interceptors JWT
│   └── endpoints.ts     # Todos los endpoints como constantes TypeScript
├── store/
│   └── auth.store.ts    # Estado de autenticación (Zustand + persist)
├── router/
│   ├── index.tsx        # Definición de rutas
│   ├── PrivateRoute.tsx # Redirige a /login si no hay sesión
│   └── AdminRoute.tsx   # Redirige a / si no es admin
├── layouts/
│   ├── AuthLayout.tsx   # Layout centrado para login/register
│   └── AppLayout.tsx    # Layout Spotify: sidebar + main + player
├── pages/
│   ├── auth/            # LoginPage, RegisterPage
│   ├── home/
│   ├── library/
│   ├── create/
│   └── community/
├── components/
│   ├── ui/              # Componentes reutilizables (Button, Input, Card…)
│   ├── player/          # Barra de reproducción
│   └── song/            # Tarjetas de canciones
├── hooks/               # Custom hooks
├── types/               # Interfaces TypeScript globales
├── constants/           # Constantes de la app
├── utils/               # Funciones helper
└── styles/              # CSS global adicional
```

---

## Reglas del proyecto

1. **Capas claras:** `api/` solo HTTP, `store/` solo estado global, `pages/` vistas completas, `components/` piezas reutilizables. No mezclar lógica en UI.
2. **Endpoints:** importar siempre desde `src/api/endpoints.ts`. Nunca escribir URLs hardcodeadas.
3. **Colores:** usar siempre variables CSS (`var(--color-primary)`). Ver `docs/ui-specification.md`.
4. **Estilos:** CSS Modules (`.module.css`) para cada componente. El `index.css` es solo para variables globales y reset.
5. **Auth:** usar `useAuthStore` de Zustand. Los tokens nunca van en `useState` ni `useContext` propio.
6. **Rutas privadas:** envolver con `<PrivateRoute />` o `<AdminRoute />` según corresponda.
7. **Nombres:** PascalCase para componentes (`SongCard.tsx`), camelCase para utils y hooks (`usePlayer.ts`).
