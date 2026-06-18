import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPlaylist,
  sharePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../../api/modules/playlists.api'
import type { Playlist, PlaylistSongItem } from '../../api/modules/playlists.api'
import { getSongPlayUrl, getLibrary } from '../../api/modules/songs.api'
import type { LibrarySong } from '../../api/modules/songs.api'
import LyricsView from '../../components/song/lyrics-view'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8000'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [activeSongId, setActiveSongId] = useState<string | null>(null)
  const [loadingPlay, setLoadingPlay] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const [showLyrics, setShowLyrics] = useState(false)
  const [activeSong, setActiveSong] = useState<PlaylistSongItem | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [libraryForAdd, setLibraryForAdd] = useState<LibrarySong[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }
    setLoading(true)
    getPlaylist(id)
      .then(setPlaylist)
      .catch(() => setError('No se pudo cargar la playlist.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!showAddModal) {
      return
    }
    getLibrary()
      .then(setLibraryForAdd)
      .catch(() => {})
  }, [showAddModal])

  async function handleShare() {
    if (!id) {
      return
    }
    setSharing(true)
    try {
      const { share_url: rawShareUrl } = await sharePlaylist(id)
      const full = `${BASE_URL}${rawShareUrl}`
      setShareUrl(full)
      await navigator.clipboard.writeText(full).catch(() => {})
    } catch {
      setError('No se pudo generar el enlace.')
    } finally {
      setSharing(false)
    }
  }

  async function handlePlay(item: PlaylistSongItem) {
    if (activeSongId === item.song.id) {
      return
    }
    setShowLyrics(false)
    setLoadingPlay(true)
    setActiveSongId(item.song.id)
    setActiveSong(item)
    try {
      const url = await getSongPlayUrl(item.song.id)
      setActiveUrl(url)
    } catch {
      setActiveUrl(null)
      setActiveSongId(null)
      setActiveSong(null)
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
        <button
          onClick={() => navigate('/playlists')}
          style={{
            marginTop: 12,
            color: 'var(--color-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-subdued)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 20,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Volver
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 28 }}>
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 8,
            background: 'var(--bg-card-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-subdued)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {playlist.cover_url ? (
            <img
              src={playlist.cover_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18A3 3 0 1 0 19 17V8h3V6h-5z" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-subdued)',
              margin: '0 0 6px',
            }}
          >
            {playlist.type === 'manual' ? 'Playlist' : 'Playlist automática'}
          </p>
          <h1
            style={{ fontSize: 36, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}
          >
            {playlist.title}
          </h1>
          {playlist.description && (
            <p style={{ fontSize: 14, color: 'var(--text-subdued)', margin: '0 0 12px' }}>
              {playlist.description}
            </p>
          )}
          <p style={{ fontSize: 14, color: 'var(--text-subdued)', margin: '0 0 16px' }}>
            {songs.length} canción{songs.length !== 1 ? 'es' : ''}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={async () => {
                if (!id || !window.confirm(`¿Eliminar la playlist "${playlist.title}"?`)) {
                  return
                }
                await deletePlaylist(id)
                navigate('/playlists')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 500,
                fontSize: 13,
                fontWeight: 600,
                background: 'none',
                color: '#f87171',
                border: '1px solid #f87171',
                cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              Eliminar
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 500,
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--bg-card-hover)',
                color: 'var(--text-base)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              + Agregar canciones
            </button>

            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 500,
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--bg-card-hover)',
                color: 'var(--text-base)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                opacity: sharing ? 0.6 : 1,
                transition: 'opacity 0.15s',
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
              ✓ Enlace copiado:{' '}
              <span style={{ color: 'var(--text-subdued)', wordBreak: 'break-all' }}>
                {shareUrl}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Song list */}
      {songs.length === 0 ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: 'var(--text-subdued)',
            fontSize: 14,
          }}
        >
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: isActive ? 'rgba(168,85,247,0.1)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                    }
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--text-subdued)',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 500,
                        color: isActive ? 'var(--color-primary)' : 'var(--text-base)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.song.title ?? 'Sin título'}
                    </p>
                    {item.song.tags && item.song.tags.length > 0 && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-subdued)' }}>
                        {item.song.tags.map((t) => t.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePlay(item)}
                    disabled={loadingPlay && activeSongId === item.song.id}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      background: isActive ? 'var(--color-primary)' : 'var(--bg-card-hover)',
                      color: isActive ? '#000' : 'var(--text-base)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={async () => {
                      if (!id) {
                        return
                      }
                      await removeSongFromPlaylist(id, item.song.id).catch(() => {})
                      setPlaylist((prev) =>
                        prev
                          ? {
                              ...prev,
                              playlist_songs: prev.playlist_songs.filter((ps) => ps.id !== item.id),
                            }
                          : prev
                      )
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-subdued)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subdued)')}
                    aria-label="Quitar de la playlist"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              )
            })}
        </div>
      )}

      {/* Mini-player with lyrics */}
      {activeSongId && (
        <div
          style={{
            position: 'fixed',
            bottom: 8,
            left: 'calc(280px + 16px)',
            right: 8,
            height: 72,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 24px',
            zIndex: 50,
            borderRadius: 8,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {loadingPlay ? (
            <span style={{ fontSize: 13, color: 'var(--text-subdued)' }}>Cargando audio...</span>
          ) : activeUrl ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-base)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 200,
                  }}
                >
                  {activeSong?.song.title ?? 'Sin título'}
                </span>
              </div>
              <audio
                ref={audioRef}
                key={activeUrl}
                src={activeUrl}
                controls
                autoPlay
                style={{ flex: 1, height: 36, accentColor: 'var(--color-primary)', minWidth: 0 }}
              />
              <button
                onClick={() => setShowLyrics((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 500,
                  border: `1px solid ${showLyrics ? 'var(--color-primary)' : 'var(--border)'}`,
                  background: showLyrics ? 'rgba(168,85,247,0.08)' : 'none',
                  color: showLyrics ? 'var(--color-primary)' : 'var(--text-subdued)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM6 4h6v6h6v10H6V4zm2 14h8v-2H8v2zm0-4h8v-2H8v2zm0-4h4V8H8v2z" />
                </svg>
                Letra
              </button>
            </>
          ) : null}
        </div>
      )}

      {showLyrics && activeSong && (
        <LyricsView
          song={activeSong.song as unknown as LibrarySong}
          audioRef={audioRef}
          onClose={() => setShowLyrics(false)}
        />
      )}

      {/* Modal agregar canciones */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 12,
              padding: 24,
              width: 420,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Agregar canciones</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedIds(new Set())
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-subdued)',
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                flex: 1,
              }}
            >
              {libraryForAdd
                .filter((s) => !songs.some((ps) => ps.song.id === s.id))
                .map((s) => (
                  <label
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: selectedIds.has(s.id) ? 'rgba(168,85,247,0.1)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => {
                        const next = new Set(selectedIds)
                        if (next.has(s.id)) {
                          next.delete(s.id)
                        } else {
                          next.add(s.id)
                        }
                        setSelectedIds(next)
                      }}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--text-base)' }}>{s.title}</span>
                  </label>
                ))}
            </div>
            <button
              disabled={selectedIds.size === 0 || adding}
              onClick={async () => {
                if (!id) {
                  return
                }
                setAdding(true)
                for (const songId of selectedIds) {
                  await addSongToPlaylist(id, songId).catch(() => {})
                }
                const updated = await getPlaylist(id)
                setPlaylist(updated)
                setShowAddModal(false)
                setSelectedIds(new Set())
                setAdding(false)
              }}
              style={{
                padding: '10px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                background: 'var(--color-primary)',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                opacity: selectedIds.size === 0 || adding ? 0.5 : 1,
              }}
            >
              {adding
                ? 'Agregando...'
                : `Agregar ${selectedIds.size} canción${selectedIds.size !== 1 ? 'es' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
