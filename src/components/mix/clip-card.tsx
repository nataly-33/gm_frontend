// src/components/mix/clip-card.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import type { MixClip } from '../../api/modules/mix.api'
import { updateClip, deleteClip } from '../../api/modules/mix.api'
import { getSongPlayUrl } from '../../api/modules/songs.api'

interface FadeControlProps {
  label: string
  value: number
  onChange: (v: number) => void
}

function FadeControl({ label, value, onChange }: FadeControlProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-subdued)' }}>
      {label}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range" min={0} max={30000} step={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--color-primary)' }}
        />
        <span style={{ fontSize: 11, minWidth: 40, textAlign: 'right', color: 'var(--text-subdued)' }}>
          {value}ms
        </span>
      </div>
    </label>
  )
}

function ClipTimeInputs({
  clip,
  onCommit,
}: {
  clip: MixClip
  onCommit: (field: string, value: number) => void
}) {
  const [startDraft, setStartDraft] = useState(String(clip.start_time_ms))
  const [endDraft, setEndDraft]     = useState(String(clip.end_time_ms))

  useEffect(() => {
    setStartDraft(String(clip.start_time_ms))
    setEndDraft(String(clip.end_time_ms))
  }, [clip.start_time_ms, clip.end_time_ms])

  function commitStart() {
    const n = Number(startDraft)
    if (Number.isNaN(n)) { setStartDraft(String(clip.start_time_ms)); return }
    const clamped = Math.min(Math.max(n, 0), clip.end_time_ms - 100)
    setStartDraft(String(clamped))
    if (clamped !== clip.start_time_ms) onCommit('start_time_ms', clamped)
  }

  function commitEnd() {
    const n = Number(endDraft)
    if (Number.isNaN(n)) { setEndDraft(String(clip.end_time_ms)); return }
    const clamped = Math.max(n, clip.start_time_ms + 100)
    setEndDraft(String(clamped))
    if (clamped !== clip.end_time_ms) onCommit('end_time_ms', clamped)
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-subdued)' }}>
        Inicio (ms)
        <input
          type="number"
          value={startDraft}
          onChange={(e) => setStartDraft(e.target.value)}
          onBlur={commitStart}
          onKeyDown={(e) => e.key === 'Enter' && commitStart()}
          style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text-base)', fontSize: 13, width: 90 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-subdued)' }}>
        Fin (ms)
        <input
          type="number"
          value={endDraft}
          onChange={(e) => setEndDraft(e.target.value)}
          onBlur={commitEnd}
          onKeyDown={(e) => e.key === 'Enter' && commitEnd()}
          style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', color: 'var(--text-base)', fontSize: 13, width: 90 }}
        />
      </label>
    </div>
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

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ClipCard({ clip, mixId, isSelected, onSelect, onUpdate, onDelete }: ClipCardProps) {
  const title = clip.song_detail?.title ?? `Clip #${clip.position + 1}`

  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const rafRef     = useRef<number>(0)
  const seekingRef = useRef(false)

  const [audioUrl, setAudioUrl]     = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [playing, setPlaying]       = useState(false)
  const [currentSec, setCurrentSec] = useState(0)
  const [duration, setDuration]     = useState(0)

  const startSec     = clip.start_time_ms / 1000
  const endSec       = clip.end_time_ms   / 1000
  const clipDuration = Math.max(endSec - startSec, 0.1)
  const progress     = clipDuration > 0 ? Math.min((currentSec - startSec) / clipDuration, 1) : 0

  useEffect(() => {
    if (!clip.song_detail?.id) return
    setLoadingUrl(true)
    getSongPlayUrl(clip.song_detail.id)
      .then(url => { setAudioUrl(url) })
      .catch(() => setAudioUrl(null))
      .finally(() => setLoadingUrl(false))
  }, [clip.song_detail?.id])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      audioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.min(clip.volume, 1)
  }, [clip.volume])

  useEffect(() => {
    if (playing && audioRef.current) {
      const t = audioRef.current.currentTime
      if (t < startSec || t >= endSec) audioRef.current.currentTime = startSec
    }
  }, [startSec, endSec, playing])

  const tick = useCallback(() => {
    const audio = audioRef.current
    if (!audio || seekingRef.current) return
    const t = audio.currentTime
    if (t >= endSec) {
      audio.currentTime = startSec
      audio.pause()
      setPlaying(false)
      setCurrentSec(startSec)
      return
    }
    setCurrentSec(t)
    rafRef.current = requestAnimationFrame(tick)
  }, [startSec, endSec])

  function stopPlayback() {
    cancelAnimationFrame(rafRef.current)
    audioRef.current?.pause()
    setPlaying(false)
    setCurrentSec(startSec)
  }

  async function handlePlay(e: React.MouseEvent) {
    e.stopPropagation()
    if (!audioUrl) return
    if (playing) { stopPlayback(); return }

    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current

    if (audio.src !== audioUrl) {
      audio.src = audioUrl
      audio.onloadedmetadata = () => setDuration(audio.duration)
    }

    audio.volume = Math.min(clip.volume, 1)
    audio.currentTime = currentSec <= startSec || currentSec >= endSec ? startSec : currentSec

    try {
      await audio.play()
      setPlaying(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.error('Error reproduciendo:', err)
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = startSec + ratio * clipDuration
    setCurrentSec(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  async function handleFieldUpdate(field: string, value: number) {
    try {
      const updated = await updateClip(mixId, clip.id, { [field]: value })
      onUpdate(updated)
    } catch { /* silencioso */ }
  }

  async function handleDelete() {
    stopPlayback()
    try { await deleteClip(mixId, clip.id); onDelete() } catch { /* silencioso */ }
  }

  const elapsed = Math.max(0, currentSec - startSec)

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(168,85,247,0.15)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border)'}`,
        borderRadius: 8, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-card-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
            color: isSelected ? 'var(--color-primary)' : 'var(--text-subdued)',
          }}>
            {clip.position + 1}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-base)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
          }}>
            {title}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subdued)', padding: 4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>

      {/* ── Player bar ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1a1a1a', borderRadius: 6, padding: '6px 10px',
        }}
      >
        <button
          onClick={handlePlay}
          disabled={loadingUrl || !audioUrl}
          style={{
            background: 'none', border: 'none', cursor: loadingUrl || !audioUrl ? 'not-allowed' : 'pointer',
            color: 'white', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0,
            opacity: loadingUrl || !audioUrl ? 0.4 : 1,
          }}
        >
          {loadingUrl ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          ) : playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <span style={{ fontSize: 11, color: '#ccc', flexShrink: 0, minWidth: 32, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(elapsed)}
        </span>

        <div
          onClick={handleSeek}
          style={{
            flex: 1, height: 4, borderRadius: 2,
            background: '#444', cursor: 'pointer', position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`,
            background: 'white', borderRadius: 2,
            transition: playing ? 'none' : 'width 0.1s',
          }} />
          <div style={{
            position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
            left: `${progress * 100}%`,
            width: 10, height: 10, borderRadius: '50%', background: 'white',
            boxShadow: '0 0 0 2px rgba(255,255,255,0.3)',
            pointerEvents: 'none',
          }} />
        </div>

        <span style={{ fontSize: 11, color: '#888', flexShrink: 0, minWidth: 32, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(clipDuration)}
        </span>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#888', flexShrink: 0 }}>
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      </div>

      {/* ── Controles detallados (solo seleccionado) ── */}
      {isSelected && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-subdued)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Corte de audio
          </p>

          <ClipTimeInputs clip={clip} onCommit={handleFieldUpdate} />

          <div style={{ height: 22, borderRadius: 4, background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700 }}>
              ✂ {fmt(clipDuration)} seleccionados · {fmt(startSec)} → {fmt(endSec)}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-subdued)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Transiciones
          </p>
          <FadeControl label="Fade in"  value={clip.fade_in_ms}  onChange={(v) => handleFieldUpdate('fade_in_ms', v)} />
          <FadeControl label="Fade out" value={clip.fade_out_ms} onChange={(v) => handleFieldUpdate('fade_out_ms', v)} />

          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-subdued)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Volumen
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-subdued)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-subdued)', flexShrink: 0 }}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <input
                type="range" min={0} max={1} step={0.05}
                value={Math.min(clip.volume, 1)}
                onChange={(e) => handleFieldUpdate('volume', Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-primary)' }}
              />
              <span style={{ fontSize: 11, minWidth: 36, textAlign: 'right', color: 'var(--text-subdued)' }}>
                {Math.round(Math.min(clip.volume, 1) * 100)}%
              </span>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}