import { useEffect, useState } from 'react'

import { getStemJobStatus } from '../api/modules/stems.api'
import type { StemFile } from '../api/modules/stems.api'

const FINAL_STATES = ['completed', 'failed']

/**
 * Hook de polling para el estado de un job de separación de stems.
 * Consulta el backend cada 3 segundos hasta que el job alcanza un estado final.
 *
 * @param jobId - ID del StemJob a monitorear, o null si no hay job activo.
 * @returns Estado actual del job, porcentaje de progreso, archivos generados y mensaje de error.
 */
export function useStemJob(jobId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [stemFiles, setStemFiles] = useState<StemFile[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) {
      return
    }

    let cancelled = false

    const poll = async () => {
      try {
        const data = await getStemJobStatus(jobId)
        if (cancelled) {
          return
        }
        setStatus(data.status)
        setProgress(data.progress_pct)
        if (data.stem_files) {
          setStemFiles(data.stem_files)
        }
        if (data.error_message) {
          setError(data.error_message)
        }
        if (!FINAL_STATES.includes(data.status)) {
          setTimeout(poll, 3000)
        }
      } catch {
        // Reintenta con intervalo mayor ante errores de red.
        if (!cancelled) {
          setTimeout(poll, 6000)
        }
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [jobId])

  return { status, progress, stemFiles, error }
}
