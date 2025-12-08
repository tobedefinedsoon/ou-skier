'use cache'

import { cacheLife } from 'next/cache'
import Link from 'next/link'
import { getResorts } from '@/lib/resorts/data'
import { fetchWeatherForResorts } from '@/lib/weather/client'
import { scoreResorts, getTopResorts } from '@/lib/scoring/engine'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScoreIndicator } from '@/components/ui/ScoreIndicator'
import type { ScoredResort } from '@/lib/resorts/types'

export const metadata = {
  title: 'Où Skier! - Top 3 Stations de Ski Suisses',
  description: 'Les 3 meilleures stations de ski suisses pour les prochains jours',
}

/**
 * Homepage - displays top 3 ski resorts with scores
 */
export default async function HomePage() {
  cacheLife('hours') // 1-hour stale, 15-min revalidate

  // Fetch all resorts
  const resorts = await getResorts()

  // Fetch weather data for all resorts (batched in single API call)
  const weatherDataArray = await fetchWeatherForResorts(resorts)

  // Score all resorts
  const allScored = scoreResorts(resorts, weatherDataArray)

  // Get top 3
  const top3 = getTopResorts(allScored, 3)

  return (
    <div className="container">
      {/* Top 3 Section */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          🏔️ Meilleures Stations des 5 Prochains Jours
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-2xl)',
          }}
        >
          {top3.map((resort, index) => (
            <ResortCard key={resort.id} resort={resort} index={index} />
          ))}
        </div>
      </section>

      {/* All Resorts Section */}
      <section>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
          Toutes les Stations ({allScored.length})
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {allScored.map((resort) => (
            <Link key={resort.id} href={`/resorts/${resort.id}`}>
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
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-md)',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        marginBottom: '0.25rem',
                        color: 'var(--deep-night-blue)',
                        fontSize: '1rem',
                      }}
                    >
                      {resort.name}
                    </h3>
                    <Badge label={resort.region} variant="primary" />
                  </div>
                  <ScoreIndicator score={resort.score} size="small" />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#666',
                  }}
                >
                  Rang: #{resort.rank}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * ResortCard component for top 3 display
 */
function ResortCard({
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
            padding: 'var(--spacing-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <span style={{ color: '#666' }}>Neige 48h:</span>
            <br />
            <span
              style={{
                fontWeight: '600',
                color: 'var(--deep-night-blue)',
              }}
            >
              {resort.breakdown.recentSnowfall.toFixed(0)} cm
            </span>
          </div>
          <div>
            <span style={{ color: '#666' }}>Profondeur:</span>
            <br />
            <span
              style={{
                fontWeight: '600',
                color: 'var(--deep-night-blue)',
              }}
            >
              {Math.round(resort.weather.hourly.snow_depth[0])} cm
            </span>
          </div>
          <div>
            <span style={{ color: '#666' }}>Temp. moy:</span>
            <br />
            <span
              style={{
                fontWeight: '600',
                color: 'var(--deep-night-blue)',
              }}
            >
              {resort.breakdown.temperature.toFixed(1)}°C
            </span>
          </div>
          <div>
            <span style={{ color: '#666' }}>Pistes ouvertes:</span>
            <br />
            <span
              style={{
                fontWeight: '600',
                color: 'var(--deep-night-blue)',
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
            color: 'var(--glacier-blue)',
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
