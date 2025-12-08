'use client'

import Link from 'next/link'

/**
 * Header component with "Où Skier!" branding
 */
export function Header() {
  return (
    <header
      style={{
        backgroundColor: 'var(--glacier-blue)',
        padding: 'var(--spacing-lg) 0',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--snow-white)',
                margin: 0,
                cursor: 'pointer',
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
              ❄️ Où Skier!
            </h1>
          </Link>
          <p
            style={{
              color: 'var(--snow-white)',
              fontSize: '0.875rem',
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
