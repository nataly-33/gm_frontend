import type { MixClip } from '../../api/modules/mix.api'

interface ClipTimelineProps {
  clips: MixClip[]
  selectedClipId: string | null
  onSelectClip: (id: string) => void
}

export default function ClipTimeline({ clips, selectedClipId, onSelectClip }: ClipTimelineProps) {
  if (clips.length === 0) {
    return (
      <div style={{
        height: 72, borderRadius: 8,
        background: 'var(--bg-card-hover)',
        border: '2px dashed var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-subdued)' }}>
          Agrega clips desde la biblioteca para armar tu mix
        </span>
      </div>
    )
  }

  const totalMs = clips.reduce((acc, c) => acc + c.duration_ms, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Timeline bar */}
      <div style={{ display: 'flex', gap: 3, height: 48, borderRadius: 8, overflow: 'hidden' }}>
        {clips
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((clip, idx) => {
            const widthPct = totalMs > 0 ? (clip.duration_ms / totalMs) * 100 : 100 / clips.length
            const isSelected = clip.id === selectedClipId
            const colors = [
              '#A855F7', '#7C3AED', '#6D28D9', '#5B21B6',
              '#4C1D95', '#8B5CF6', '#9333EA', '#7E22CE',
            ]
            const color = colors[idx % colors.length]

            return (
              <div
                key={clip.id}
                onClick={() => onSelectClip(clip.id)}
                title={`Clip ${clip.position + 1}: ${clip.song_detail?.title ?? 'Sin título'} (${Math.round(clip.duration_ms / 1000)}s)`}
                style={{
                  width: `${widthPct}%`,
                  minWidth: 32,
                  background: isSelected ? 'white' : color,
                  opacity: isSelected ? 1 : 0.8,
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  border: isSelected ? '2px solid white' : '2px solid transparent',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isSelected ? color : 'white',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  padding: '0 6px',
                }}>
                  {idx + 1}
                </span>
              </div>
            )
          })}
      </div>

      {/* Duration labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-subdued)' }}>
        <span>0:00</span>
        <span>{Math.floor(totalMs / 60000)}:{String(Math.floor((totalMs % 60000) / 1000)).padStart(2, '0')}</span>
      </div>
    </div>
  )
}
