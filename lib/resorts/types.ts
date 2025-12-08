import type { Resort } from './schemas'
import type { MeteoSwissResponse } from '@/lib/weather/schemas'

export type { Resort }

// Resort with calculated score
export interface ScoredResort extends Resort {
  score: number
  rank: number
  weather: MeteoSwissResponse
  breakdown: ScoreBreakdown
}

// Score breakdown by factor
export interface ScoreBreakdown {
  recentSnowfall: number     // 25%
  snowDepth: number          // 20%
  forecastSnowfall: number   // 15%
  pisteOpenings: number      // 20%
  wind: number               // 10%
  temperature: number        // 5%
  sunshine: number           // 5%
}

// Top 3 resorts with rankings
export interface Top3Resorts {
  resorts: ScoredResort[]
  timestamp: Date
}
