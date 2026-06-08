import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlaylist, sharePlaylist } from '../../api/modules/playlists.api'
import type { Playlist } from '../../api/modules/playlists.api'
import { getSongPlayUrl } from '../../api/modules/songs.api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8000'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [playlist, setPlaylist]       = useState<Playlist | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [shareUrl, setShareUrl]       = useState<string | null>(null)
  const [sharing, setSharing]         = useState(false)
  const [activeUrl, setActiveUrl]     = useState<string | null>(null)
  const [activeSongId, setActiveSongId] = useState<string | null>(null)
  const [loadingPlay, setLoadingPlay] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getPlaylist(id)
      .then(setPlaylist)
      .catch(() => setError('No se pudo cargar la playlist.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleShare() {
    if (!id) return
    setSharing(true)
    try {
      const { share_url } = await sharePlaylist(id)
      const full = `${BASE_URL}${share_url}`
      setShareUrl(full)
      await navigator.clipboard.writeText(full).catch(() => {})
    } catch {
      setError('No se pudo generar el enlace.')
    } finally {
      setSharing(false)
    }
  }

  async function handlePlay(songId: string) {
    if (activeSongId === songId) return
    setLoadingPlay(true)
    setActiveSongId(songId)
    try {
      const url = await getSongPlayUrl(songId)
      setActiveUrl(url)
    } catch {
      setActiveUrl(null)
      setActiveSongId(null)
    } finally {
      setLoadingPlay(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', color: 'var(--text-base)' }}>
        <p style={{ color: 'var(--text-subdued)', fontSize: 14 }}>Cargando playlist...</p>
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div style={{ padding: '28px 32px', color: 'var(--text-base)' }}>
        <p style={{ color: '#fca5a5', fontSize: 14 }}>{error ?? 'Playlist no encontrada.'}</p>
        <button onClick={() => navigate('/playlists')} style={{ marginTop: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          ← Volver a playlists
        </button>
      </div>
    )
  }

  const songs = playlist.playlist_songs ?? []

  return (
    <div style={{ minHeight: '100%', padding: '28px 32px 80px', color: 'var(--text-base)' }}>
      {/* Back */}
      <button
        onClick={() => navigate('/playlists')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-subdued)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Volver
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 28 }}>
        <div style={{
          width: 160, height: 160, borderRadius: 8, background: 'var(--bg-card-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-subdued)', flexShrink: 0, overflow: 'hidden',
        }}>
          {playlist.cover_url
            ? <img src={playlist.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18A3 3 0 1 0 19 17V8h3V6h-5z" /></svg>
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-subdued)', margin: '0 0 6px' }}>
            {playlist.type === 'manual' ? 'Playlist' : 'Playlist automática'}
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{playlist.title}</h1>
          {playlist.description && (
            <p style={{ fontSize: 14, color: 'var(--text-subdued)', margin: '0 0 12px' }}>{playlist.description}</p>
          )}
          <p style={{ fontSize: 14, color: 'var(--text-subdued)', margin: '0 0 16px' }}>
            {songs.length} canción{songs.length !== 1 ? 'es' : ''}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 500, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-card-hover)', color: 'var(--text-base)',
                border: '1px solid var(--border)', cursor: 'pointer',
                opacity: sharing ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7A3.5 3.5 0 0 0 9 12a3.5 3.5 0 0 0-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81A3 3 0 0 0 6 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 2.04-.81l7.12 4.16A3 3 0 0 0 15 21a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
              {sharing ? 'Compartiendo...' : 'Compartir'}
            </button>
          </div>
          {shareUrl && (
            <p style={{ marginTop: 10, fontSize: 13, color: '#4ade80' }}>
              ✓ Enlace copiado: <span style={{ color: 'var(--text-subdued)', wordBreak: 'break-all' }}>{shareUrl}</span>
            </p>
          )}
        </div>
      </div>

      {/* Song list */}
      {songs.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-subdued)', fontSize: 14 }}>
          Esta playlist está vacía. Agrega canciones desde tu biblioteca.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {songs
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((item, idx) => {
              const isActive = activeSongId === item.song.id
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 6,
                    background: isActive ? 'rgba(168,85,247,0.1)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <span style={{ width: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-subdued)', flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: isActive ? 'var(--color-primary)' : 'var(--text-base)', truncate: 'hidden' as any, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.song.title ?? 'Sin título'}
                    </p>
                    {item.song.tags && item.song.tags.length > 0 && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-subdued)' }}>
                        {item.song.tags.map(t => t.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePlay(item.song.id)}
                    disabled={loadingPlay && activeSongId === item.song.id}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none',
                      background: isActive ? 'var(--color-primary)' : 'var(--bg-card-hover)',
                      color: isActive ? '#000' : 'var(--text-base)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )
            })}
        </div>
      )}

      {/* Mini player */}
      {activeSongId && activeUrl && (
        <div style={{
          position: 'fixed', bottom: 0, left: 280, right: 0, height: 72,
          background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', zIndex: 50,
        }}>
          <audio key={activeUrl} src={activeUrl} controls autoPlay style={{ flex: 1, height: 36, accentColor: 'var(--color-primary)' }} />
        </div>
      )}
    </div>
  )
}
