// src/pages/inicio/Inicio.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Heart, Sparkles, TrendingUp, Coins } from 'lucide-react'

// ─────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────
interface Song {
  id: string
  title: string
  cover: string
  tags: string[]
  author: string
  plays: number
}

// ─────────────────────────────────────────────────────────
// MOCK DATA — reemplazar por llamadas reales a la API
// (GET /api/credits, GET /api/songs/trending, GET /api/songs/for-you)
// ─────────────────────────────────────────────────────────
const COVER_POOL = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
  'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&q=80',
]

const TITLES = [
  'Te Pienso a Medianoche', 'Atardecer Tranquilo', 'Vibras de Verano',
  'Calle Sin Salida', 'Luces de Neón', 'Vuelvo a Empezar',
  'Bajo la Lluvia', 'Sueño Eléctrico', 'Horizonte Roto', 'Ritmo Interior',
]

const TAG_POOL = [
  ['pop', 'romantic', 'ballad'], ['lofi', 'chill', 'ambient'],
  ['pop', 'dance', 'energetic'], ['reggaeton', 'urban', 'party'],
  ['techno', 'electronic', 'night'], ['acoustic', 'sad', 'piano'],
]

const AUTHORS = ['Alba M.', 'Diego R.', 'Camila S.', 'Marco T.', 'Joaquín P.', 'Vale G.']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateMockSongs(count: number): Song[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}-${Math.random().toString(36).slice(2, 8)}`,
    title: randomFrom(TITLES),
    cover: randomFrom(COVER_POOL),
    tags: randomFrom(TAG_POOL),
    author: randomFrom(AUTHORS),
    plays: Math.floor(Math.random() * 9000) + 100,
  }))
}

// ─────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────
function SongCard({ song }: { song: Song }) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="group relative shrink-0 w-[200px] rounded-2xl overflow-hidden bg-[#161320] border border-white/5 hover:border-violet-500/40 transition-colors">
      <div className="relative h-[200px] w-full overflow-hidden">
        <img
          src={song.cover}
          alt={song.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <button
          onClick={() => setLiked((v) => !v)}
          aria-label="Marcar como favorita"
          className="absolute top-2 right-2 grid place-items-center h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
        >
          <Heart
            size={16}
            className={liked ? 'fill-violet-400 text-violet-400' : 'text-white'}
          />
        </button>

        <button
          aria-label="Reproducir"
          className="absolute bottom-3 right-3 grid place-items-center h-10 w-10 rounded-full bg-violet-500 text-black opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
        >
          <Play size={16} fill="black" className="ml-0.5" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-sm font-semibold text-white truncate">{song.title}</p>
        <p className="text-xs text-white/40 truncate">{song.author}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {song.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SongRow({ songs, loading }: { songs: Song[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[200px] h-[280px] rounded-2xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
      {songs.map((song) => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-violet-400">{icon}</div>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────
export default function Inicio() {
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)

  // Trending y For You se generan una sola vez por carga de página
  const trendingSongs = useMemo(() => generateMockSongs(6), [])
  const forYouSongs = useMemo(() => generateMockSongs(6), [])

  useEffect(() => {
    // Simula la llamada a GET /api/credits (HU-01)
    const t = setTimeout(() => {
      setCredits(Math.floor(Math.random() * 50) + 5)
      setLoading(false)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-full bg-[#0b0a10] text-white px-8 py-8 space-y-10">
      {/* Encabezado + saldo de créditos (HU-01) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Inicio</h1>
          <p className="text-sm text-white/40">Bienvenida de nuevo, sigamos creando.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#161320] border border-white/10 px-4 py-2">
            <Coins size={16} className="text-violet-400" />
            {loading ? (
              <span className="h-4 w-10 rounded bg-white/10 animate-pulse" />
            ) : (
              <span className="text-sm font-semibold">{credits} créditos</span>
            )}
          </div>

          <Link
            to="/create"
            className="rounded-full bg-violet-500 hover:bg-violet-400 text-black text-sm font-bold px-5 py-2 transition-colors"
          >
            + Crear Canción
          </Link>
        </div>
      </div>

      {/* Tendencias (HU-02) */}
      <section>
        <SectionHeader
          icon={<TrendingUp size={20} />}
          title="Tendencias"
          subtitle="Lo que la comunidad está generando ahora"
        />
        <SongRow songs={trendingSongs} loading={loading} />
      </section>

      {/* Para ti (HU-22) */}
      <section>
        <SectionHeader
          icon={<Sparkles size={20} />}
          title="Para ti"
          subtitle="Según tus géneros y estilos favoritos"
        />
        <SongRow songs={forYouSongs} loading={loading} />
      </section>
    </div>
  )
}