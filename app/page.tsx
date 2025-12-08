'use cache'

import { cacheLife } from 'next/cache'
import Link from 'next/link'
import { getResorts } from '@/lib/resorts/data'
import { fetchWeatherForResorts } from '@/lib/weather/client'
import { scoreResorts, getTopResorts } from '@/lib/scoring/engine'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScoreIndicator } from '@/components/ui/ScoreIndicator'
import { ResortCard } from './resort-card'

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
        <h2
          style={{
            textAlign: 'center',
            marginBottom: 'var(--spacing-2xl)',
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--charcoal)',
            letterSpacing: '-0.01em',
          }}
        >
          🏔️ Meilleures Stations des 5 Prochains Jours
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-2xl)',
            marginBottom: 'var(--spacing-3xl)',
          }}
        >
          {top3.map((resort, index) => (
            <ResortCard key={resort.id} resort={resort} index={index} />
          ))}
        </div>
      </section>

      {/* All Resorts Section */}
      <section>
        <h2
          style={{
            marginBottom: 'var(--spacing-lg)',
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--charcoal)',
            letterSpacing: '-0.01em',
          }}
        >
          Toutes les Stations ({allScored.length})
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-lg)',
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
