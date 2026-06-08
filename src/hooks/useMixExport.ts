import { useEffect, useState } from 'react'
import { getMixExportStatus } from '../api/modules/mix.api'

const FINAL_STATES = ['ready', 'failed']

export function useMixExport(exportId: string | null) {
  const [status, setStatus]           = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (!exportId) return
    let cancelled = false

    const poll = async () => {
      try {
        const data = await getMixExportStatus(exportId)
        if (cancelled) return

        setStatus(data.status)
        if (data.download_url) setDownloadUrl(data.download_url)
        if (data.error_message) setError(data.error_message)

        if (!FINAL_STATES.includes(data.status)) {
          setTimeout(poll, 4000)
        }
      } catch {
        if (!cancelled) setTimeout(poll, 8000)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [exportId])

  return { status, downloadUrl, error }
}
