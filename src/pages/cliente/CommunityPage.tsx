import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCommunityFeed, getCommunityStats, toggleLike, recordPlay } from '../../api/modules/community.api'
import type { CommunitySong, CommunityStats } from '../../api/modules/community.api'
import { getSongThumbnailUrl } from '../../api/modules/songs.api'
import LyricsView from '../../components/song/LyricsView'

const TAGS = ['Todos', 'Trending', 'reggaeton', 'lofi', 'techno', 'pop', 'rock', 'electronic']

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)   return 'Ahora'
  if (minutes < 60)  return `Hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)    return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

function SongCoverImage({ song, size = 240 }: { song: CommunitySong; size?: number }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!song.thumbnail_s3_key) return
    getSongThumbnailUrl(song.id).then(setUrl).catch(() => {})
  }, [song.id, song.thumbnail_s3_key])

  if (!url) {
    return (
      <div style={{
        width: '100%', height: size, background: 'linear-gradient(135deg, #2d1b4e 0%, #1a1035 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7', opacity: 0.6,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
      </div>
    )
  }

  return <img src={url} alt={song.title} style={{ width: '100%', height: size, objectFit: 'cover' }} />
}

function SongCard({
  song: initial,
  onPlay,
  onPublishSong,
}: {
  song: CommunitySong
  onPlay: (song: CommunitySong) => void
  onPublishSong?: () => void
}) {
  const [song, setSong] = useState(initial)

  async function handleLike() {
    try {
      const result = await toggleLike(song.id)
      setSong(prev => ({ ...prev, is_liked: result.liked, like_count: result.like_count }))
    } catch { /* silencioso */ }
  }

  const initials = song.user_name
    ? song.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const primaryTag = song.tags[0]

  return (
    <article
      className="bg-[#121212] border border-[#1F1F1F] rounded-3xl overflow-hidden hover:border-[#2d2d2d] transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ height: 240 }}>
        <SongCoverImage song={song} size={240} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {song.tags.length > 0 && (
          <div
            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
          >
            {primaryTag?.name}
          </div>
        )}

        <button
          onClick={() => {
            recordPlay(song.id, 0).catch(() => {})
            onPlay(song)
          }}
          className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* User info */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
          >
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{song.user_name}</span>
            <span className="text-xs text-[#9CA3AF]">{timeAgo(song.created_at)}</span>
          </div>
        </div>

        {/* Song info */}
        <div className="mb-4">
          <h2 className="text-2xl font-black tracking-tight">{song.title}</h2>
          {song.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {song.tags.map(t => (
                <span key={t.id} className="text-xs bg-[#A855F7]/10 text-[#C084FC] px-3 py-1 rounded-full">
                  {t.name}
                </span>
              ))}
            </div>
          )}
          {song.description && (
            <p className="text-sm text-[#C7C7C7] mt-3 leading-relaxed line-clamp-2">{song.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-4">
          <div className="flex items-center gap-5 text-sm text-[#9CA3AF]">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 transition-colors"
              style={{ color: song.is_liked ? '#f87171' : undefined }}
            >
              <svg
                width="15" height="15" viewBox="0 0 24 24"
                fill={song.is_liked ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {song.like_count.toLocaleString()}
            </button>
            <div className="flex items-center gap-1.5">
              ▶ {song.play_count.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const [songs, setSongs]         = useState<CommunitySong[]>([])
  const [stats, setStats]         = useState<CommunityStats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setMore]    = useState(false)
  const [page, setPage]           = useState(1)
  const [hasNext, setHasNext]     = useState(false)
  const [search, setSearch]       = useState('')
  const [activeTag, setActiveTag] = useState('Todos')
  const [publishing, setPublishing] = useState(false)

  const [activeSong, setActiveSong]   = useState<CommunitySong | null>(null)
  const [activeUrl, setActiveUrl]     = useState<string | null>(null)
  const [loadingPlay, setLoadingPlay] = useState(false)
  const [showLyrics, setShowLyrics]   = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  async function handlePlay(song: CommunitySong) {
    if (activeSong?.id === song.id) return
    setShowLyrics(false)
    setLoadingPlay(true)
    setActiveSong(song)
    try {
      const { getSongPlayUrl } = await import('../../api/modules/songs.api')
      const url = await getSongPlayUrl(song.id)
      setActiveUrl(url)
    } catch {
      setActiveUrl(null)
      setActiveSong(null)
    } finally {
      setLoadingPlay(false)
    }
  }

  function loadFeed(p: number, tag: string, q: string, append = false) {
    if (p === 1) setLoading(true); else setMore(true)

    const tagParam = tag === 'Todos' || tag === 'Trending' ? '' : tag
    getCommunityFeed({ search: q, tag: tagParam, page: p })
      .then(res => {
        setSongs(prev => append ? [...prev, ...res.results] : res.results)
        setHasNext(res.has_next)
        setPage(p)
      })
      .finally(() => { setLoading(false); setMore(false) })
  }

  useEffect(() => { loadFeed(1, activeTag, search) }, [])
  useEffect(() => { getCommunityStats().then(setStats).catch(() => {}) }, [])

  function handleTagChange(tag: string) {
    setActiveTag(tag)
    loadFeed(1, tag, search)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadFeed(1, activeTag, search)
  }

  function handlePublishSong() {
    navigate('/library')
  }

  return (
    <div className="min-h-full px-8 py-7 text-white">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Comunidad</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">Descubre canciones creadas por la comunidad.</p>
          </div>
          <button
            onClick={handlePublishSong}
            disabled={publishing}
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}
          >
            + Publicar canción
          </button>
        </div>

        {/* Search + tag filters */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <form onSubmit={handleSearch} className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Buscar canciones o creadores..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#121212] border border-[#232323] focus:border-[#A855F7] outline-none rounded-xl px-4 py-3 text-sm transition-all"
            />
            <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#777' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16a6.471 6.471 0 004.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-150 ${
                  activeTag === tag ? 'text-white font-semibold' : 'bg-[#121212] text-[#9CA3AF] hover:text-white'
                }`}
                style={activeTag === tag ? { background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' } : {}}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Canciones publicadas', value: stats?.public_songs?.toLocaleString() ?? '…' },
          { label: 'Usuarios activos',     value: stats?.active_users?.toLocaleString() ?? '…' },
          { label: 'Reproducciones hoy',   value: stats ? (stats.plays_today >= 1000 ? `${(stats.plays_today / 1000).toFixed(1)}K` : stats.plays_today.toString()) : '…' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-5">
            <span className="text-[#9CA3AF] text-sm">{label}</span>
            <h3 className="text-3xl font-black mt-2">{value}</h3>
          </div>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 420, borderRadius: 24, background: 'linear-gradient(90deg,#282828 25%,#333 50%,#282828 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h3 className="text-2xl font-bold mb-2">No se encontraron canciones</h3>
          <p className="text-[#9CA3AF] text-sm">Prueba con otro término o filtro, o sé el primero en publicar.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {songs.map(song => (
              <SongCard key={song.id} song={song} onPlay={handlePlay} />
            ))}
          </div>

          {hasNext && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => loadFeed(page + 1, activeTag, search, true)}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full text-sm font-semibold transition-all"
                style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-base)', opacity: loadingMore ? 0.6 : 1 }}
              >
                {loadingMore ? 'Cargando...' : 'Ver más'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Mini-player */}
      {activeSong && (
        <div style={{
          position: 'fixed', bottom: 8, left: 'calc(280px + 16px)', right: 8,
          height: 72, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px',
          zIndex: 50, borderRadius: 8,
        }}>
          {loadingPlay ? (
            <span style={{ fontSize: 13, color: 'var(--text-subdued)' }}>Cargando audio...</span>
          ) : activeUrl ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                  {activeSong.title}
                </span>
                {activeSong.tags[0] && (
                  <span style={{ fontSize: 12, color: 'var(--color-primary-hover)' }}>{activeSong.tags[0].name}</span>
                )}
              </div>
              <audio
                ref={audioRef}
                key={activeUrl}
                src={activeUrl}
                controls
                autoPlay
                style={{ flex: 1, height: 36, accentColor: 'var(--color-primary)' }}
              />
              <button
                onClick={() => setShowLyrics(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 500, border: `1px solid ${showLyrics ? 'var(--color-primary)' : 'var(--border)'}`,
                  background: showLyrics ? 'rgba(168,85,247,0.08)' : 'none',
                  color: showLyrics ? 'var(--color-primary)' : 'var(--text-subdued)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM6 4h6v6h6v10H6V4zm2 14h8v-2H8v2zm0-4h8v-2H8v2zm0-4h4V8H8v2z"/>
                </svg>
                Letra
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Lyrics overlay */}
      {showLyrics && activeSong && (
        <LyricsView
          song={activeSong as any}
          audioRef={audioRef}
          onClose={() => setShowLyrics(false)}
        />
      )}
    </div>
  )
}
