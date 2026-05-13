import { useMemo, useState } from 'react'

interface CommunityPost {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    verified?: boolean
    pro?: boolean
  }
  song: {
    title: string
    genre: string
    duration: string
    cover: string
  }
  description: string
  likes: number
  comments: number
  plays: number
  createdAt: string
  trending?: boolean
}

const randomPosts: CommunityPost[] = [
  {
    id: 1,
    user: {
      name: 'Lucas Ferreira',
      username: '@lucasbeats',
      avatar: 'LF',
      verified: true,
      pro: true,
    },
    song: {
      title: 'Midnight Echoes',
      genre: 'Synthwave',
      duration: '3:24',
      cover:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop',
    },
    description:
      'Experimentando una mezcla entre synthwave y ambient 🎧 ¿Qué opinan del drop?',
    likes: 1243,
    comments: 184,
    plays: 18920,
    createdAt: 'Hace 2 horas',
    trending: true,
  },
  {
    id: 2,
    user: {
      name: 'María González',
      username: '@mariavoice',
      avatar: 'MG',
      pro: true,
    },
    song: {
      title: 'Corazón Digital',
      genre: 'Pop Latino',
      duration: '2:58',
      cover:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop',
    },
    description:
      'Primera demo para mi próximo álbum ✨ Lo hice 100% con IA y producción casera.',
    likes: 892,
    comments: 67,
    plays: 11034,
    createdAt: 'Hace 5 horas',
  },
  {
    id: 3,
    user: {
      name: 'DJ Orion',
      username: '@orionmix',
      avatar: 'DO',
      verified: true,
    },
    song: {
      title: 'Neon Highway',
      genre: 'EDM',
      duration: '4:11',
      cover:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
    },
    description:
      'Track inspirado en festivales nocturnos 🌌 Subí el bass y quedó brutal.',
    likes: 2310,
    comments: 342,
    plays: 32098,
    createdAt: 'Hace 1 día',
    trending: true,
  },
  {
    id: 4,
    user: {
      name: 'Sofía Mendes',
      username: '@sofimusic',
      avatar: 'SM',
    },
    song: {
      title: 'Rainy Lights',
      genre: 'Lo-Fi',
      duration: '2:44',
      cover:
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop',
    },
    description:
      'Perfecta para estudiar o relajarse ☕🌧️',
    likes: 543,
    comments: 29,
    plays: 6802,
    createdAt: 'Hace 2 días',
  },
]

const categories = [
  'Todos',
  'Trending',
  'Pop',
  'Lo-Fi',
  'EDM',
  'Synthwave',
  'Hip Hop',
]

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [search, setSearch] = useState('')

  const filteredPosts = useMemo(() => {
    return randomPosts.filter(post => {
      const matchesCategory =
        selectedCategory === 'Todos'
          ? true
          : selectedCategory === 'Trending'
          ? post.trending
          : post.song.genre.toLowerCase() === selectedCategory.toLowerCase()

      const matchesSearch =
        post.song.title.toLowerCase().includes(search.toLowerCase()) ||
        post.user.name.toLowerCase().includes(search.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, search])

  return (
    <div className="min-h-full px-8 py-7 text-white">
      {/* ── Header ───────────────────────── */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Comunidad
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Descubre canciones creadas por la comunidad.
            </p>
          </div>

          <button
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            }}
          >
            + Publicar canción
          </button>
        </div>

        {/* ── Search + filters ───────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Buscar canciones o creadores..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#121212] border border-[#232323] focus:border-[#A855F7] outline-none rounded-xl px-4 py-3 text-sm transition-all"
            />

            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777]"
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16a6.471 6.471 0 004.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(category => {
              const active = selectedCategory === category

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-150 ${
                    active
                      ? 'text-white font-semibold'
                      : 'bg-[#121212] text-[#9CA3AF] hover:text-white'
                  }`}
                  style={
                    active
                      ? {
                          background:
                            'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                        }
                      : {}
                  }
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-5">
          <span className="text-[#9CA3AF] text-sm">Canciones publicadas</span>
          <h3 className="text-3xl font-black mt-2">18,240</h3>
        </div>

        <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-5">
          <span className="text-[#9CA3AF] text-sm">Usuarios activos</span>
          <h3 className="text-3xl font-black mt-2">4,892</h3>
        </div>

        <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-5">
          <span className="text-[#9CA3AF] text-sm">Reproducciones hoy</span>
          <h3 className="text-3xl font-black mt-2">912K</h3>
        </div>
      </div>

      {/* ── Feed ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredPosts.map(post => (
          <article
            key={post.id}
            className="bg-[#121212] border border-[#1F1F1F] rounded-3xl overflow-hidden hover:border-[#2d2d2d] transition-all duration-200"
          >
            {/* Cover */}
            <div className="relative h-[240px] overflow-hidden">
              <img
                src={post.song.cover}
                alt={post.song.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              {post.trending && (
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  }}
                >
                  🔥 Trending
                </div>
              )}

              <button className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* User */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  }}
                >
                  {post.user.avatar}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm">
                      {post.user.name}
                    </span>

                    {post.user.verified && (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="#3B82F6"
                      >
                        <path d="M12 2l2.39 4.84L20 7.27l-4 3.89.94 5.48L12 14.77 7.06 16.64 8 11.16 4 7.27l5.61-.43L12 2z" />
                      </svg>
                    )}

                    {post.user.pro && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A855F7]/20 text-[#C084FC]">
                        PRO
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[#9CA3AF]">
                    {post.user.username} • {post.createdAt}
                  </span>
                </div>
              </div>

              {/* Song info */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight">
                    {post.song.title}
                  </h2>

                  <span className="text-xs bg-[#1D1D1D] px-3 py-1 rounded-full text-[#CFCFCF]">
                    {post.song.duration}
                  </span>
                </div>

                <span className="inline-block mt-2 text-xs bg-[#A855F7]/10 text-[#C084FC] px-3 py-1 rounded-full">
                  {post.song.genre}
                </span>

                <p className="text-sm text-[#C7C7C7] mt-4 leading-relaxed">
                  {post.description}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-4">
                <div className="flex items-center gap-5 text-sm text-[#9CA3AF]">
                  <button className="flex items-center gap-2 hover:text-white transition-colors">
                    ❤️ {post.likes.toLocaleString()}
                  </button>

                  <button className="flex items-center gap-2 hover:text-white transition-colors">
                    💬 {post.comments}
                  </button>

                  <div className="flex items-center gap-2">
                    ▶ {post.plays.toLocaleString()}
                  </div>
                </div>

                <button className="text-sm font-semibold text-[#C084FC] hover:text-white transition-colors">
                  Ver más
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h3 className="text-2xl font-bold mb-2">
            No se encontraron resultados
          </h3>

          <p className="text-[#9CA3AF] text-sm">
            Intenta con otro nombre o categoría.
          </p>
        </div>
      )}
    </div>
  )
}