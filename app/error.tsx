'use client'

/**
 * Error boundary for homepage
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="container"
      style={{
        textAlign: 'center',
        padding: 'var(--spacing-2xl)',
      }}
    >
      <h2 style={{ color: 'var(--deep-night-blue)', marginBottom: 'var(--spacing-md)' }}>
        Oups! Une erreur est survenue
      </h2>
      <p style={{ color: 'var(--deep-night-blue)', marginBottom: 'var(--spacing-lg)' }}>
        Nous n'avons pas pu charger les données météorologiques des stations de ski.
      </p>
      {error.message && (
        <p
          style={{
            color: '#FF6B6B',
            fontSize: '0.875rem',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          Détail: {error.message}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          backgroundColor: 'var(--glacier-blue)',
          color: 'var(--snow-white)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'opacity var(--transition-base)',
        }}
        onMouseEnter={(e) => {
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.9'
          }
        }}
        onMouseLeave={(e) => {
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1'
          }
        }}
      >
        Réessayer
      </button>
    </div>
  )
}
