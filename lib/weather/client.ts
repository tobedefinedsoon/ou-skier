'use cache'

import { cacheLife } from 'next/cache'
import { MeteoSwissResponseSchema, type MeteoSwissResponse } from './schemas'
import type { Resort } from '@/lib/resorts/schemas'
import type { WeatherMetrics } from './types'

const METEOSWISS_API_URL = 'https://api.open-meteo.com/v1/meteoswiss'

/**
 * Fetch weather data for multiple resorts from MeteoSwiss API
 * Uses batching to get all resorts in a single API call
 */
export async function fetchWeatherForResorts(
  resorts: Resort[]
): Promise<MeteoSwissResponse[]> {
  cacheLife('hours') // 1-hour stale, 15-min revalidate

  if (resorts.length === 0) {
    return []
  }

  // Build arrays of coordinates for batched request
  const latitudes = resorts.map((r) => r.coordinates.lat).join(',')
  const longitudes = resorts.map((r) => r.coordinates.lon).join(',')

  const url = new URL(METEOSWISS_API_URL)
  url.searchParams.append('latitude', latitudes)
  url.searchParams.append('longitude', longitudes)
  url.searchParams.append(
    'hourly',
    'temperature_2m,snowfall,snow_depth,windspeed_10m,windgusts_10m,apparent_temperature,direct_radiation'
  )
  url.searchParams.append(
    'daily',
    'snowfall_sum,sunshine_duration,temperature_2m_max,temperature_2m_min'
  )
  url.searchParams.append('timezone', 'Europe/Zurich')
  url.searchParams.append('forecast_days', '5')

  try {
    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`MeteoSwiss API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Validate response structure
    // Note: For multiple locations, API returns an array of results
    if (Array.isArray(data.results)) {
      // Validate each result
      const validated = data.results.map((result: unknown) => {
        const validationResult = MeteoSwissResponseSchema.safeParse(result)
        if (!validationResult.success) {
          console.error('Invalid weather data:', validationResult.error)
          throw new Error('Invalid weather data format from MeteoSwiss API')
        }
        return validationResult.data
      })
      return validated
    } else {
      // Single location response (shouldn't happen with multiple coordinates, but handle it)
      const validationResult = MeteoSwissResponseSchema.safeParse(data)
      if (!validationResult.success) {
        throw new Error('Invalid weather data format from MeteoSwiss API')
      }
      return [validationResult.data]
    }
  } catch (error) {
    console.error('Failed to fetch weather data from MeteoSwiss API:', error)
    throw error
  }
}

/**
 * Extract weather metrics from MeteoSwiss API response
 * Computes values needed for scoring (snowfall, snow depth, temperature, wind, sunshine)
 */
export function extractWeatherMetrics(data: MeteoSwissResponse): WeatherMetrics {
  const hourly = data.hourly
  const daily = data.daily

  // Calculate 48-hour snowfall (approximate - take first 48 hours if available)
  const snowfall48h = Math.min(hourly.snowfall.length, 48) > 0
    ? hourly.snowfall.slice(0, 48).reduce((a, b) => a + b, 0)
    : 0

  // Get current snow depth (latest hourly value)
  const snowDepth = hourly.snow_depth[hourly.snow_depth.length - 1] || 0

  // Calculate average temperature (next 24 hours)
  const next24Temps = hourly.temperature_2m.slice(0, 24)
  const temperatureAvg = next24Temps.length > 0
    ? next24Temps.reduce((a, b) => a + b, 0) / next24Temps.length
    : 0

  // Calculate average wind speed (next 24 hours)
  const next24Winds = hourly.windspeed_10m.slice(0, 24)
  const windSpeedAvg = next24Winds.length > 0
    ? next24Winds.reduce((a, b) => a + b, 0) / next24Winds.length
    : 0

  // Calculate total sunshine hours for next 5 days
  const sunshineHours5d = daily.sunshine_duration.reduce((a, b) => a + b, 0) / 3600 // Convert seconds to hours

  // Get freezing level height (latest value)
  const freezingLevelHeight = hourly.temperature_2m[0] // Placeholder - MeteoSwiss provides this separately

  return {
    snowfall48h,
    snowDepth,
    temperatureAvg,
    windSpeedAvg,
    sunshineHours5d,
    freezingLevelHeight,
  }
}
