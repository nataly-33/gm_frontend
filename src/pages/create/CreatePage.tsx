// ─────────────────────────────────────────────────────────────────────────────
// src/pages/create/CreatePage.tsx
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
import { isAxiosError } from 'axios'
import { useAuthStore } from '../../store/auth.store'

// ── Constantes ────────────────────────────────────────────────────────────────

const POLLING_INTERVAL_MS = 5_000

type Mode = 'description' | 'exact_lyrics' | 'auto_lyrics'
type VocalType = 'male' | 'female' | 'auto'
type Language  = 'es' | 'en'

const VOCAL_OPTIONS: { id: VocalType; label: string; icon: string }[] = [
  { id: 'female', label: 'Femenina', icon: '♀' },
  { id: 'male',   label: 'Masculina', icon: '♂' },
  { id: 'auto',   label: 'Auto',      icon: '✦' },
]

const LANGUAGE_OPTIONS: { id: Language; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
]

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'description',  label: 'Solo Descripción',    hint: 'La IA elige letra e instrumentos' },
  { id: 'exact_lyrics', label: 'Letra Exacta',         hint: 'Tú escribes la letra completa' },
  { id: 'auto_lyrics',  label: 'Letra Autogenerada',   hint: 'Describes de qué trata, la IA redacta' },
]

interface DurationOption { label: string; value: number }
const DURATION_OPTIONS: DurationOption[] = [
  { label: '30-40 seg', value: 40.0 },
  { label: '1 min',     value: 60.0 },
  { label: '2:30+ min', value: 150.0 },
]

type GenerationStage = 'idle' | 'submitting' | 'polling' | 'ready' | 'no_credits' | 'error'

const STAGE_LABELS: Record<GenerationStage, string> = {
  idle:       '',
  submitting: 'Enviando tu solicitud...',
  polling:    'Generando tu canción… esto puede tardar un minuto 🎶',
  ready:      '¡Lista!',
  no_credits: 'Créditos insuficientes',
  error:      'Ocurrió un error',
}

interface ReadySong { songId: string; playUrl: string; thumbnailUrl: string }

// ── Tag groups ────────────────────────────────────────────────────────────────

const TAG_GROUPS = [
  {
    label: 'Género',
    tags: ['lofi', 'pop', 'reggaeton', 'rock', 'bachata', 'kpop', 'jazz', 'cumbia', 'ranchera', 'techno', 'electronic', 'hip-hop', 'r&b', 'folk', 'salsa', 'classical'],
  },
  {
    label: 'Mood',
    tags: ['chill', 'sad', 'happy', 'energetic', 'romantic', 'melancholic', 'nostalgic', 'dark', 'angry', 'playful', 'hopeful', 'motivated'],
  },
  {
    label: 'Tempo',
    tags: ['slow', 'medium', 'fast'],
  },
]

// ── TagPicker ─────────────────────────────────────────────────────────────────

function TagPicker({
  selected,
  onToggle,
  disabled,
  hint,
}: {
  selected: string[]
  onToggle: (tag: string) => void
  disabled: boolean
  hint: string
}) {
  return (
    <div className={styles.tagSection}>
      <span className={styles.tagSectionHint}>{hint}</span>
      {TAG_GROUPS.map(group => (
        <div key={group.label} className={styles.tagGroup}>
          <span className={styles.tagGroupLabel}>{group.label}</span>
          <div className={styles.tagChips}>
            {group.tags.map(tag => (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(tag)}
                className={`${styles.tagChip} ${selected.includes(tag) ? styles.tagChipActive : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}
      {selected.length > 0 && (
        <p className={styles.tagSelected}>
          Seleccionados: {selected.map(t => (
            <span key={t} className={styles.tagSelectedBadge}>{t}</span>
          ))}
        </p>
      )}
    </div>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [mode, setMode]             = useState<Mode>('description')
  const [duration, setDuration]     = useState<number>(40.0)
  const [vocalType, setVocalType]   = useState<VocalType>('auto')
  const [language,  setLanguage]    = useState<Language>('es')

  const [title,           setTitle]           = useState('')
  const [description,     setDescription]     = useState('')
  const [prompt,          setPrompt]          = useState('')
  const [lyrics,          setLyrics]          = useState('')
  const [describedLyrics, setDescribedLyrics] = useState('')
  const [selectedTags,    setSelectedTags]    = useState<string[]>([])

  const [stage,    setStage]    = useState<GenerationStage>('idle')
  const [ready,    setReady]    = useState<ReadySong | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => stopPolling(), [])

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

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
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
  }

  async function handleJobStatus(status: JobStatus, songId: string) {
    if (status === 'no_credits') { stopPolling(); setStage('no_credits'); return }
    if (status === 'ready') {
      stopPolling()
      try {
        const [playUrl, thumbnailUrl] = await Promise.all([getSongPlayUrl(songId), getSongThumbnailUrl(songId)])
        setReady({ songId, playUrl, thumbnailUrl })
        setStage('ready')
      } catch {
        setStage('error')
        setErrorMsg('La canción está lista pero no se pudo cargar el audio.')
      }
      return
    }
    if (status === 'error') { stopPolling(); setStage('error'); setErrorMsg('El servidor reportó un error al generar la canción.') }
  }

  // ── Validación ────────────────────────────────────────────
  function validate(): string | null {
    if (!title.trim()) return 'El título es obligatorio.'
    if (mode === 'description' && !description.trim()) return 'Escribe una descripción para tu canción.'
    if (mode === 'exact_lyrics') {
      if (!prompt.trim() && selectedTags.length === 0) return 'Indica el estilo musical o selecciona al menos un tag.'
      if (!lyrics.trim())  return 'Escribe la letra exacta de la canción.'
    }
    if (mode === 'auto_lyrics') {
      if (!prompt.trim() && selectedTags.length === 0) return 'Indica el estilo musical o selecciona al menos un tag.'
      if (!describedLyrics.trim()) return 'Describe de qué trata la canción.'
    }
    return null
  }

  // ── Payload — los tags seleccionados se combinan con los campos ────────────
  function buildPayload(): Record<string, unknown> {
    const tagsStr = selectedTags.join(', ')

    const base = { title: title.trim(), audio_duration: duration, instrumental: false, vocal_type: vocalType, language }

    if (mode === 'description') {
      // Tags se anteponen a la descripción: "lofi, chill, slow. [descripción del usuario]"
      const fullDesc = tagsStr
        ? `${tagsStr}. ${description.trim()}`.trim()
        : description.trim()
      return { ...base, description: fullDesc }
    }

    // Para modos de letra, los tags van al campo prompt (estilo musical)
    const fullPrompt = tagsStr && prompt.trim()
      ? `${tagsStr}, ${prompt.trim()}`
      : tagsStr || prompt.trim()

    if (mode === 'exact_lyrics') return { ...base, prompt: fullPrompt, lyrics: lyrics.trim() }
    return { ...base, prompt: fullPrompt, described_lyrics: describedLyrics.trim() }
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setErrorMsg(validationError); return }

    setErrorMsg(null)
    setReady(null)
    setStage('submitting')

    try {
      const payload = buildPayload()
      const res = await generateSong(payload as Parameters<typeof generateSong>[0])

      import('../../api/authService').then(({ authService }) => {
        authService.getProfile().then(profile => {
          useAuthStore.getState().setUser(profile)
        }).catch(console.error)
      })

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
    setSelectedTags([])
    setVocalType('auto')
    setLanguage('es')  // default español
  }

  function handleModeChange(m: Mode) {
    setMode(m)
    setErrorMsg(null)
    setSelectedTags([])
  }

  const isBusy = stage === 'submitting' || stage === 'polling'
  const { user } = useAuthStore()

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className="flex justify-between items-center w-full">
            <h1 className={styles.pageTitle}>Crear canción</h1>
            <div className="text-right">
              <span className="text-sm font-bold text-muted uppercase tracking-wider block">Créditos disponibles</span>
              <span className="text-primary text-xl font-black">{user?.credit_balance ?? 0}</span>
            </div>
          </div>
          <p className={styles.pageSubtitle}>
            Elige un modo, selecciona estilos y deja que la IA haga el resto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* ── Tabs de modo ──────────────────────────────────── */}
          <div className={styles.tabs} role="tablist" aria-label="Modo de creación">
            {MODES.map(m => (
              <button
                key={m.id} type="button" role="tab" aria-selected={mode === m.id}
                disabled={isBusy} onClick={() => handleModeChange(m.id)}
                className={`${styles.tab} ${mode === m.id ? styles.tabActive : ''}`}
              >
                <span className={styles.tabLabel}>{m.label}</span>
                <span className={styles.tabHint}>{m.hint}</span>
              </button>
            ))}
          </div>

          {/* ── Título ────────────────────────────────────────── */}
          <div className={styles.fieldGroup}>
            <label htmlFor="title" className={styles.label}>Título de la canción</label>
            <input
              id="title" type="text" placeholder="Ej: Midnight Echoes"
              value={title} onChange={e => setTitle(e.target.value)}
              disabled={isBusy} className={styles.input}
            />
          </div>

          {/* ── Modo Descripción ──────────────────────────────── */}
          {mode === 'description' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="description" className={styles.label}>
                Descripción
                <span className={styles.labelHint}>¿Qué quieres expresar con esta canción?</span>
              </label>
              <TagPicker
                selected={selectedTags}
                onToggle={toggleTag}
                disabled={isBusy}
                hint="Selecciona géneros y moods — se añaden al inicio de tu descripción al generar"
              />
              <textarea
                id="description"
                placeholder="Ej: Una canción melancólica sobre un viaje nocturno en tren, con sensación de soledad y esperanza..."
                value={description} onChange={e => setDescription(e.target.value)}
                disabled={isBusy} rows={5} className={styles.textarea}
              />
            </div>
          )}

          {/* ── Modos con letra: campo Estilo + TagPicker ─────── */}
          {(mode === 'exact_lyrics' || mode === 'auto_lyrics') && (
            <div className={styles.fieldGroup}>
              <label htmlFor="prompt" className={styles.label}>
                Estilo musical
                <span className={styles.labelHint}>Género, BPM, instrumentos, mood...</span>
              </label>
              <TagPicker
                selected={selectedTags}
                onToggle={toggleTag}
                disabled={isBusy}
                hint="Clic rápido para elegir estilo — se combinan con el texto del campo"
              />
              <input
                id="prompt" type="text"
                placeholder="Ej: Synthwave melancólico, 110 BPM, sintetizadores y bajo pulsante"
                value={prompt} onChange={e => setPrompt(e.target.value)}
                disabled={isBusy} className={styles.input}
              />
            </div>
          )}

          {/* ── Letra exacta ──────────────────────────────────── */}
          {mode === 'exact_lyrics' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="lyrics" className={styles.label}>
                Letra exacta
                <span className={styles.labelHint}>La IA cantará exactamente esto</span>
              </label>
              <textarea
                id="lyrics" placeholder={'Verso 1:\n...\n\nCoro:\n...'}
                value={lyrics} onChange={e => setLyrics(e.target.value)}
                disabled={isBusy} rows={7} className={styles.textarea}
              />
            </div>
          )}

          {/* ── Letra automática ──────────────────────────────── */}
          {mode === 'auto_lyrics' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="described_lyrics" className={styles.label}>
                ¿De qué trata la letra?
                <span className={styles.labelHint}>La IA escribirá la letra basándose en esto</span>
              </label>
              <textarea
                id="described_lyrics"
                placeholder="Ej: Una historia de dos personas que se separan en un aeropuerto pero saben que volverán a encontrarse..."
                value={describedLyrics} onChange={e => setDescribedLyrics(e.target.value)}
                disabled={isBusy} rows={5} className={styles.textarea}
              />
            </div>
          )}

          {/* ── Duración ──────────────────────────────────────── */}
          <div className={styles.fieldGroup}>
            <span className={styles.label}>Duración aproximada</span>
            <div className={styles.durationChips}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value} type="button" disabled={isBusy}
                  onClick={() => setDuration(opt.value)}
                  className={`${styles.chip} ${duration === opt.value ? styles.chipActive : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tipo de voz + Idioma (misma fila) ────────────── */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div className={styles.fieldGroup} style={{ flex: 1, minWidth: 180 }}>
              <span className={styles.label}>Voz</span>
              <div className={styles.durationChips}>
                {VOCAL_OPTIONS.map(opt => (
                  <button
                    key={opt.id} type="button" disabled={isBusy}
                    onClick={() => setVocalType(opt.id)}
                    className={`${styles.chip} ${vocalType === opt.id ? styles.chipActive : ''}`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup} style={{ flex: 2, minWidth: 260 }}>
              <span className={styles.label}>Idioma de la letra</span>
              <div className={styles.durationChips}>
                {LANGUAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.id} type="button" disabled={isBusy}
                    onClick={() => setLanguage(opt.id)}
                    className={`${styles.chip} ${language === opt.id ? styles.chipActive : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
          <div className={`${styles.statusCard} ${
            stage === 'no_credits' || stage === 'error' ? styles.statusError  :
            stage === 'ready'                           ? styles.statusSuccess :
            styles.statusLoading
          }`}>
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
              {stage === 'no_credits' && <span>No tienes suficientes créditos. Considera hacer upgrade a un plan Pro.</span>}
              {stage === 'error' && errorMsg && <span>{errorMsg}</span>}
              {stage === 'polling' && <span>Puedes esperar aquí. Te avisaremos cuando esté lista.</span>}
            </div>
            {(stage === 'ready' || stage === 'no_credits' || stage === 'error') && (
              <button onClick={handleReset} className={styles.resetBtn}>Nueva canción</button>
            )}
          </div>
        )}

        {/* ── Reproductor de resultado ────────────────────────── */}
        {stage === 'ready' && ready && (
          <div className={styles.resultCard}>
            {ready.thumbnailUrl && (
              <img src={ready.thumbnailUrl} alt="Portada" className={styles.thumbnail} />
            )}
            <div className={styles.resultInfo}>
              <p className={styles.resultLabel}>{title || 'Tu canción está lista'}</p>
              <audio key={ready.playUrl} src={ready.playUrl} controls autoPlay className={styles.audioPlayer} />
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
