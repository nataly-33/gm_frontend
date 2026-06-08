import { useEffect, useState } from 'react'
import { getLibrary } from '../../api/modules/songs.api'
import { getStemJobs } from '../../api/modules/stems.api'
import type { LibrarySong } from '../../api/modules/songs.api'
import type { StemJob } from '../../api/modules/stems.api'
import { addClip } from '../../api/modules/mix.api'
import type { MixClip } from '../../api/modules/mix.api'

interface AddClipModalProps {
  mixId: string
  nextPosition: number
  onAdd: (clip: MixClip) => void
  onClose: () => void
}

type SourceTab = 'library' | 'stems'

export default function AddClipModal({ mixId, nextPosition, onAdd, onClose }: AddClipModalProps) {
  const [tab, setTab]           = useState<SourceTab>('library')
  const [songs, setSongs]       = useState<LibrarySong[]>([])
  const [stemJobs, setStemJobs] = useState<StemJob[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Duración por defecto: primeros 30 segundos del audio
  const DEFAULT_END_MS = 30_000

  useEffect(() => {
    setLoading(true)
    Promise.all([getLibrary(), getStemJobs()])
      .then(([s, j]) => { setSongs(s); setStemJobs(j) })
      .finally(() => setLoading(false))
  }, [])

  async function handleAddSong(song: LibrarySong) {
    setAdding(true)
    setError(null)
    try {
      const clip = await addClip(mixId, {
        song_id: song.id,
        position: nextPosition,
        start_time_ms: 0,
        end_time_ms: DEFAULT_END_MS,
      })
      onAdd(clip)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Error al agregar el clip.')
    } finally {
      setAdding(false)
    }
  }

  async function handleAddStem(stemFileId: string) {
    setAdding(true)
    setError(null)
    try {
      const clip = await addClip(mixId, {
        stem_file_id: stemFileId,
        position: nextPosition,
        start_time_ms: 0,
        end_time_ms: DEFAULT_END_MS,
      })
      onAdd(clip)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Error al agregar el clip.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480, maxHeight: '80vh', background: 'var(--bg-surface)',
          borderRadius: 12, border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Agregar clip</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subdued)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['library', 'stems'] as SourceTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px', border: 'none', background: 'none',
                borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: tab === t ? 'var(--text-base)' : 'var(--text-subdued)',
                fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: 'pointer',
              }}
            >
              {t === 'library' ? 'Biblioteca' : 'Stems separados'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: 13, padding: '10px 20px' }}>
            {error}
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-subdued)', fontSize: 14 }}>Cargando...</div>
          ) : tab === 'library' ? (
            songs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-subdued)', fontSize: 14 }}>No tienes canciones en tu biblioteca.</div>
            ) : songs.map(song => (
              <button
                key={song.id}
                onClick={() => !adding && handleAddSong(song)}
                disabled={adding}
                style={{
                  width: '100%', padding: '10px 20px', background: 'none',
                  border: 'none', cursor: adding ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left', transition: 'background 0.1s',
                  opacity: adding ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!adding) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)' }}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 4, background: 'var(--bg-card-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-primary)', flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-subdued)' }}>
                    {song.tags?.slice(0, 3).map(t => t.name).join(', ') || 'Sin tags'}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-subdued)', flexShrink: 0 }}>
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
            ))
          ) : (
            stemJobs.filter(j => j.status === 'completed' && j.stem_files && j.stem_files.length > 0).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-subdued)', fontSize: 14 }}>No tienes stems separados disponibles.</div>
            ) : stemJobs
              .filter(j => j.status === 'completed' && j.stem_files && j.stem_files.length > 0)
              .flatMap(j => j.stem_files!.map(sf => ({ job: j, sf })))
              .map(({ job, sf }) => (
                <button
                  key={sf.id}
                  onClick={() => !adding && handleAddStem(sf.id)}
                  disabled={adding}
                  style={{
                    width: '100%', padding: '10px 20px', background: 'none',
                    border: 'none', cursor: adding ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    textAlign: 'left', transition: 'background 0.1s',
                    opacity: adding ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!adding) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)' }}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 4, background: 'rgba(74,222,128,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4ade80', flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  }}>
                    {sf.stem_type.replace('no_vocals', 'kara').slice(0, 4)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-base)' }}>
                      {sf.stem_type.replace('no_vocals', 'Karaoke').replace('_', ' ')}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-subdued)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.source_filename}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-subdued)', flexShrink: 0 }}>
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
