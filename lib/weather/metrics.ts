import type { MeteoSwissResponse } from './schemas'
import type { WeatherMetrics } from './types'

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

/**
 * Extract weather metrics for a specific day (0-4)
 * Used for calculating day-specific scores
 */
export function extractDayMetrics(
  data: MeteoSwissResponse,
  dayIndex: number
): WeatherMetrics {
  // Hourly data: 120 hours total (5 days × 24 hours), 24 hours per day
  const hourStart = dayIndex * 24
  const hourEnd = hourStart + 24

  // Extract 24-hour window for this specific day
  const dayHourlySnowfall = data.hourly.snowfall.slice(hourStart, hourEnd)
  const dayHourlyTemp = data.hourly.temperature_2m.slice(hourStart, hourEnd)
  const dayHourlyWind = data.hourly.windspeed_10m.slice(hourStart, hourEnd)

  // Daily aggregates for this specific day
  const daySnowDepth = data.hourly.snow_depth[hourStart] || 0
  const daySnowfall = data.daily.snowfall_sum[dayIndex] || 0
  const daySunshine = data.daily.sunshine_duration[dayIndex] / 3600 // Convert seconds to hours

  // Helper function to calculate average
  const average = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return {
    snowfall48h: daySnowfall,  // Use day's forecast snowfall
    snowDepth: daySnowDepth,
    temperatureAvg: average(dayHourlyTemp),
    windSpeedAvg: average(dayHourlyWind),
    sunshineHours5d: daySunshine,  // Just this day's sunshine
    freezingLevelHeight: dayHourlyTemp[0] || 0,
  }
}
