import Link from 'next/link'
import { getResorts } from '@/lib/resorts/data'
import { fetchWeatherForResorts } from '@/lib/weather/client'
import {
  calculateResortScoresForAllDays,
  scoreResortsForDay
} from '@/lib/scoring/engine'
import { formatDayLabel } from '@/lib/utils/date'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScoreIndicator } from '@/components/ui/ScoreIndicator'
import { ResortCard } from './resort-card'
import { DaySelector } from '@/components/DaySelector'

export const metadata = {
  title: 'Où Skier! - Top 3 Stations de Ski Suisses',
  description: 'Les 3 meilleures stations de ski suisses pour les prochains jours',
}

/**
 * Homepage - displays top 3 ski resorts with scores for selected day
 */
export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ day?: string }>
}) {
  const params = await searchParams
  const selectedDay = Math.max(0, Math.min(4, parseInt(params.day || '0')))

  // Fetch all resorts
  const resorts = await getResorts()

  // Fetch weather data for all resorts (batched in single API call)
  const weatherDataArray = await fetchWeatherForResorts(resorts)

  // Pre-calculate ALL day scores for ALL resorts
  const multiDayResorts = resorts.map((resort, index) =>
    calculateResortScoresForAllDays(resort, weatherDataArray[index])
  )

  // Get rankings for selected day
  const dayRankings = scoreResortsForDay(multiDayResorts, selectedDay)
  const top3 = dayRankings.resorts.slice(0, 3)

  // Prepare day labels for selector
  const dayLabels = multiDayResorts[0].dayScores.map(ds => ({
    day: ds.day,
    date: ds.date,
    label: formatDayLabel(ds.date, ds.day),
  }))

  return (
    <div className="container">
      {/* Title */}
      <h1
        style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-lg)',
          fontSize: '2.5rem',
          fontWeight: '700',
          color: 'var(--charcoal)',
          letterSpacing: '-0.02em',
        }}
      >
        🏔️ Les meilleures stations pour
      </h1>

      {/* Day Selector */}
      <DaySelector
        currentDay={selectedDay}
        dayLabels={dayLabels}
      />

      {/* Selected Day Label */}
      <h2
        style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-2xl)',
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--glacier-blue-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {dayLabels[selectedDay].label}
      </h2>

      {/* Top 3 Section */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>

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
          Toutes les Stations ({dayRankings.resorts.length})
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          {dayRankings.resorts.map((resort) => (
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
