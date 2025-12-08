'use client'

import Link from 'next/link'

/**
 * Glassmorphic Header component with sticky positioning
 */
export function Header() {
  return (
    <header
      style={{
        background: 'var(--glass-white)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: 'var(--spacing-lg) 0',
        boxShadow: 'var(--shadow-glass-md)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-lg)',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--glacier-blue-primary)',
                margin: 0,
                cursor: 'pointer',
                transition: 'opacity var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.opacity = '0.8'
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.opacity = '1'
                }
              }}
            >
              ❄️ Où Skier?
            </h1>
          </Link>
          <p
            style={{
              color: 'var(--slate-gray)',
              fontSize: '0.875rem',
              fontWeight: '500',
              margin: 0,
            }}
          >
            Classement des meilleures stations de ski suisses
          </p>
        </div>
      </div>
    </header>
  )
}
