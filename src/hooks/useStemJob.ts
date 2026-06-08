import { useEffect, useState } from 'react'
import { getStemJobStatus } from '../api/modules/stems.api'
import type { StemFile } from '../api/modules/stems.api'

const FINAL_STATES = ['completed', 'failed']

export function useStemJob(jobId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [stemFiles, setStemFiles] = useState<StemFile[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return

    let cancelled = false

    const poll = async () => {
      try {
        const data = await getStemJobStatus(jobId)
        if (cancelled) return
        setStatus(data.status)
        setProgress(data.progress_pct)
        if (data.stem_files) setStemFiles(data.stem_files)
        if (data.error_message) setError(data.error_message)
        if (!FINAL_STATES.includes(data.status)) {
          setTimeout(poll, 3000)
        }
      } catch {
        if (!cancelled) setTimeout(poll, 6000)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [jobId])

  return { status, progress, stemFiles, error }
}
