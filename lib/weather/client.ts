'use cache'

import { cacheLife } from 'next/cache'
import { MeteoSwissResponseSchema, type MeteoSwissResponse } from './schemas'
import type { Resort } from '@/lib/resorts/schemas'

const METEOSWISS_API_URL = 'https://api.open-meteo.com/v1/forecast'

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
    'temperature_2m,snowfall,snow_depth,windspeed_10m'
  )
  url.searchParams.append(
    'daily',
    'snowfall_sum,sunshine_duration,temperature_2m_max,temperature_2m_min'
  )
  url.searchParams.append('timezone', 'Europe/Zurich')
  url.searchParams.append('forecast_days', '5')

  const urlString = url.toString()
  console.log('Fetching weather data from:', urlString)

  try {
    const response = await fetch(urlString)

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
