import { useEffect, useRef, useState } from 'react'
import type { LyricTimestamp } from '../../types'

interface Props {
  timestamps: LyricTimestamp[]
  audioRef: React.RefObject<HTMLAudioElement | null>
  /** Contenedor con overflow-y donde viven las líneas (para el auto-scroll). */
  scrollRef?: React.RefObject<HTMLDivElement | null>
}

// Divide una frase larga en sub-líneas visuales (máx 2), prefiriendo cortar en
// una coma cercana a la mitad; si no hay coma, corta en el espacio más cercano.
// El texto sigue siendo una sola línea activa; solo se apila visualmente.
function splitLine(text: string): string[] {
  const MAX = 40
  if (text.length <= MAX) return [text]

  const commas: number[] = []
  for (let i = 0; i < text.length; i++) if (text[i] === ',') commas.push(i)

  const mid = text.length / 2

  // Cortar en la coma más cercana al centro
  if (commas.length > 0) {
    const best = commas.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))
    return [text.slice(0, best + 1).trim(), text.slice(best + 1).trim()].filter(Boolean)
  }

  // Sin comas: cortar en el espacio más cercano al centro
  let splitAt = -1
  let bestDist = Infinity
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') {
      const d = Math.abs(i - mid)
      if (d < bestDist) {
        bestDist = d
        splitAt = i
      }
    }
  }
  if (splitAt === -1) return [text]
  return [text.slice(0, splitAt).trim(), text.slice(splitAt + 1).trim()]
}

// Líneas de letra sincronizadas para el modo karaoke.
// - Auto-centra la línea activa (estilo Apple Music / Spotify).
// - Si el usuario scrollea a mano, pausa el auto-centrado y lo reanuda solo.
// - Al pausar / reproducir / saltar el audio, vuelve a centrar de inmediato.
export default function KaraokeLines({ timestamps, audioRef, scrollRef }: Props) {
  const [activeIdx, setActiveIdx] = useState(-1)
  const [autoScroll, setAutoScroll] = useState(true)
  const activeRef = useRef<HTMLDivElement>(null)
  const isProgrammatic = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Sincronizar línea activa con el audio (cada 100ms) ─────────────────────
  useEffect(() => {
    if (timestamps.length === 0) return
    const id = setInterval(() => {
      const t = audioRef.current?.currentTime ?? 0
      let found = -1
      for (let i = timestamps.length - 1; i >= 0; i--) {
        if (t >= timestamps[i].start) {
          found = i
          break
        }
      }
      setActiveIdx((prev) => (prev === found ? prev : found))
    }, 100)
    return () => clearInterval(id)
  }, [timestamps, audioRef])

  // ── Auto-centrar la línea activa ───────────────────────────────────────────
  useEffect(() => {
    if (!autoScroll || activeIdx < 0) return
    const el = activeRef.current
    if (!el) return

    isProgrammatic.current = true
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    clearTimeout(programmaticTimer.current)
    // Mientras dura la animación smooth, ignorar los eventos de scroll que dispara
    programmaticTimer.current = setTimeout(() => {
      isProgrammatic.current = false
    }, 650)
  }, [activeIdx, autoScroll])

  // ── Detectar scroll manual del usuario → pausar auto-centrado ──────────────
  useEffect(() => {
    const container = scrollRef?.current
    if (!container) return
    const onScroll = () => {
      if (isProgrammatic.current) return
      setAutoScroll(false)
      clearTimeout(resumeTimer.current)
      // Reanudar el auto-centrado tras unos segundos sin tocar
      resumeTimer.current = setTimeout(() => setAutoScroll(true), 4000)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [scrollRef])

  // ── Recentrar de inmediato al pausar / reproducir / saltar ─────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const recenter = () => {
      clearTimeout(resumeTimer.current)
      setAutoScroll(true)
    }
    audio.addEventListener('play', recenter)
    audio.addEventListener('pause', recenter)
    audio.addEventListener('seeked', recenter)
    return () => {
      audio.removeEventListener('play', recenter)
      audio.removeEventListener('pause', recenter)
      audio.removeEventListener('seeked', recenter)
    }
  }, [audioRef])

  useEffect(() => {
    return () => {
      clearTimeout(resumeTimer.current)
      clearTimeout(programmaticTimer.current)
    }
  }, [])

  return (
    <>
      {timestamps.map((ts, i) => {
        const isActive = i === activeIdx
        const dist = Math.abs(i - activeIdx)

        // Marcadores de sección tipo "♪ Coro ♪"
        if (/^♪/.test(ts.text) && ts.text.endsWith('♪')) {
          return (
            <div
              key={i}
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                color: 'rgba(74,222,128,0.55)',
                margin: '24px 0 8px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                width: '100%',
                textAlign: 'center' as const,
                opacity: dist <= 1 ? 1 : 0.4,
                transition: 'opacity 0.5s ease',
              }}
            >
              {ts.text}
            </div>
          )
        }

        const opacity = isActive ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.28 : 0.14
        const blur = isActive ? 0 : dist === 1 ? 0.6 : dist === 2 ? 1.2 : 1.8
        const fontSize = isActive ? 38 : dist === 1 ? 24 : 19
        const sublines = splitLine(ts.text)

        return (
          <div
            key={i}
            ref={isActive ? activeRef : null}
            style={{
              width: '100%',
              textAlign: 'center',
              lineHeight: 1.22,
              marginBottom: 24,
              fontWeight: isActive ? 800 : 600,
              color: '#ffffff',
              opacity,
              fontSize,
              filter: blur ? `blur(${blur}px)` : 'none',
              transform: isActive ? 'scale(1)' : 'scale(0.97)',
              transformOrigin: 'center',
              transition:
                'opacity 0.6s ease, filter 0.6s ease, font-size 0.35s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)',
              cursor: 'default',
            }}
          >
            {sublines.map((line, j) => (
              <div key={j} style={{ display: 'block' }}>
                {line}
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}
