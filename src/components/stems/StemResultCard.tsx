import { useState, useRef } from 'react'
import type { StemFile } from '../../api/modules/stems.api'
import { getStemDownloadUrl } from '../../api/modules/stems.api'

const STEM_LABELS: Record<string, string> = {
  vocals:    'Vocals',
  no_vocals: 'Karaoke (sin voz)',
  bass:      'Bajo',
  drums:     'Batería',
  other:     'Otros',
}

interface Props {
  stemFiles: StemFile[]
}

function StemTrack({ stemFile }: { stemFile: StemFile }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  async function fetchUrl() {
    setLoadingUrl(true)
    try {
      const presigned = await getStemDownloadUrl(stemFile.id)
      setUrl(presigned)
    } finally {
      setLoadingUrl(false)
    }
  }

  async function handlePlay() {
    if (!url) {
      await fetchUrl()
    }
    audioRef.current?.play()
  }

  async function handleDownload() {
    let presigned = url
    if (!presigned) {
      setLoadingUrl(true)
      try {
        presigned = await getStemDownloadUrl(stemFile.id)
        setUrl(presigned)
      } finally {
        setLoadingUrl(false)
      }
    }
    const a = document.createElement('a')
    a.href = presigned!
    a.download = `${stemFile.stem_type}.wav`
    a.click()
  }

  return (
    <div className="bg-card-hover rounded-lg px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium">
          {STEM_LABELS[stemFile.stem_type] ?? stemFile.stem_type}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            disabled={loadingUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-opacity"
            style={{ background: 'var(--color-primary)', color: 'black', opacity: loadingUrl ? 0.5 : 1 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Reproducir
          </button>
          <button
            onClick={handleDownload}
            disabled={loadingUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-opacity"
            style={{ background: 'rgba(255,255,255,0.1)', opacity: loadingUrl ? 0.5 : 1 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z" /></svg>
            Descargar
          </button>
        </div>
      </div>

      {url && (
        <audio ref={audioRef} src={url} controls className="w-full h-8 mt-1" style={{ accentColor: 'var(--color-primary)' }} />
      )}
    </div>
  )
}

export default function StemResultCard({ stemFiles }: Props) {
  if (stemFiles.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-white text-sm font-semibold">Pistas disponibles</h3>
      {stemFiles.map((sf) => (
        <StemTrack key={sf.id} stemFile={sf} />
      ))}
    </div>
  )
}
