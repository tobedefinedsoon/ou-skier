import type { MeteoSwissResponse, ProcessedWeather } from './schemas'

export type { MeteoSwissResponse, ProcessedWeather }

// API response that includes multiple location results
export interface MeteoSwissAPIResponse {
  results: MeteoSwissResponse[]
}

// Computed weather metrics for scoring
export interface WeatherMetrics {
  snowfall48h: number          // cm of snow in last 48 hours
  snowDepth: number            // current snow depth in cm
  temperatureAvg: number       // average temperature in °C
  windSpeedAvg: number         // average wind speed in m/s
  sunshineHours5d: number      // total sunshine hours in next 5 days
  freezingLevelHeight: number  // freezing level height in meters
}

export interface RawHourlyData {
  time: string[]
  temperature_2m: number[]
  snowfall: number[]
  snow_depth: number[]
  windspeed_10m: number[]
  windgusts_10m: number[]
  apparent_temperature: number[]
  direct_radiation: number[]
}

export interface RawDailyData {
  time: string[]
  snowfall_sum: number[]
  sunshine_duration: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
}
