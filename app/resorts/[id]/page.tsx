'use cache'

import { cacheLife } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResorts, getResortById, getOpenPistePercentage } from '@/lib/resorts/data'
import { fetchWeatherForResorts } from '@/lib/weather/client'
import type { MeteoSwissResponse } from '@/lib/weather/schemas'
import { calculateResortScore } from '@/lib/scoring/engine'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScoreIndicator } from '@/components/ui/ScoreIndicator'

export const metadata = {
  title: 'Détails Station de Ski - Où Skier!',
  description: 'Détails complets pour une station de ski suisse',
}

export async function generateStaticParams() {
  const resorts = await getResorts()
  return resorts.map((resort) => ({
    id: resort.id,
  }))
}

// Cache all weather data globally to avoid re-fetching for each resort
let cachedWeatherData: Map<string, MeteoSwissResponse> | null = null

async function getCachedWeatherData() {
  if (cachedWeatherData) {
    return cachedWeatherData
  }

  const resorts = await getResorts()
  const weatherDataArray = await fetchWeatherForResorts(resorts)

  cachedWeatherData = new Map(
    resorts.map((resort, index) => [resort.id, weatherDataArray[index]])
  )

  return cachedWeatherData
}

/**
 * Resort detail page with comprehensive weather and score breakdown
 */
export default async function ResortPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  cacheLife('hours')

  const { id } = await params

  // Fetch resort data
  const resort = await getResortById(id)
  if (!resort) {
    notFound()
  }

  // Get weather data from cache (batched fetch during generateStaticParams)
  const weatherDataMap = await getCachedWeatherData()
  const weatherData = weatherDataMap.get(id)
  if (!weatherData) {
    throw new Error('Failed to fetch weather data')
  }
  const scored = calculateResortScore(resort, weatherData)
  const openPercentage = getOpenPistePercentage(resort)

  // Extract time-series data for display
  const hourly = weatherData.hourly
  const daily = weatherData.daily

  return (
    <div className="container">
      {/* Back Link */}
      <Link
        href="/"
        style={{
          color: 'var(--glacier-blue)',
          marginBottom: 'var(--spacing-lg)',
          display: 'inline-block',
          textDecoration: 'none',
          fontWeight: '600',
        }}
      >
        ← Retour au classement
      </Link>

      {/* Header Section */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <Badge label={resort.region} variant="primary" />
            </div>
            <h1 style={{ margin: '0 0 0.5rem 0' }}>{resort.name}</h1>
            <p
              style={{
                margin: '0.25rem 0',
                fontSize: '0.95rem',
                color: '#666',
              }}
            >
              📍 Altitude: {resort.elevation}m | 🎿 Pistes totales: {resort.pisteInfo.total}km
            </p>
          </div>
          <ScoreIndicator score={scored.score} size="large" />
        </div>
      </section>

      {/* Score Breakdown */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Détail du Score</h2>
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <MetricBox label="Neige (48h)" value={scored.breakdown.recentSnowfall} unit="pts" />
            <MetricBox label="Profondeur" value={scored.breakdown.snowDepth} unit="pts" />
            <MetricBox label="Prévisions" value={scored.breakdown.forecastSnowfall} unit="pts" />
            <MetricBox label="Pistes ouvertes" value={scored.breakdown.pisteOpenings} unit="%" />
            <MetricBox label="Vent" value={scored.breakdown.wind} unit="pts" />
            <MetricBox label="Température" value={scored.breakdown.temperature} unit="pts" />
            <MetricBox label="Ensoleillement" value={scored.breakdown.sunshine} unit="pts" />
          </div>
        </Card>
      </section>

      {/* Conditions Summary */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Conditions Actuelles</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}
        >
          <Card>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '0.95rem' }}>
              Neige
            </h3>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Chute 48h:</strong> {scored.breakdown.recentSnowfall.toFixed(1)} cm
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Profondeur:</strong> {hourly.snow_depth[0]?.toFixed(0) || 0} cm
              </p>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '0.95rem' }}>
              Température
            </h3>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Moyenne:</strong> {scored.breakdown.temperature.toFixed(1)}°C
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Apparente:</strong> {(hourly.apparent_temperature?.[0] || 0).toFixed(1)}°C
              </p>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '0.95rem' }}>
              Vent & Soleil
            </h3>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Vitesse moyenne:</strong> {(hourly.windspeed_10m[0] || 0).toFixed(1)} m/s
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Ensoleillement:</strong> {scored.breakdown.sunshine.toFixed(1)} h
              </p>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '0.95rem' }}>
              Pistes
            </h3>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Ouvertes:</strong> {resort.pisteInfo.open} / {resort.pisteInfo.total} km
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Pourcentage:</strong> {openPercentage}%
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* 5-Day Forecast */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Prévisions 5 Jours</h2>
        <Card>
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glacier-blue)' }}>
                  <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Neige</th>
                  <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Temp. max</th>
                  <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Temp. min</th>
                  <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Soleil</th>
                </tr>
              </thead>
              <tbody>
                {daily.time.map((date, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--frost-gray)',
                      backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {new Date(date).toLocaleDateString('fr-CH', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {daily.snowfall_sum[idx]?.toFixed(1) || 0} cm
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {daily.temperature_2m_max[idx]?.toFixed(1) || 0}°C
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {daily.temperature_2m_min[idx]?.toFixed(1) || 0}°C
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {((daily.sunshine_duration[idx] || 0) / 3600).toFixed(1)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

/**
 * MetricBox component for score breakdown display
 */
function MetricBox({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
  return (
    <div>
      <p
        style={{
          margin: '0 0 0.5rem 0',
          fontSize: '0.875rem',
          color: '#666',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--deep-night-blue)',
        }}
      >
        {value.toFixed(1)} <span style={{ fontSize: '0.875rem' }}>{unit}</span>
      </p>
    </div>
  )
}
