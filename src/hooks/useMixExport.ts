import { useEffect, useState } from 'react'

import { getMixExportStatus } from '../api/modules/mix.api'

const FINAL_STATES = ['ready', 'failed']

/**
 * Hook de polling para el estado de una exportación de mix.
 * Consulta el backend cada 4 segundos hasta que la exportación está lista o falla.
 *
 * @param exportId - ID del job de exportación, o null si no hay exportación activa.
 * @returns Estado de la exportación, URL de descarga cuando está lista y mensaje de error.
 */
export function useMixExport(exportId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!exportId) {
      return
    }
    let cancelled = false

    const poll = async () => {
      try {
        const data = await getMixExportStatus(exportId)
        if (cancelled) {
          return
        }

        setStatus(data.status)
        if (data.download_url) {
          setDownloadUrl(data.download_url)
        }
        if (data.error_message) {
          setError(data.error_message)
        }

        if (!FINAL_STATES.includes(data.status)) {
          setTimeout(poll, 4000)
        }
      } catch {
        // Reintenta con intervalo mayor ante errores de red.
        if (!cancelled) {
          setTimeout(poll, 8000)
        }
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [exportId])

  return { status, downloadUrl, error }
}
