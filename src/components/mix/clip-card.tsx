import type { MixClip } from '../../api/modules/mix.api'
import { updateClip, deleteClip } from '../../api/modules/mix.api'

interface FadeControlProps {
  label: string
  value: number
  onChange: (v: number) => void
}

function FadeControl({ label, value, onChange }: FadeControlProps) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 12,
        color: 'var(--text-subdued)',
      }}
    >
      {label}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          min={0}
          max={5000}
          step={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--color-primary)' }}
        />
        <span
          style={{ fontSize: 11, minWidth: 40, textAlign: 'right', color: 'var(--text-subdued)' }}
        >
          {value}ms
        </span>
      </div>
    </label>
  )
}

interface ClipCardProps {
  clip: MixClip
  mixId: string
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updated: MixClip) => void
  onDelete: () => void
}

export default function ClipCard({
  clip,
  mixId,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: ClipCardProps) {
  const durationSec = Math.round(clip.duration_ms / 1000)
  const title = clip.song_detail?.title ?? `Clip #${clip.position + 1}`

  async function handleFieldUpdate(field: string, value: number) {
    try {
      const updated = await updateClip(mixId, clip.id, { [field]: value })
      onUpdate(updated)
    } catch {
      /* silencioso */
    }
  }

  async function handleDelete() {
    try {
      await deleteClip(mixId, clip.id)
      onDelete()
    } catch {
      /* silencioso */
    }
  }

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(168,85,247,0.15)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--bg-card-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: isSelected ? 'var(--color-primary)' : 'var(--text-subdued)',
              flexShrink: 0,
            }}
          >
            {clip.position + 1}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-base)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 160,
            }}
          >
            {title}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-subdued)',
            padding: 4,
            borderRadius: 4,
          }}
          title="Eliminar clip"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>

      {/* Duration bar */}
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--bg-card-hover)',
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            background: isSelected ? 'var(--color-primary)' : '#555',
            width: '100%',
          }}
        />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-subdued)', margin: 0 }}>
        {(clip.start_time_ms / 1000).toFixed(1)}s – {(clip.end_time_ms / 1000).toFixed(1)}s (
        {durationSec}s)
      </p>

      {/* Detail controls — visible cuando el clip está seleccionado */}
      {isSelected && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontSize: 12,
                color: 'var(--text-subdued)',
              }}
            >
              Inicio (ms)
              <input
                type="number"
                min={0}
                max={clip.end_time_ms - 1}
                value={clip.start_time_ms}
                onChange={(e) => handleFieldUpdate('start_time_ms', Number(e.target.value))}
                style={{
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '6px 8px',
                  color: 'var(--text-base)',
                  fontSize: 13,
                }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontSize: 12,
                color: 'var(--text-subdued)',
              }}
            >
              Fin (ms)
              <input
                type="number"
                min={clip.start_time_ms + 1}
                value={clip.end_time_ms}
                onChange={(e) => handleFieldUpdate('end_time_ms', Number(e.target.value))}
                style={{
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '6px 8px',
                  color: 'var(--text-base)',
                  fontSize: 13,
                }}
              />
            </label>
          </div>

          <FadeControl
            label="Fade in"
            value={clip.fade_in_ms}
            onChange={(v) => handleFieldUpdate('fade_in_ms', v)}
          />
          <FadeControl
            label="Fade out"
            value={clip.fade_out_ms}
            onChange={(v) => handleFieldUpdate('fade_out_ms', v)}
          />

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: 'var(--text-subdued)',
            }}
          >
            Volumen
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={clip.volume}
                onChange={(e) => handleFieldUpdate('volume', Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-primary)' }}
              />
              <span
                style={{
                  fontSize: 11,
                  minWidth: 36,
                  textAlign: 'right',
                  color: 'var(--text-subdued)',
                }}
              >
                {Math.round(clip.volume * 100)}%
              </span>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}
