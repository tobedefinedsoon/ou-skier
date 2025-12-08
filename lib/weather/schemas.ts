import { z } from 'zod'

// MeteoSwiss API response schema for hourly data
const HourlyDataSchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(z.number()),
  snowfall: z.array(z.number()),
  snow_depth: z.array(z.number()),
  windspeed_10m: z.array(z.number()),
  windgusts_10m: z.array(z.number()),
  apparent_temperature: z.array(z.number()),
  direct_radiation: z.array(z.number()),
})

// MeteoSwiss API response schema for daily data
const DailyDataSchema = z.object({
  time: z.array(z.string()),
  snowfall_sum: z.array(z.number()),
  sunshine_duration: z.array(z.number()),
  temperature_2m_max: z.array(z.number()),
  temperature_2m_min: z.array(z.number()),
})

// Complete MeteoSwiss API response
export const MeteoSwissResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  timezone: z.string(),
  hourly: HourlyDataSchema,
  daily: DailyDataSchema,
  generationtime_ms: z.number().optional(),
})

export type MeteoSwissResponse = z.infer<typeof MeteoSwissResponseSchema>

// Processed weather data for a single resort
export const ProcessedWeatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  timezone: z.string(),
  hourly: HourlyDataSchema,
  daily: DailyDataSchema,
  // Computed values for scoring
  snowfall_48h: z.number(),
  snow_depth: z.number(),
  temperature_avg: z.number(),
  wind_speed_avg: z.number(),
  sunshine_hours_5d: z.number(),
})

export type ProcessedWeather = z.infer<typeof ProcessedWeatherSchema>
