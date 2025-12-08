'use cache'

import { cacheLife } from 'next/cache'
import { MeteoSwissResponseSchema, type MeteoSwissResponse } from './schemas'
import type { Resort } from '@/lib/resorts/schemas'

const METEOSWISS_API_URL = 'https://api.open-meteo.com/v1/forecast'

// In-memory cache for deduplicating requests during build
const requestCache = new Map<string, Promise<MeteoSwissResponse[]>>()

// Request queue to avoid overwhelming the API
let lastRequestTime = 0
const REQUEST_DELAY_MS = 500 // 500ms delay between requests

/**
 * Fetch weather data for multiple resorts from MeteoSwiss API
 * Uses batching to get all resorts in a single API call
 * Deduplicates in-flight requests to avoid rate limits
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

  // Create a cache key based on coordinates
  const cacheKey = `${latitudes}|${longitudes}`

  // Return existing in-flight request if available
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!
  }

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

  // Create the request promise
  const requestPromise = (async () => {
    // Enforce request delay to avoid rate limits
    const timeSinceLastRequest = Date.now() - lastRequestTime
    if (timeSinceLastRequest < REQUEST_DELAY_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, REQUEST_DELAY_MS - timeSinceLastRequest)
      )
    }
    lastRequestTime = Date.now()

    try {
      const response = await fetch(urlString)

      if (!response.ok) {
        throw new Error(`MeteoSwiss API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate response structure
      // Open-Meteo returns different structures based on input:
      // - Single location: returns object with latitude, longitude, hourly, daily, etc.
      // - Multiple locations: returns array of objects
      // - Some versions wrap multiple locations in "results" array
      let results: unknown[] = []

      if (Array.isArray(data)) {
        // Direct array response (multiple locations)
        results = data
      } else if (data.results && Array.isArray(data.results)) {
        // Wrapped in results object (some API versions)
        results = data.results
      } else if (data.latitude !== undefined && data.longitude !== undefined) {
        // Single location response
        results = [data]
      } else {
        console.error('Unexpected response structure:', JSON.stringify(data, null, 2))
        throw new Error('Unexpected API response structure')
      }

      // Validate each result
      const validated = results.map((result: unknown) => {
        const validationResult = MeteoSwissResponseSchema.safeParse(result)
        if (!validationResult.success) {
          console.error('Invalid weather data:', validationResult.error)
          console.error('Actual response structure:', JSON.stringify(result, null, 2))
          throw new Error('Invalid weather data format from MeteoSwiss API')
        }
        return validationResult.data
      })
      return validated
    } catch (error) {
      console.error('Failed to fetch weather data from MeteoSwiss API:', error)
      throw error
    }
  })()

  // Store the promise in cache for deduplication
  requestCache.set(cacheKey, requestPromise)

  return requestPromise
}
