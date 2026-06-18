import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AudioUploader from '../../components/stems/audio-uploader'
import StemProgress from '../../components/stems/stem-progress'
import StemResultCard from '../../components/stems/stem-result-card'
import { useStemJob } from '../../hooks/useStemJob'
import { uploadAndSeparate, getStemJobs } from '../../api/modules/stems.api'
import type { StemJob } from '../../api/modules/stems.api'

function JobHistoryRow({ job }: { job: StemJob }) {
  const statusColor: Record<string, string> = {
    queued: '#a7a7a7',
    processing: '#facc15',
    completed: '#4ade80',
    failed: '#f87171',
  }

  return (
    <div className="bg-card-hover rounded-lg px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{job.source_filename}</p>
        <p className="text-muted text-xs">{new Date(job.created_at).toLocaleString()}</p>
      </div>
      <span
        className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
        style={{ background: 'rgba(255,255,255,0.05)', color: statusColor[job.status] ?? 'white' }}
      >
        {job.status}
      </span>
    </div>
  )
}

export default function StemsPage() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { status, progress, stemFiles, error } = useStemJob(activeJobId)

  const { data: history = [], refetch } = useQuery({
    queryKey: ['stem-jobs'],
    queryFn: getStemJobs,
  })

  async function handleSubmit(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const { job_id: jobId } = await uploadAndSeparate(file)
      setActiveJobId(jobId)
      refetch()
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Error al subir el archivo.'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  const isProcessing = status && !['completed', 'failed'].includes(status)

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-white text-xl font-bold">Separar pistas</h1>
        <p className="text-muted text-sm mt-1">
          Separa vocals y karaoke de cualquier archivo de audio (2 créditos).
        </p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr', flex: 1 }}>
        {/* Panel izquierdo — subida + progreso + resultado */}
        <div className="flex flex-col gap-4">
          <AudioUploader onSubmit={handleSubmit} loading={uploading || !!isProcessing} />

          {uploadError && (
            <p className="text-sm px-1" style={{ color: '#f87171' }}>
              {uploadError}
            </p>
          )}

          {activeJobId && (
            <div className="flex flex-col gap-4 mt-2">
              <StemProgress status={status} progress={progress} error={error} />
              {status === 'completed' && <StemResultCard stemFiles={stemFiles} />}
            </div>
          )}
        </div>

        {/* Panel derecho — historial */}
        <div className="flex flex-col gap-3">
          <h2 className="text-white text-sm font-semibold">Historial de separaciones</h2>
          {history.length === 0 ? (
            <p className="text-muted text-sm">Aún no tienes separaciones.</p>
          ) : (
            history.map((job) => <JobHistoryRow key={job.id} job={job} />)
          )}
        </div>
      </div>
    </div>
  )
}
