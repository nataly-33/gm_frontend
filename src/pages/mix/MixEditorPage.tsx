import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMixProject, updateMixProject, reorderClips, startMixExport } from '../../api/modules/mix.api'
import type { MixProject, MixClip } from '../../api/modules/mix.api'
import { useMixExport } from '../../hooks/useMixExport'
import ClipTimeline from '../../components/mix/ClipTimeline'
import ClipCard from '../../components/mix/ClipCard'
import AddClipModal from '../../components/mix/AddClipModal'

function ExportModal({ mixId, onClose }: { mixId: string; onClose: () => void }) {
  const [format, setFormat]   = useState<'mp3' | 'wav'>('mp3')
  const [quality, setQuality] = useState('320k')
  const [exportId, setExportId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const { status, downloadUrl, error } = useMixExport(exportId)

  async function handleExport() {
    setStarting(true)
    try {
      const res = await startMixExport(mixId, { format, quality })
      setExportId(res.export_id)
    } catch {
      setStarting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 360, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Exportar mix</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subdued)', fontSize: 20 }}>×</button>
        </div>

        {!exportId ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'var(--text-subdued)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Formato
                <select value={format} onChange={e => setFormat(e.target.value as 'mp3' | 'wav')}
                  style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-base)', fontSize: 14 }}>
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV (lossless)</option>
                </select>
              </label>
              {format === 'mp3' && (
                <label style={{ fontSize: 13, color: 'var(--text-subdued)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  Calidad
                  <select value={quality} onChange={e => setQuality(e.target.value)}
                    style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-base)', fontSize: 14 }}>
                    <option value="128k">128 kbps</option>
                    <option value="320k">320 kbps (recomendado)</option>
                  </select>
                </label>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={starting}
              style={{ width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)', color: 'white', border: 'none', cursor: 'pointer', opacity: starting ? 0.6 : 1 }}
            >
              {starting ? 'Iniciando...' : 'Exportar (3 créditos)'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            {status === 'ready' && downloadUrl ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: 16 }}>¡Mix listo!</p>
                <a
                  href={downloadUrl}
                  download
                  style={{ display: 'block', padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                >
                  ⬇ Descargar {format.toUpperCase()}
                </a>
              </>
            ) : status === 'failed' ? (
              <>
                <p style={{ color: '#f87171', marginBottom: 12 }}>Error al exportar: {error}</p>
                <button onClick={() => setExportId(null)} style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', color: 'var(--text-base)' }}>
                  Reintentar
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-subdued)', fontSize: 14 }}>Procesando tu mix...</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function MixEditorPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [mix, setMix]                   = useState<MixProject | null>(null)
  const [loading, setLoading]           = useState(true)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExport, setShowExport]     = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft]     = useState('')

  useEffect(() => {
    if (!id) return
    getMixProject(id)
      .then(m => { setMix(m); setTitleDraft(m.title) })
      .finally(() => setLoading(false))
  }, [id])

  async function saveTitle() {
    if (!mix || !titleDraft.trim() || titleDraft === mix.title) { setEditingTitle(false); return }
    const updated = await updateMixProject(mix.id, { title: titleDraft.trim() })
    setMix(updated)
    setEditingTitle(false)
  }

  function handleClipAdded(clip: MixClip) {
    if (!mix) return
    setMix(prev => prev ? { ...prev, clips: [...prev.clips, clip], clip_count: prev.clip_count + 1 } : prev)
    setSelectedClipId(clip.id)
    setShowAddModal(false)
  }

  function handleClipUpdated(updated: MixClip) {
    if (!mix) return
    setMix(prev => prev ? { ...prev, clips: prev.clips.map(c => c.id === updated.id ? updated : c) } : prev)
  }

  function handleClipDeleted(clipId: string) {
    if (!mix) return
    setMix(prev => prev ? { ...prev, clips: prev.clips.filter(c => c.id !== clipId), clip_count: Math.max(0, prev.clip_count - 1) } : prev)
    if (selectedClipId === clipId) setSelectedClipId(null)
  }

  async function handleReorder(fromIdx: number, toIdx: number) {
    if (!mix) return
    const newClips = [...mix.clips].sort((a, b) => a.position - b.position)
    const [moved]  = newClips.splice(fromIdx, 1)
    newClips.splice(toIdx, 0, moved)
    const reordered = newClips.map((c, i) => ({ ...c, position: i }))
    setMix(prev => prev ? { ...prev, clips: reordered } : prev)
    await reorderClips(mix.id, reordered.map(c => c.id))
  }

  if (loading) {
    return <div style={{ padding: '28px 32px', color: 'var(--text-subdued)', fontSize: 14 }}>Cargando editor...</div>
  }

  if (!mix) {
    return (
      <div style={{ padding: '28px 32px', color: 'var(--text-base)' }}>
        <p style={{ color: '#fca5a5' }}>Proyecto no encontrado.</p>
        <button onClick={() => navigate('/mix')} style={{ marginTop: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          ← Volver a Mix
        </button>
      </div>
    )
  }

  const sortedClips = [...mix.clips].sort((a, b) => a.position - b.position)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: 16, color: 'var(--text-base)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate('/mix')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subdued)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '6px 0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
          Mix
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        {editingTitle ? (
          <input
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            autoFocus
            style={{ fontSize: 18, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid var(--color-primary)', color: 'var(--text-base)', outline: 'none', minWidth: 200 }}
          />
        ) : (
          <h1
            onClick={() => setEditingTitle(true)}
            style={{ fontSize: 18, fontWeight: 700, margin: 0, cursor: 'text', flexShrink: 0 }}
            title="Haz clic para editar el título"
          >
            {mix.title}
          </h1>
        )}

        {mix.bpm && <span style={{ fontSize: 13, color: 'var(--text-subdued)' }}>{mix.bpm} BPM</span>}

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowExport(true)}
          style={{ padding: '8px 18px', borderRadius: 500, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Exportar
        </button>
      </div>

      {/* Timeline */}
      <div style={{ flexShrink: 0 }}>
        <ClipTimeline
          clips={sortedClips}
          selectedClipId={selectedClipId}
          onSelectClip={id => setSelectedClipId(prev => prev === id ? null : id)}
        />
      </div>

      {/* Editor body: library column + clips column */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, minHeight: 0 }}>
        {/* Left: add clip + clip list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text-subdued)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Clips ({sortedClips.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 500, fontSize: 12, fontWeight: 700, background: 'rgba(168,85,247,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(168,85,247,0.3)', cursor: 'pointer' }}
            >
              + Agregar
            </button>
          </div>

          {sortedClips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-subdued)', fontSize: 13 }}>
              Agrega tu primer clip desde la biblioteca
            </div>
          ) : (
            sortedClips.map(clip => (
              <ClipCard
                key={clip.id}
                clip={clip}
                mixId={mix.id}
                isSelected={selectedClipId === clip.id}
                onSelect={() => setSelectedClipId(prev => prev === clip.id ? null : clip.id)}
                onUpdate={handleClipUpdated}
                onDelete={() => handleClipDeleted(clip.id)}
              />
            ))
          )}
        </div>

        {/* Right: selected clip detail or hint */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedClipId ? (
            (() => {
              const clip = mix.clips.find(c => c.id === selectedClipId)
              if (!clip) return null
              return (
                <>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                    {clip.song_detail?.title ?? `Clip #${clip.position + 1}`}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-subdued)' }}>
                    Clip {clip.position + 1} · {Math.round(clip.duration_ms / 1000)}s de audio
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Inicio (ms)', field: 'start_time_ms', value: clip.start_time_ms, max: clip.end_time_ms - 1 },
                      { label: 'Fin (ms)', field: 'end_time_ms', value: clip.end_time_ms, min: clip.start_time_ms + 1 },
                    ].map(({ label, field, value, ...rest }) => (
                      <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-subdued)' }}>
                        {label}
                        <input
                          type="number"
                          value={value}
                          {...rest}
                          onChange={async e => {
                            const updated = await (await import('../../api/modules/mix.api')).updateClip(mix.id, clip.id, { [field]: Number(e.target.value) })
                            handleClipUpdated(updated)
                          }}
                          style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text-base)', fontSize: 13 }}
                        />
                      </label>
                    ))}
                  </div>
                  {[
                    { label: 'Fade in', field: 'fade_in_ms', value: clip.fade_in_ms },
                    { label: 'Fade out', field: 'fade_out_ms', value: clip.fade_out_ms },
                  ].map(({ label, field, value }) => (
                    <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-subdued)' }}>
                      {label}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="range" min={0} max={5000} step={100} value={value}
                          onChange={async e => {
                            const updated = await (await import('../../api/modules/mix.api')).updateClip(mix.id, clip.id, { [field]: Number(e.target.value) })
                            handleClipUpdated(updated)
                          }}
                          style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: 11, minWidth: 44, color: 'var(--text-subdued)' }}>{value}ms</span>
                      </div>
                    </label>
                  ))}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-subdued)' }}>
                    Volumen
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="range" min={0} max={2} step={0.05} value={clip.volume}
                        onChange={async e => {
                          const updated = await (await import('../../api/modules/mix.api')).updateClip(mix.id, clip.id, { volume: Number(e.target.value) })
                          handleClipUpdated(updated)
                        }}
                        style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: 11, minWidth: 36, color: 'var(--text-subdued)' }}>{Math.round(clip.volume * 100)}%</span>
                    </div>
                  </label>
                </>
              )
            })()
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subdued)', textAlign: 'center', gap: 12 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.4 }}>
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
              <p style={{ fontSize: 14 }}>Selecciona un clip de la izquierda para editar sus parámetros</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddClipModal
          mixId={mix.id}
          nextPosition={sortedClips.length}
          onAdd={handleClipAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showExport && <ExportModal mixId={mix.id} onClose={() => setShowExport(false)} />}
    </div>
  )
}
