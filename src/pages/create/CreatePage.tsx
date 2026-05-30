// ─────────────────────────────────────────────────────────────────────────────
// src/pages/create/CreatePage.tsx
// Formulario de generación con 3 modos, selector de duración y polling.
// El payload enviado al backend contiene ÚNICAMENTE las llaves del modo activo.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import {
  generateSong,
  getSongJob,
  getSongPlayUrl,
  getSongThumbnailUrl,
} from '../../api/modules/songs.api'
import type { JobStatus } from '../../api/modules/songs.api'
import styles from './CreatePage.module.css'

// ── Constantes ────────────────────────────────────────────────────────────────

const POLLING_INTERVAL_MS = 5_000

type Mode = 'description' | 'exact_lyrics' | 'auto_lyrics'

const MODES: { id: Mode; label: string; hint: string }[] = [
  {
    id:    'description',
    label: 'Solo Descripción',
    hint:  'La IA elige letra e instrumentos',
  },
  {
    id:    'exact_lyrics',
    label: 'Letra Exacta',
    hint:  'Tú escribes la letra completa',
  },
  {
    id:    'auto_lyrics',
    label: 'Letra Autogenerada',
    hint:  'Describes de qué trata, la IA redacta',
  },
]

interface DurationOption {
  label: string
  value: number
}

const DURATION_OPTIONS: DurationOption[] = [
  { label: '30-40 seg', value: 40.0 },
  { label: '1 min',     value: 60.0 },
  { label: '2:30+ min', value: 150.0 },
]

type GenerationStage =
  | 'idle'
  | 'submitting'
  | 'polling'
  | 'ready'
  | 'no_credits'
  | 'error'

const STAGE_LABELS: Record<GenerationStage, string> = {
  idle:       '',
  submitting: 'Enviando tu solicitud...',
  polling:    'Generando tu canción… esto puede tardar un minuto 🎶',
  ready:      '¡Lista! 🎉',
  no_credits: 'Créditos insuficientes',
  error:      'Ocurrió un error',
}

interface ReadySong {
  songId: string
  playUrl: string
  thumbnailUrl: string
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  // ── Modo y duración ────────────────────────────────────────
  const [mode, setMode]             = useState<Mode>('description')
  const [duration, setDuration]     = useState<number>(40.0)

  // ── Campos del formulario ──────────────────────────────────
  const [title,           setTitle]           = useState('')
  const [description,     setDescription]     = useState('')
  const [prompt,          setPrompt]          = useState('')
  const [lyrics,          setLyrics]          = useState('')
  const [describedLyrics, setDescribedLyrics] = useState('')

  // ── Estado de generación ───────────────────────────────────
  const [stage,    setStage]    = useState<GenerationStage>('idle')
  const [ready,    setReady]    = useState<ReadySong | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => stopPolling(), [])

  // ── Polling ────────────────────────────────────────────────
  function startPolling(jobId: string, songId: string) {
    setStage('polling')
    pollingRef.current = setInterval(async () => {
      try {
        const job = await getSongJob(jobId)
        await handleJobStatus(job.status, songId)
      } catch {
        stopPolling()
        setStage('error')
        setErrorMsg('Error al consultar el estado del trabajo.')
      }
    }, POLLING_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  async function handleJobStatus(status: JobStatus, songId: string) {
    if (status === 'no_credits') {
      stopPolling(); setStage('no_credits'); return
    }
    if (status === 'ready') {
      stopPolling()
      try {
        const [playUrl, thumbnailUrl] = await Promise.all([
          getSongPlayUrl(songId),
          getSongThumbnailUrl(songId),
        ])
        setReady({ songId, playUrl, thumbnailUrl })
        setStage('ready')
      } catch {
        setStage('error')
        setErrorMsg('La canción está lista pero no se pudo cargar el audio.')
      }
      return
    }
    if (status === 'error') {
      stopPolling()
      setStage('error')
      setErrorMsg('El servidor reportó un error al generar la canción.')
    }
    // 'processing' → seguimos esperando
  }

  // ── Validación por modo ────────────────────────────────────
  function validate(): string | null {
    if (!title.trim()) return 'El título es obligatorio.'
    if (mode === 'description' && !description.trim())
      return 'Escribe una descripción para tu canción.'
    if (mode === 'exact_lyrics') {
      if (!prompt.trim())  return 'Indica el estilo musical (prompt).'
      if (!lyrics.trim())  return 'Escribe la letra exacta de la canción.'
    }
    if (mode === 'auto_lyrics') {
      if (!prompt.trim())          return 'Indica el estilo musical (prompt).'
      if (!describedLyrics.trim()) return 'Describe de qué trata la canción.'
    }
    return null
  }

  // ── Construcción del payload ───────────────────────────────
  // MUY IMPORTANTE: solo incluye las llaves del modo activo.
  function buildPayload(): Record<string, unknown> {
    const base = { title: title.trim(), audio_duration: duration, instrumental: false }

    if (mode === 'description') {
      return { ...base, description: description.trim() }
    }
    if (mode === 'exact_lyrics') {
      return { ...base, prompt: prompt.trim(), lyrics: lyrics.trim() }
    }
    // mode === 'auto_lyrics'
    return { ...base, prompt: prompt.trim(), described_lyrics: describedLyrics.trim() }
  }

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setErrorMsg(validationError); return }

    setErrorMsg(null)
    setReady(null)
    setStage('submitting')

    try {
      const payload = buildPayload()
      const res = await generateSong(payload as Parameters<typeof generateSong>[0])

      // Primer check inmediato (entorno dev con Celery eager)
      const firstCheck = await getSongJob(res.job_id)
      if (firstCheck.status === 'ready') {
        await handleJobStatus('ready', res.song_id)
      } else if (firstCheck.status === 'no_credits') {
        setStage('no_credits')
      } else {
        startPolling(res.job_id, res.song_id)
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 402) {
        setStage('no_credits')
      } else {
        setStage('error')
        setErrorMsg('No se pudo iniciar la generación. Intenta de nuevo.')
      }
    }
  }

  function handleReset() {
    stopPolling()
    setStage('idle')
    setReady(null)
    setErrorMsg(null)
    setTitle('')
    setDescription('')
    setPrompt('')
    setLyrics('')
    setDescribedLyrics('')
  }

  // Al cambiar de modo, limpiamos el error de validación
  function handleModeChange(m: Mode) {
    setMode(m)
    setErrorMsg(null)
  }

  const isBusy = stage === 'submitting' || stage === 'polling'

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Crear canción</h1>
          <p className={styles.pageSubtitle}>
            Elige un modo, rellena los campos y deja que la IA haga el resto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* ── Tabs de modo ──────────────────────────────────── */}
          <div className={styles.tabs} role="tablist" aria-label="Modo de creación">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                disabled={isBusy}
                onClick={() => handleModeChange(m.id)}
                className={`${styles.tab} ${mode === m.id ? styles.tabActive : ''}`}
              >
                <span className={styles.tabLabel}>{m.label}</span>
                <span className={styles.tabHint}>{m.hint}</span>
              </button>
            ))}
          </div>

          {/* ── Campos comunes: título ─────────────────────────── */}
          <div className={styles.fieldGroup}>
            <label htmlFor="title" className={styles.label}>
              Título de la canción
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ej: Midnight Echoes"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isBusy}
              className={styles.input}
            />
          </div>

          {/* ── Campos por modo ───────────────────────────────── */}
          {mode === 'description' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="description" className={styles.label}>
                Descripción
                <span className={styles.labelHint}>¿Qué quieres expresar con esta canción?</span>
              </label>
              <textarea
                id="description"
                placeholder="Ej: Una canción melancólica sobre un viaje nocturno en tren, con sensación de soledad y esperanza..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isBusy}
                rows={5}
                className={styles.textarea}
              />
            </div>
          )}

          {(mode === 'exact_lyrics' || mode === 'auto_lyrics') && (
            <div className={styles.fieldGroup}>
              <label htmlFor="prompt" className={styles.label}>
                Estilo musical
                <span className={styles.labelHint}>Género, BPM, instrumentos, mood...</span>
              </label>
              <input
                id="prompt"
                type="text"
                placeholder="Ej: Synthwave melancólico, 110 BPM, sintetizadores y bajo pulsante"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={isBusy}
                className={styles.input}
              />
            </div>
          )}

          {mode === 'exact_lyrics' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="lyrics" className={styles.label}>
                Letra exacta
                <span className={styles.labelHint}>La IA cantará exactamente esto</span>
              </label>
              <textarea
                id="lyrics"
                placeholder={'Verso 1:\n...\n\nCoro:\n...'}
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                disabled={isBusy}
                rows={7}
                className={styles.textarea}
              />
            </div>
          )}

          {mode === 'auto_lyrics' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="described_lyrics" className={styles.label}>
                ¿De qué trata la letra?
                <span className={styles.labelHint}>La IA escribirá la letra basándose en esto</span>
              </label>
              <textarea
                id="described_lyrics"
                placeholder="Ej: Una historia de dos personas que se separan en un aeropuerto pero saben que volverán a encontrarse..."
                value={describedLyrics}
                onChange={e => setDescribedLyrics(e.target.value)}
                disabled={isBusy}
                rows={5}
                className={styles.textarea}
              />
            </div>
          )}

          {/* ── Selector de duración ──────────────────────────── */}
          <div className={styles.fieldGroup}>
            <span className={styles.label}>Duración aproximada</span>
            <div className={styles.durationChips}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setDuration(opt.value)}
                  className={`${styles.chip} ${duration === opt.value ? styles.chipActive : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Error de validación ───────────────────────────── */}
          {errorMsg && stage === 'idle' && (
            <p className={styles.validationMsg} role="alert">{errorMsg}</p>
          )}

          {/* ── Submit ───────────────────────────────────────── */}
          <button type="submit" disabled={isBusy} className={styles.submitBtn}>
            {isBusy
              ? <span className={styles.spinner} aria-hidden="true" />
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
            }
            {isBusy ? 'Generando...' : 'Generar canción'}
          </button>
        </form>

        {/* ── Status card ─────────────────────────────────────── */}
        {stage !== 'idle' && (
          <div
            className={`${styles.statusCard} ${
              stage === 'no_credits' || stage === 'error' ? styles.statusError  :
              stage === 'ready'                           ? styles.statusSuccess :
              styles.statusLoading
            }`}
          >
            {isBusy && <span className={styles.spinnerLarge} />}
            {stage === 'ready' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            {(stage === 'no_credits' || stage === 'error') && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={styles.statusIcon}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            )}

            <div className={styles.statusText}>
              <strong>{STAGE_LABELS[stage]}</strong>
              {stage === 'no_credits' && (
                <span>No tienes suficientes créditos. Considera hacer upgrade a un plan Pro.</span>
              )}
              {stage === 'error' && errorMsg && <span>{errorMsg}</span>}
              {stage === 'polling' && (
                <span>Puedes esperar aquí. Te avisaremos cuando esté lista.</span>
              )}
            </div>

            {(stage === 'ready' || stage === 'no_credits' || stage === 'error') && (
              <button onClick={handleReset} className={styles.resetBtn}>
                Nueva canción
              </button>
            )}
          </div>
        )}

        {/* ── Reproductor de resultado ────────────────────────── */}
        {stage === 'ready' && ready && (
          <div className={styles.resultCard}>
            {ready.thumbnailUrl && (
              <img
                src={ready.thumbnailUrl}
                alt="Portada de la canción generada"
                className={styles.thumbnail}
              />
            )}
            <div className={styles.resultInfo}>
              <p className={styles.resultLabel}>{title || 'Tu canción está lista'}</p>
              <audio
                key={ready.playUrl}
                src={ready.playUrl}
                controls
                autoPlay
                className={styles.audioPlayer}
              />
              <p className={styles.resultHint}>
                Guardada en{' '}
                <a href="/library" className={styles.resultLink}>Tu biblioteca</a>.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function isAxiosError(err: unknown): err is { response?: { status: number } } {
  return typeof err === 'object' && err !== null && 'response' in err
}