# Especificaciones Técnicas de Frontend — MusicGen
### Inspiración Spotify · Paleta "Lilac Night"

Este documento es la **fuente de verdad de diseño**. Todo componente nuevo debe respetar estos tokens y reglas.

---

## 1. Design Tokens (Paleta de Colores)

Definidos en `src/index.css`. **Nunca hardcodear colores en componentes.**

| Token CSS | Valor Hex | Uso |
| :--- | :--- | :--- |
| `--color-primary` | `#A855F7` | Botones principales, sliders activos, textos de marca |
| `--color-primary-hover` | `#C084FC` | Hover en elementos de acción |
| `--bg-base` | `#000000` | Fondo total de la aplicación |
| `--bg-surface` | `#121212` | Fondo de contenedores (Sidebar, Main Content) |
| `--bg-card` | `#181818` | Fondo de tarjetas de música |
| `--bg-card-hover` | `#282828` | Hover de tarjetas y campos de formulario |
| `--text-base` | `#FFFFFF` | Títulos y texto importante |
| `--text-subdued` | `#B3B3B3` | Descripciones, artistas, etiquetas secundarias |
| `--border` | `#282828` | Bordes sutiles entre secciones |
| `--shadow` | `rgba(0,0,0,0.5) 0 8px 24px` | Sombra de tarjetas y modales |

---

## 2. Tipografía

**Fuente:** `Inter` (Google Fonts). Fallback: `system-ui, 'Segoe UI', sans-serif`.

| Nivel | Tamaño | Peso | Letter-spacing |
| :--- | :--- | :--- | :--- |
| Heading L (h1) | `32px` | 700 | `-0.02em` |
| Heading M (h2) | `24px` | 700 | — |
| Heading S (h3) | `16px` | 700 | — |
| Body | `14px` | 400/500 | — |
| Caption | `12px` | 400 | — |
| Label (botón) | `14px` | 700 | `+0.08em`, UPPERCASE |

**Border Radius:**
- Contenedores/Cards: `8px`
- Inputs: `4px`
- Botones/Píldoras: `500px` (full round)

---

## 3. Arquitectura del Layout (Grid de 3 áreas)

Implementado en `src/layouts/AppLayout.tsx`.

```
┌──────────────────────────────────────────────┐
│  Sidebar (280px)  │  Main View (flex: 1)      │
│                   │                           │
│  Nav superior     │  Gradiente lila → negro   │
│  Biblioteca inf.  │  scroll independiente     │
│                   │                           │
├───────────────────┴───────────────────────────┤
│          Player Bar (altura: 90px)            │
└──────────────────────────────────────────────┘
```

| Área | CSS clave |
| :--- | :--- |
| Grid raíz | `display:grid; grid-template-columns:280px 1fr; grid-template-rows:1fr 90px` |
| Sidebar | `background: var(--bg-surface); border-radius: 8px` |
| Main | `overflow-y: auto; background: var(--bg-surface)` |
| Gradiente top | `linear-gradient(180deg, #2e1a4a 0%, var(--bg-surface) 100%)` |
| Player Bar | `grid-column: 1 / -1; height: 90px; display: flex; justify-content: space-between` |

---

## 4. Reglas de Componentes

### A. Tarjetas de canción
- Background: `var(--bg-card)` → `var(--bg-card-hover)` en hover
- Transición: `all 0.3s cubic-bezier(0.3, 0, 0, 1)`
- Imagen opcional: escalar `transform: scale(1.04)` en hover de la card

### B. Botón de Play (sobre tarjetas)
- Forma: círculo perfecto
- Color: `var(--color-primary)`, ícono en `#000000`
- **Solo visible en hover** de la card
- Aparece con `opacity: 0 → 1` + `transform: translateY(4px) → translateY(0)`

### C. Botón primario (CTA)
- `background: var(--color-primary)`, texto negro, `border-radius: 500px`
- Hover: `background: var(--color-primary-hover)`, ligero `scale(1.02)`
- Disabled: `opacity: 0.6`

### D. Inputs / Formularios
- Background: `var(--bg-card-hover)`, sin borde visible por defecto
- Focus: `border: 1px solid var(--color-primary)`
- Placeholder: `var(--text-subdued)`

### E. Sliders de progreso
- Base: `var(--bg-card-hover)`
- Progreso por defecto: `var(--text-base)`
- Hover: cambiar progreso a `var(--color-primary)` + mostrar thumb

### F. Navegación (sidebar)
- Activo: color `var(--text-base)`, peso 700, background `var(--bg-card-hover)`
- Inactivo: color `var(--text-subdued)`, hover → `var(--text-base)`

---

## 5. Animaciones y Micro-interacciones

```css
/* Transición global recomendada */
transition: all 0.3s cubic-bezier(0.3, 0, 0, 1);

/* Skeleton mientras carga */
background: linear-gradient(90deg, #282828 25%, #333 50%, #282828 75%);
animation: pulse 1.5s infinite;
```

---

## 6. Uso de estilos en código

- **CSS Modules** para estilos de componentes: crear `ComponentName.module.css` junto al `.tsx`
- **Variables CSS** para todos los colores, nunca valores hardcodeados
- **No usar Tailwind** (el proyecto usa CSS plano + módulos)

```tsx
// ✅ Correcto
import styles from './MyComponent.module.css'
<div className={styles.card} style={{ background: 'var(--bg-card)' }}>

// ❌ Incorrecto
<div style={{ background: '#181818' }}>
```
