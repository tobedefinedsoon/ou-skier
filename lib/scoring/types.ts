import type { Resort } from '@/lib/resorts/schemas'
import type { MeteoSwissResponse } from '@/lib/weather/schemas'
import type { ScoreBreakdown } from '@/lib/resorts/types'

/**
 * Score for a single day at a single resort
 */
export interface DayScore {
  day: number           // 0-4 (day index)
  date: string         // ISO date string from daily.time[day]
  score: number        // 0-100
  breakdown: ScoreBreakdown
}

/**
 * Resort with scores for all 5 days
 */
export interface MultiDayScoredResort extends Resort {
  dayScores: DayScore[]        // Array of 5 day scores (indexed 0-4)
  weather: MeteoSwissResponse
}

/**
 * Rankings for a specific day
 */
export interface DayRankings {
  day: number
  date: string
  resorts: import('@/lib/resorts/types').ScoredResort[]  // Sorted by that day's score
}
