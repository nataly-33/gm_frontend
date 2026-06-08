interface Props {
  status: string | null
  progress: number
  error: string | null
}

const STATUS_LABELS: Record<string, string> = {
  queued:     'En cola…',
  processing: 'Separando pistas…',
  completed:  'Completado',
  failed:     'Error',
}

export default function StemProgress({ status, progress, error }: Props) {
  if (!status) return null

  const label = STATUS_LABELS[status] ?? status
  const isFailed = status === 'failed'
  const isCompleted = status === 'completed'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: isFailed ? '#f87171' : isCompleted ? '#4ade80' : 'white' }}>
          {label}
        </span>
        <span className="text-xs text-muted">{progress}%</span>
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-card-hover)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isFailed
              ? '#f87171'
              : isCompleted
              ? '#4ade80'
              : 'var(--color-primary)',
          }}
        />
      </div>

      {isFailed && error && (
        <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
      )}
    </div>
  )
}
