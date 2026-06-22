import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { generateKaraoke, pollKaraokeStatus } from '../../api/modules/karaoke.api'
import { getSongThumbnailUrl } from '../../api/modules/songs.api'
import { authService } from '../../api/auth-service'
import { useAuthStore } from '../../store/auth.store'
import styles from './karaoke-generate-page.module.css'

type Stage = 'confirm' | 'generating' | 'no_credits' | 'error'

const LOADING_STEPS = [
  'Separando pistas de audio',
  'Transcribiendo letra',
  'Sincronizando tiempos',
]

// Intervalos en ms en que cada paso se marca como completado
const STEP_TIMINGS = [1600, 3400]

export default function KaraokeGeneratePage() {
  const { songId } = useParams<{ songId: string }>()
  const { state } = useLocation() as {
    state?: { songTitle?: string; source?: string; thumbnailUrl?: string }
  }
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [stage, setStage] = useState<Stage>('confirm')
  const [activeStep, setActiveStep] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(state?.thumbnailUrl ?? null)

  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!thumbnailUrl && songId) {
      getSongThumbnailUrl(songId)
        .then(setThumbnailUrl)
        .catch(() => {})
    }
  }, [songId, thumbnailUrl])

  useEffect(() => {
    return () => {
      stepTimers.current.forEach(clearTimeout)
    }
  }, [])

  const songTitle = state?.songTitle ?? 'Canción'
  const creditBalance = user?.credit_balance ?? 0

  async function handleGenerate() {
    if (!songId) return

    if (creditBalance < 2) {
      setStage('no_credits')
      return
    }

    setStage('generating')
    setActiveStep(0)

    // Animación cosmética: avanza los pasos mientras esperamos al backend
    STEP_TIMINGS.forEach((delay, i) => {
      const t = setTimeout(() => setActiveStep(i + 1), delay)
      stepTimers.current.push(t)
    })

    try {
      // 1. Iniciar generación — el backend encola la tarea y cobra los créditos
      const result = await generateKaraoke(songId)

      // 2. Polling hasta que el backend termine (queued → processing → ready)
      let status = result.status
      while (status !== 'ready' && status !== 'failed') {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const poll = await pollKaraokeStatus(result.karaoke_id)
        status = poll.status
      }

      if (status === 'failed') throw new Error('failed')

      stepTimers.current.forEach(clearTimeout)
      stepTimers.current = []

      // 3. Refrescar perfil para que el balance refleje el cobro real del servidor
      authService.getProfile().then((profile) => {
        useAuthStore.getState().setUser(profile)
      }).catch(() => {})

      navigate(`/karaoke/play/${result.karaoke_id}`, {
        replace: true,
        state: {
          songId,
          songTitle,
          source: state?.source,
        },
      })
    } catch (err) {
      stepTimers.current.forEach(clearTimeout)
      stepTimers.current = []
      if (isAxiosError(err) && err.response?.status === 402) {
        setStage('no_credits')
      } else {
        setStage('error')
      }
    }
  }

  function handleBack() {
    navigate('/karaoke')
  }

  // ── Render: confirmación ──────────────────────────────────────────────────

  if (stage === 'confirm') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.coverWrapper}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={`Portada de ${songTitle}`}
                className={styles.coverImg}
                onError={() => setThumbnailUrl(null)}
              />
            ) : (
              <div className={styles.coverPlaceholder}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              </div>
            )}
            <div className={styles.coverGradient} />
            <p className={styles.coverTitle}>{songTitle}</p>
          </div>

          <div className={styles.body}>
            <div className={styles.costRow}>
              <div className={styles.costInfo}>
                <p className={styles.costLabel}>Costo de generación</p>
                <p className={styles.costBadge}>
                  2
                  <span className={styles.costBadgeSub}>créditos</span>
                </p>
              </div>
              <div className={styles.balanceChip}>
                <span className={styles.balanceLabel}>Tus créditos</span>
                <span className={styles.balanceValue}>{creditBalance}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={creditBalance < 2}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                {creditBalance < 2 ? 'Créditos insuficientes' : 'Generar Karaoke'}
              </button>
              <button className={styles.cancelBtn} onClick={handleBack}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: generando ─────────────────────────────────────────────────────

  if (stage === 'generating') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.loadingBody}>
            <p className={styles.loadingTitle}>Generando tu karaoke...</p>
            <p className={styles.loadingSubtitle}>
              Esto puede tardar unos segundos
            </p>

            <div className={styles.steps}>
              {LOADING_STEPS.map((label, i) => {
                const isDone = i < activeStep
                const isActive = i === activeStep

                return (
                  <div
                    key={label}
                    className={`${styles.step} ${isDone ? styles.stepDone : ''} ${isActive ? styles.stepActive : ''}`}
                  >
                    <div
                      className={`${styles.stepIcon} ${isDone ? styles.stepIconDone : ''} ${isActive ? styles.stepIconActive : ''}`}
                    >
                      {isDone ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      ) : isActive ? (
                        <span className={styles.spinner} />
                      ) : null}
                    </div>
                    {label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: sin créditos ──────────────────────────────────────────────────

  if (stage === 'no_credits') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.alertCard}>
            <div className={`${styles.alertIcon} ${styles.alertIconWarning}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
              </svg>
            </div>
            <p className={styles.alertTitle}>Créditos insuficientes</p>
            <p className={styles.alertText}>
              Necesitás 2 créditos para generar un karaoke. Actualmente tenés{' '}
              <strong>{creditBalance}</strong>.
            </p>
            <div className={styles.alertActions}>
              <button className={styles.alertPrimaryBtn} onClick={() => navigate('/payments')}>
                Ver planes
              </button>
              <button className={styles.alertSecondaryBtn} onClick={handleBack}>
                Volver al catálogo
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: error ─────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.alertCard}>
          <div className={`${styles.alertIcon} ${styles.alertIconError}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <p className={styles.alertTitle}>Algo salió mal</p>
          <p className={styles.alertText}>
            No se pudo generar el karaoke. Tus créditos no fueron descontados.
          </p>
          <div className={styles.alertActions}>
            <button
              className={styles.alertPrimaryBtn}
              onClick={() => {
                setStage('confirm')
                setActiveStep(0)
              }}
            >
              Intentar de nuevo
            </button>
            <button className={styles.alertSecondaryBtn} onClick={handleBack}>
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
