import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

const MAX_SIZE = 50 * 1024 * 1024
const ALLOWED_EXTS = ['.mp3', '.wav']
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave']

interface Props {
  onSubmit: (file: File) => void
  loading: boolean
}

export default function AudioUploader({ onSubmit, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function validate(f: File): string | null {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(f.type)) {
      return 'Solo se aceptan archivos .mp3 o .wav'
    }
    if (f.size > MAX_SIZE) {
      return `El archivo supera el límite de 50 MB (${(f.size / 1024 / 1024).toFixed(1)} MB)`
    }
    return null
  }

  function handleFile(f: File) {
    const err = validate(f)
    setValidationError(err)
    setFile(err ? null : f)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? 'var(--color-primary)' : 'var(--color-card-hover)',
          background: dragging ? 'rgba(168,85,247,0.05)' : 'transparent',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-primary)' }}>
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
        <p className="text-white text-sm font-medium">
          Arrastra un archivo aquí o <span style={{ color: 'var(--color-primary)' }}>selecciona</span>
        </p>
        <p className="text-muted text-xs">.mp3 o .wav — máximo 50 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {validationError && (
        <p className="text-sm px-1" style={{ color: '#f87171' }}>{validationError}</p>
      )}

      {file && !validationError && (
        <div className="bg-card-hover rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{file.name}</p>
              <p className="text-muted text-xs">{formatSize(file.size)}</p>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={() => onSubmit(file)}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-opacity"
            style={{ background: 'var(--color-primary)', color: 'black', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Subiendo…' : 'Separar pistas (2 créditos)'}
          </button>
        </div>
      )}
    </div>
  )
}
