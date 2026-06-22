import { useState } from 'react'
import { updateMixProject, startMixExport } from '../../api/modules/mix.api'
import type { MixProject } from '../../api/modules/mix.api'
import { useMixExport } from '../../hooks/useMixExport'

interface SaveMixModalProps {
  mix: MixProject
  onClose: () => void
  onRenamed: (updated: MixProject) => void
}

const TAG_GROUPS = [
  {
    label: 'Género',
    tags: ['lofi','pop','reggaeton','rock','bachata','kpop','jazz','cumbia','ranchera','techno','electronic','hip-hop','r&b','folk','salsa','classical'],
  },
  {
    label: 'Mood',
    tags: ['chill','sad','happy','energetic','romantic','melancholic','nostalgic','dark','angry','playful','hopeful','motivated'],
  },
  {
    label: 'Tempo',
    tags: ['slow','medium','fast'],
  },
]

// IDs fijos que coinciden con los Tag del backend (los mismos que usa create-page)
const TAG_NAME_TO_ID: Record<string, number> = {
  lofi:1, pop:2, reggaeton:3, rock:4, bachata:5, kpop:6, jazz:7, cumbia:8,
  ranchera:9, techno:10, electronic:11, 'hip-hop':12, 'r&b':13, folk:14,
  salsa:15, classical:16, chill:17, sad:18, happy:19, energetic:20,
  romantic:21, melancholic:22, nostalgic:23, dark:24, angry:25, playful:26,
  hopeful:27, motivated:28, slow:29, medium:30, fast:31,
}

export default function SaveMixModal({ mix, onClose, onRenamed }: SaveMixModalProps) {
  const suggestedName = mix.title.replace(/^Mix\s*-\s*/i, '').trim()
  const [name, setName] = useState(suggestedName)
  const [description, setDescription] = useState(mix.description ?? '')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [starting, setStarting] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [exportId, setExportId] = useState<string | null>(null)
  const { status, downloadUrl, error } = useMixExport(exportId)

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Ponle un nombre a tu mix.')
      return
    }
    setNameError(null)
    setStarting(true)
    try {
      const tagIds = selectedTags
        .map((t) => TAG_NAME_TO_ID[t])
        .filter(Boolean)

      const updated = await updateMixProject(mix.id, {
        title: `Mix - ${trimmed}`,
        description: description.trim() || undefined,
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      })
      onRenamed(updated)

      const res = await startMixExport(mix.id, { format: 'mp3', quality: '320k' })
      setExportId(res.export_id)
    } catch {
      setNameError('No se pudo guardar el mix. Intenta de nuevo.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Guardar mix</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subdued)', fontSize: 20 }}>×</button>
        </div>

        {!exportId ? (
          <>
            {/* Nombre */}
            <label style={{ fontSize: 13, color: 'var(--text-subdued)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
              Nombre del mix
              <input
                type="text"
                autoFocus
                placeholder="Ej: Noche de verano"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-base)', fontSize: 14 }}
              />
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-subdued)', margin: '0 0 14px' }}>
              Se guardará como <strong>Mix - {name.trim() || '...'}</strong>
            </p>

            {/* Descripción */}
            <label style={{ fontSize: 13, color: 'var(--text-subdued)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              Descripción <span style={{ fontSize: 11, fontWeight: 400 }}>(opcional)</span>
              <textarea
                placeholder="Ej: Mix de bachata y reggaeton para una noche de fiesta..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-base)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </label>

            {/* Tags */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-subdued)', margin: '0 0 10px', fontWeight: 600 }}>
                Tags <span style={{ fontSize: 11, fontWeight: 400 }}>(opcional)</span>
              </p>
              {TAG_GROUPS.map((group) => (
                <div key={group.label} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-subdued)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {group.label}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 500,
                          fontSize: 12,
                          fontWeight: selectedTags.includes(tag) ? 700 : 400,
                          background: selectedTags.includes(tag) ? 'rgba(168,85,247,0.2)' : 'var(--bg-card-hover)',
                          color: selectedTags.includes(tag) ? 'var(--color-primary)' : 'var(--text-subdued)',
                          border: selectedTags.includes(tag) ? '1px solid rgba(168,85,247,0.5)' : '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {nameError && (
              <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }} role="alert">{nameError}</p>
            )}

            <button
              onClick={handleSave}
              disabled={starting || !name.trim()}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                color: 'white', border: 'none',
                cursor: starting || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: starting || !name.trim() ? 0.6 : 1,
              }}
            >
              {starting ? 'Iniciando...' : 'Guardar (3 créditos)'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            {status === 'ready' && downloadUrl ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: 4 }}>¡Mix guardado!</p>
                <p style={{ fontSize: 13, color: 'var(--text-subdued)', marginBottom: 16 }}>
                  Guardado en{' '}
                  <a href="/library" style={{ color: 'var(--color-primary)' }}>Tu biblioteca</a>{' '}
                  como <strong>Mix - {name.trim()}</strong>.
                </p>
                <audio key={downloadUrl} src={downloadUrl} controls autoPlay style={{ width: '100%' }} />
              </>
            ) : status === 'failed' ? (
              <>
                <p style={{ color: '#f87171', marginBottom: 12 }}>Error al guardar{error ? `: ${error}` : '.'}</p>
                <button
                  onClick={() => setExportId(null)}
                  style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', color: 'var(--text-base)' }}
                >
                  Reintentar
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-subdued)', fontSize: 14 }}>Mezclando tu audio… esto puede tardar un minuto 🎚️</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}