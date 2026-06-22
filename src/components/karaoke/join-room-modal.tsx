import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  onClose: () => void
}

export default function JoinRoomModal({ onClose }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('El código de sala tiene 6 caracteres.')
      return
    }
    navigate(`/karaoke/room/${trimmed}`)
    onClose()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(val)
    setError('')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-base)' }}>
            Unirse a sala
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-subdued)', margin: '6px 0 0' }}>
            Ingresá el código de 6 caracteres que te compartieron.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            ref={inputRef}
            value={code}
            onChange={handleChange}
            placeholder="ABC123"
            autoFocus
            style={{
              background: 'var(--bg-card-hover)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'transparent'}`,
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-base)',
              letterSpacing: '0.2em',
              textAlign: 'center',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
              textTransform: 'uppercase',
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = error
                ? 'rgba(239,68,68,0.6)'
                : 'var(--color-primary)')
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'transparent')
            }
          />

          {error && (
            <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: code.length === 6 ? 1 : 0.5,
            }}
          >
            Entrar a la sala
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--bg-card-hover)',
              color: 'var(--text-subdued)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  )
}
