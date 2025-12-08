import type { Resort } from '@/lib/resorts/schemas'
import type { MeteoSwissResponse } from '@/lib/weather/schemas'
import type { ScoredResort, ScoreBreakdown } from '@/lib/resorts/types'
import { getOpenPistePercentage } from '@/lib/resorts/data'
import { extractWeatherMetrics } from '@/lib/weather/client'

// Scoring weights (must sum to 100)
const WEIGHTS = {
  recentSnowfall: 0.25,    // 25%
  snowDepth: 0.2,          // 20%
  forecastSnowfall: 0.15,  // 15%
  pisteOpenings: 0.2,      // 20%
  wind: 0.1,               // 10%
  temperature: 0.05,       // 5%
  sunshine: 0.05,          // 5%
}

/**
 * Calculate ski resort score (0-100)
 * Combines weather, snow, and piste data into a single ranking metric
 */
export function calculateResortScore(
  resort: Resort,
  weatherData: MeteoSwissResponse
): ScoredResort {
  const metrics = extractWeatherMetrics(weatherData)
  const openPercentage = getOpenPistePercentage(resort)

  // Calculate individual factor scores (0-100)
  const recentSnowfallScore = calculateSnowfallScore(metrics.snowfall48h)
  const snowDepthScore = calculateSnowDepthScore(metrics.snowDepth)
  const forecastSnowfallScore = calculateForecastSnowfallScore(
    weatherData.daily.snowfall_sum
  )
  const pisteScore = openPercentage
  const windScore = calculateWindScore(metrics.windSpeedAvg)
  const temperatureScore = calculateTemperatureScore(metrics.temperatureAvg)
  const sunshineScore = calculateSunshineScore(metrics.sunshineHours5d)

  // Create breakdown
  const breakdown: ScoreBreakdown = {
    recentSnowfall: recentSnowfallScore,
    snowDepth: snowDepthScore,
    forecastSnowfall: forecastSnowfallScore,
    pisteOpenings: pisteScore,
    wind: windScore,
    temperature: temperatureScore,
    sunshine: sunshineScore,
  }

  // Weighted total score
  const totalScore = Math.round(
    recentSnowfallScore * WEIGHTS.recentSnowfall +
    snowDepthScore * WEIGHTS.snowDepth +
    forecastSnowfallScore * WEIGHTS.forecastSnowfall +
    pisteScore * WEIGHTS.pisteOpenings +
    windScore * WEIGHTS.wind +
    temperatureScore * WEIGHTS.temperature +
    sunshineScore * WEIGHTS.sunshine
  )

  return {
    ...resort,
    score: Math.min(100, Math.max(0, totalScore)), // Clamp to 0-100
    rank: 0, // Set by caller when sorting
    weather: weatherData,
    breakdown,
  }
}

/**
 * Calculate recent snowfall score (25% weight)
 * More is better: 0cm = 0 points, 50cm+ = 100 points
 */
function calculateSnowfallScore(snowfall48h: number): number {
  // Linear scale: 0-50cm maps to 0-100
  return Math.min(100, (snowfall48h / 50) * 100)
}

/**
 * Calculate snow depth score (20% weight)
 * More is better: 0cm = 0 points, 300cm+ = 100 points
 */
function calculateSnowDepthScore(snowDepth: number): number {
  // Linear scale: 0-300cm maps to 0-100
  return Math.min(100, (snowDepth / 300) * 100)
}

/**
 * Calculate forecast snowfall score (15% weight)
 * Sum of snowfall for next 5 days
 */
function calculateForecastSnowfallScore(snowfallSum: number[]): number {
  const totalSnowfall = snowfallSum.reduce((a, b) => a + b, 0)
  // Linear scale: 0-100cm maps to 0-100
  return Math.min(100, (totalSnowfall / 100) * 100)
}

/**
 * Calculate wind score (10% weight)
 * Inverse: lower wind = higher score
 * 0 m/s = 100 points, 20+ m/s = 0 points
 */
function calculateWindScore(windSpeedAvg: number): number {
  // Inverse linear: 0-20 m/s maps to 100-0
  return Math.max(0, 100 - (windSpeedAvg / 20) * 100)
}

/**
 * Calculate temperature score (5% weight)
 * Optimal range: -10°C to -2°C (best snow quality)
 * Uses Gaussian distribution with peak at -6°C
 */
function calculateTemperatureScore(temperatureAvg: number): number {
  const optimal = -6 // Optimal temperature in °C
  const stdDev = 3    // Standard deviation

  // Gaussian: e^(-(x-μ)²/(2σ²)) * 100
  const gaussian =
    Math.exp(-Math.pow(temperatureAvg - optimal, 2) / (2 * Math.pow(stdDev, 2))) * 100

  return Math.min(100, gaussian)
}

/**
 * Calculate sunshine score (5% weight)
 * More is better: 0 hours = 0 points, 40+ hours = 100 points
 */
function calculateSunshineScore(sunshineHours5d: number): number {
  // Linear scale: 0-40 hours maps to 0-100
  return Math.min(100, (sunshineHours5d / 40) * 100)
}

/**
 * Score multiple resorts and return sorted by score (descending)
 */
export function scoreResorts(
  resorts: Resort[],
  weatherDataArray: MeteoSwissResponse[]
): ScoredResort[] {
  if (resorts.length !== weatherDataArray.length) {
    throw new Error(
      'Mismatch between number of resorts and weather data responses'
    )
  }

  // Score each resort
  const scored = resorts.map((resort, index) => {
    return calculateResortScore(resort, weatherDataArray[index])
  })

  // Sort by score descending and add ranks
  return scored
    .sort((a, b) => b.score - a.score)
    .map((resort, index) => ({
      ...resort,
      rank: index + 1,
    }))
}

/**
 * Get top N resorts by score
 */
export function getTopResorts(
  scoredResorts: ScoredResort[],
  count: number = 3
): ScoredResort[] {
  return scoredResorts.slice(0, count)
}
