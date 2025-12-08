'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScoreIndicator } from '@/components/ui/ScoreIndicator'
import type { ScoredResort } from '@/lib/resorts/types'

/**
 * ResortCard component for top 3 display
 */
export function ResortCard({
  resort,
  index,
}: {
  resort: ScoredResort
  index: number
}) {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <Link href={`/resorts/${resort.id}`}>
      <Card
        as="article"
        style={{
          cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{medals[index]}</span>
              <Badge label={resort.region} variant="primary" />
            </div>
            <h3
              style={{
                margin: '0 0 0.5rem 0',
                color: 'var(--deep-night-blue)',
                fontSize: '1.25rem',
              }}
            >
              {resort.name}
            </h3>
            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
              📍 Altitude: {resort.elevation}m
            </p>
          </div>
          <ScoreIndicator score={resort.score} size="large" />
        </div>

        {/* Weather metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-lg)',
            background: 'var(--glass-overlay)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.875rem',
            marginTop: 'var(--spacing-md)',
          }}
        >
          <div>
            <span
              style={{
                color: 'var(--slate-gray)',
                fontSize: '0.75rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Neige 48h
            </span>
            <span
              style={{
                fontWeight: '600',
                color: 'var(--charcoal)',
                fontSize: '1rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {resort.breakdown.recentSnowfall.toFixed(0)} cm
            </span>
          </div>
          <div>
            <span
              style={{
                color: 'var(--slate-gray)',
                fontSize: '0.75rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Profondeur
            </span>
            <span
              style={{
                fontWeight: '600',
                color: 'var(--charcoal)',
                fontSize: '1rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(resort.weather.hourly.snow_depth[0])} cm
            </span>
          </div>
          <div>
            <span
              style={{
                color: 'var(--slate-gray)',
                fontSize: '0.75rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Temp. moy
            </span>
            <span
              style={{
                fontWeight: '600',
                color: 'var(--charcoal)',
                fontSize: '1rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {resort.breakdown.temperature.toFixed(1)}°C
            </span>
          </div>
          <div>
            <span
              style={{
                color: 'var(--slate-gray)',
                fontSize: '0.75rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Pistes ouv.
            </span>
            <span
              style={{
                fontWeight: '600',
                color: 'var(--charcoal)',
                fontSize: '1rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(resort.breakdown.pisteOpenings)}%
            </span>
          </div>
        </div>

        <p
          style={{
            marginTop: 'var(--spacing-md)',
            marginBottom: 0,
            color: 'var(--glacier-blue-primary)',
            fontWeight: '600',
            fontSize: '0.875rem',
          }}
        >
          Voir les détails →
        </p>
      </Card>
    </Link>
  )
}
