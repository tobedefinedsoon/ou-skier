# Migration Plan: Open-Meteo → infosnow.ch API

## Executive Summary

Complete replacement of Open-Meteo weather data with infosnow.ch API to provide:
- **Live piste opening data** (vs static JSON)
- **Resort-reported snow measurements** (vs model estimates)
- **Industry standard data source** (used by MySwitzerland and major ski sites)

**API Choice**: Use infosnow.ch API Type 1 (T1 XML) - simpler, well-documented, read-only

**Key Challenge**: 64 individual API calls (2 per resort) vs current 1 batched call
**Mitigation**: Parallel fetching with Next.js caching (1h stale time)

---

## Step 1: Obtain API Access

### 1.1 Request API Credentials

Contact APG|SGA to request access to the infosnow.ch API.

**Email Template**:

```
Subject: API Access Request for infosnow.ch - Où Skier! Application

Dear infosnow.ch / APG|SGA Team,

I am writing to request API access for my non-commercial web application "Où Skier!"
(https://[your-domain-here]).

PROJECT DETAILS:
- Name: Où Skier! (Where to Ski!)
- Purpose: A ranking application that helps Swiss ski enthusiasts find the best resorts
  to visit over the next 5 days based on weather conditions, snowfall forecasts,
  sunshine hours, and piste openings
- Type: Non-commercial, open-source educational project
- Technology: Next.js 16 web application

DATA REQUIREMENTS:
I would like access to the following API endpoints:
- WTDaily: Weather and snow condition data (snow depth, recent snowfall, temperature)
- METEOSRF: 7-day weather forecasts (temperature, wind, sunshine)
- SKIPISTE: Live piste opening status and counts

USAGE DETAILS:
- Target resorts: 32 Swiss ski resorts across Valais, Vaud, and Bern regions
- Request frequency: ~64 API calls per hour (2 endpoints per resort)
- Caching: 1-hour cache with 15-minute background revalidation
- Data redistribution: Only aggregate rankings displayed, not raw API data export

TECHNICAL IMPLEMENTATION:
- Respectful API usage with 500ms rate limiting between requests
- Minimum 10-second interval for identical requests (per API guidelines)
- Proper attribution to infosnow.ch as data source in application footer

I have reviewed the terms of use at https://infosnow.ch/doc/ and commit to:
- Not redistributing data without explicit written permission
- Not reselling or commercializing the data
- Providing proper attribution to infosnow.ch

Could you please provide:
1. KeyPass credentials for token generation (https://infosnow.ch/api/?p=244)
2. Confirmation of which API endpoints are available for my use case
3. Any specific usage limits or guidelines I should follow

I would be happy to provide additional project details or answer any questions.

Thank you for considering my request.

Best regards,
[Your Name]
[Contact Information]
[Project GitHub URL if applicable]
```

### 1.2 Generate API Token

Once you receive KeyPass credentials:

1. Visit https://infosnow.ch/api/?p=244
2. Enter your KeyPass (can only be used ONCE)
3. Generate and save your API token
4. Store securely in environment variables

**Important**: Never commit the token to version control!

### 1.3 Configure Environment

Create `.env.local` in project root:

```bash
# Infosnow.ch API Token
INFOSNOW_API_TOKEN=your_token_here

# API Base URL
INFOSNOW_API_BASE_URL=https://infosnow.ch/api/v1
```

Create `.env.example` for documentation:

```bash
# Infosnow.ch API Token
# Obtain from: https://infosnow.ch/api/?p=244
INFOSNOW_API_TOKEN=

# API Base URL (default: https://infosnow.ch/api/v1)
INFOSNOW_API_BASE_URL=https://infosnow.ch/api/v1
```

Verify `.gitignore` excludes `.env.local`:

```bash
.env.local
.env*.local
```

---

## Step 2: Create Resort ID Mapping

**BLOCKING REQUIREMENT**: Must manually map all 32 resorts to infosnow.ch numeric IDs.

### 2.1 Find infosnow.ch IDs

For each resort in `data/resorts.json`, find its infosnow.ch ID:

**Method 1: Browse infosnow.ch website**
1. Visit https://www.infosnow.ch
2. Search for each resort
3. Extract ID from URL (e.g., Zermatt might be `resortId=301`)

**Method 2: Check other ski websites**
- Many sites use infosnow.ch data and may expose IDs in network requests
- Use browser DevTools Network tab

**Method 3: Contact infosnow.ch**
- Request a list of resort IDs as part of your API access email

### 2.2 Create Mapping File

Create `data/infosnow-resort-mapping.json`:

```json
[
  {
    "resortId": "zermatt",
    "infosnowId": 301,
    "name": "Zermatt"
  },
  {
    "resortId": "verbier",
    "infosnowId": 456,
    "name": "Verbier"
  },
  {
    "resortId": "saas-fee",
    "infosnowId": 789,
    "name": "Saas-Fee"
  }
  // ... 29 more resorts
]
```

**Notes**:
- `resortId` must match the `id` field in `data/resorts.json`
- `infosnowId` is the numeric ID from infosnow.ch API
- `name` is for human reference only

### 2.3 Validate Mapping

Create validation script `scripts/validate-infosnow-mapping.ts`:

```typescript
// For each mapped resort:
// 1. Fetch WTDaily data using infosnowId
// 2. Verify response contains valid data
// 3. Report any failed mappings
// 4. Exit with error if any mappings invalid
```

Run validation:
```bash
npx tsx scripts/validate-infosnow-mapping.ts
```

---

## Step 3: Install Dependencies

Install XML parsing library:

```bash
npm install fast-xml-parser
```

This library converts XML responses to JavaScript objects compatible with Zod validation.

---

## Step 4: Create Infosnow Data Layer

### 4.1 Create Directory Structure

```bash
mkdir -p lib/weather/infosnow
```

### 4.2 Create Mapping Utilities

**File**: `lib/weather/infosnow/mapping.ts`

```typescript
import resortMappings from '@/data/infosnow-resort-mapping.json'

export interface InfosnowResortMapping {
  resortId: string
  infosnowId: number
  name: string
  hasData?: boolean
}

const mappingCache = new Map<string, InfosnowResortMapping>()

// Load mappings into cache
resortMappings.forEach(mapping => {
  mappingCache.set(mapping.resortId, mapping)
})

/**
 * Get infosnow.ch ID for a resort
 * @param resortId Resort ID from resorts.json
 * @returns infosnow.ch numeric ID or null if not found
 */
export function getInfosnowResortId(resortId: string): number | null {
  const mapping = mappingCache.get(resortId)
  return mapping?.infosnowId ?? null
}

/**
 * Get all resort mappings
 */
export function getAllMappings(): Map<string, InfosnowResortMapping> {
  return mappingCache
}

/**
 * Check if resort has infosnow.ch mapping
 */
export function hasInfosnowMapping(resortId: string): boolean {
  return mappingCache.has(resortId)
}
```

### 4.3 Create Type Definitions

**File**: `lib/weather/infosnow/types.ts`

```typescript
import { z } from 'zod'

export interface InfosnowResortMapping {
  resortId: string
  infosnowId: number
  name: string
  hasData?: boolean
}

// WTDaily data structure
export interface WTDailyData {
  resortId: number
  snowHeightResort: number // cm
  snowHeightArenaLow: number // cm
  snowHeightArenaHigh: number // cm
  snowHeightNewResort: number // 24h snowfall in cm
  snowHeightNewArenaLow: number
  snowHeightNewArenaHigh: number
  lastSnowDate: string // ISO date
  snowMaking: boolean
  forecastToday: WeatherForecast
  forecastTomorrow: WeatherForecast
  forecastAfterTomorrow: WeatherForecast
}

export interface WeatherForecast {
  weatherSymbol: number
  temperature: number // °C
}

// METEOSRF data structure
export interface MeteoSRFData {
  resortId: number
  forecasts: DayForecast[]
}

export interface DayForecast {
  date: string // ISO date
  minTemp: number // °C
  maxTemp: number // °C
  windForce: number // km/h
  windGusts: number // km/h
  sunshineHours: number // hours
  weatherSymbol: number
  rainProbability: number // %
  rainfallAmount: number // mm
}

// Combined response
export interface InfosnowWeatherResponse {
  resortId: number
  wtDaily: WTDailyData
  meteoSRF: MeteoSRFData
}
```

### 4.4 Create Zod Schemas

**File**: `lib/weather/infosnow/schemas.ts`

```typescript
import { z } from 'zod'

export const WeatherForecastSchema = z.object({
  weatherSymbol: z.number(),
  temperature: z.number(),
})

export const WTDailySchema = z.object({
  resortId: z.number(),
  snowHeightResort: z.number(),
  snowHeightArenaLow: z.number(),
  snowHeightArenaHigh: z.number(),
  snowHeightNewResort: z.number(),
  snowHeightNewArenaLow: z.number(),
  snowHeightNewArenaHigh: z.number(),
  lastSnowDate: z.string(),
  snowMaking: z.boolean(),
  forecastToday: WeatherForecastSchema,
  forecastTomorrow: WeatherForecastSchema,
  forecastAfterTomorrow: WeatherForecastSchema,
})

export const DayForecastSchema = z.object({
  date: z.string(),
  minTemp: z.number(),
  maxTemp: z.number(),
  windForce: z.number(),
  windGusts: z.number(),
  sunshineHours: z.number(),
  weatherSymbol: z.number(),
  rainProbability: z.number(),
  rainfallAmount: z.number(),
})

export const MeteoSRFSchema = z.object({
  resortId: z.number(),
  forecasts: z.array(DayForecastSchema),
})

export const InfosnowWeatherResponseSchema = z.object({
  resortId: z.number(),
  wtDaily: WTDailySchema,
  meteoSRF: MeteoSRFSchema,
})

export type WTDailyData = z.infer<typeof WTDailySchema>
export type MeteoSRFData = z.infer<typeof MeteoSRFSchema>
export type InfosnowWeatherResponse = z.infer<typeof InfosnowWeatherResponseSchema>
```

### 4.5 Create XML Parser

**File**: `lib/weather/infosnow/parser.ts`

```typescript
import { XMLParser } from 'fast-xml-parser'
import { WTDailyData, MeteoSRFData } from './types'
import { WTDailySchema, MeteoSRFSchema } from './schemas'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

/**
 * Parse WTDaily XML response
 */
export function parseWTDailyXML(xmlString: string, resortId: number): WTDailyData {
  const parsed = parser.parse(xmlString)

  // Extract data from XML structure
  // Adjust path based on actual API response structure
  const data = parsed.resort || parsed

  const result: WTDailyData = {
    resortId,
    snowHeightResort: parseFloat(data.snowHeightResort) || 0,
    snowHeightArenaLow: parseFloat(data.snowHeightArenaLow) || 0,
    snowHeightArenaHigh: parseFloat(data.snowHeightArenaHigh) || 0,
    snowHeightNewResort: parseFloat(data.snowHeightNewResort) || 0,
    snowHeightNewArenaLow: parseFloat(data.snowHeightNewArenaLow) || 0,
    snowHeightNewArenaHigh: parseFloat(data.snowHeightNewArenaHigh) || 0,
    lastSnowDate: data.lastSnowDate || new Date().toISOString(),
    snowMaking: data.snowMaking === 'true' || data.snowMaking === true,
    forecastToday: {
      weatherSymbol: parseInt(data.forecastToday?.weatherSymbol) || 0,
      temperature: parseFloat(data.forecastToday?.temperature) || 0,
    },
    forecastTomorrow: {
      weatherSymbol: parseInt(data.forecastTomorrow?.weatherSymbol) || 0,
      temperature: parseFloat(data.forecastTomorrow?.temperature) || 0,
    },
    forecastAfterTomorrow: {
      weatherSymbol: parseInt(data.forecastAfterTomorrow?.weatherSymbol) || 0,
      temperature: parseFloat(data.forecastAfterTomorrow?.temperature) || 0,
    },
  }

  // Validate with Zod
  return WTDailySchema.parse(result)
}

/**
 * Parse METEOSRF XML response
 */
export function parseMeteoSRFXML(xmlString: string, resortId: number): MeteoSRFData {
  const parsed = parser.parse(xmlString)

  // Extract forecast array from XML
  const forecastsRaw = Array.isArray(parsed.forecasts?.day)
    ? parsed.forecasts.day
    : [parsed.forecasts?.day].filter(Boolean)

  const forecasts = forecastsRaw.map((day: any) => ({
    date: day.date || '',
    minTemp: parseFloat(day.minTemp) || 0,
    maxTemp: parseFloat(day.maxTemp) || 0,
    windForce: parseFloat(day.windForce) || 0,
    windGusts: parseFloat(day.windGusts) || 0,
    sunshineHours: parseFloat(day.sunshineHours) || 0,
    weatherSymbol: parseInt(day.weatherSymbol) || 0,
    rainProbability: parseFloat(day.rainProbability) || 0,
    rainfallAmount: parseFloat(day.rainfallAmount) || 0,
  }))

  const result: MeteoSRFData = {
    resortId,
    forecasts,
  }

  // Validate with Zod
  return MeteoSRFSchema.parse(result)
}
```

### 4.6 Create API Client

**File**: `lib/weather/infosnow/client.ts`

```typescript
'use cache'

import { cacheLife } from 'next/dist/server/use-cache/cache-life'
import { getInfosnowResortId } from './mapping'
import { parseWTDailyXML, parseMeteoSRFXML } from './parser'
import { WTDailyData, MeteoSRFData, InfosnowWeatherResponse } from './types'
import type { Resort } from '@/lib/resorts/types'

const API_TOKEN = process.env.INFOSNOW_API_TOKEN
const API_BASE_URL = process.env.INFOSNOW_API_BASE_URL || 'https://infosnow.ch/api/v1'
const REQUEST_DELAY_MS = 500

let lastRequestTime = 0

/**
 * Enforce rate limiting between requests
 */
async function enforceRateLimit() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, REQUEST_DELAY_MS - timeSinceLastRequest)
    )
  }

  lastRequestTime = Date.now()
}

/**
 * Fetch WTDaily data (snow and weather) for a resort
 */
async function fetchWTDaily(resortId: number): Promise<WTDailyData> {
  await enforceRateLimit()

  const url = `${API_BASE_URL}/export?resortId=${resortId}&token=${API_TOKEN}&type=WTDaily`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`WTDaily API error: ${response.status}`)
    }

    const xmlText = await response.text()
    return parseWTDailyXML(xmlText, resortId)
  } catch (error) {
    console.error(`[Infosnow] Failed to fetch WTDaily for resort ${resortId}:`, error)
    throw error
  }
}

/**
 * Fetch METEOSRF data (7-day forecasts) for a resort
 */
async function fetchMETEOSRF(resortId: number): Promise<MeteoSRFData> {
  await enforceRateLimit()

  const url = `${API_BASE_URL}/export?resortId=${resortId}&token=${API_TOKEN}&type=METEOSRF`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`METEOSRF API error: ${response.status}`)
    }

    const xmlText = await response.text()
    return parseMeteoSRFXML(xmlText, resortId)
  } catch (error) {
    console.error(`[Infosnow] Failed to fetch METEOSRF for resort ${resortId}:`, error)
    throw error
  }
}

/**
 * Fetch complete weather data for a single resort
 */
async function fetchResortWeather(resort: Resort): Promise<InfosnowWeatherResponse | null> {
  const infosnowId = getInfosnowResortId(resort.id)

  if (!infosnowId) {
    console.warn(`[Infosnow] No mapping found for resort: ${resort.name}`)
    return null
  }

  try {
    // Fetch both endpoints in parallel
    const [wtDaily, meteoSRF] = await Promise.all([
      fetchWTDaily(infosnowId),
      fetchMETEOSRF(infosnowId),
    ])

    return {
      resortId: infosnowId,
      wtDaily,
      meteoSRF,
    }
  } catch (error) {
    console.error(`[Infosnow] Failed to fetch weather for ${resort.name}:`, error)
    return null
  }
}

/**
 * Fetch weather data for multiple resorts with batching
 */
export async function fetchInfosnowWeatherForResorts(
  resorts: Resort[]
): Promise<(InfosnowWeatherResponse | null)[]> {
  cacheLife('hours')

  const BATCH_SIZE = 10
  const results: (InfosnowWeatherResponse | null)[] = []

  const startTime = Date.now()

  for (let i = 0; i < resorts.length; i += BATCH_SIZE) {
    const batch = resorts.slice(i, i + BATCH_SIZE)

    // Fetch batch in parallel
    const batchResults = await Promise.all(
      batch.map(resort => fetchResortWeather(resort))
    )

    results.push(...batchResults)

    console.log(
      `[Infosnow] Fetched batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(resorts.length / BATCH_SIZE)}`
    )
  }

  const duration = Date.now() - startTime
  console.log(`[Infosnow] Fetched weather for ${resorts.length} resorts in ${duration}ms`)

  return results
}
```

---

## Step 5: Update Weather Metrics Extraction

**File**: `lib/weather/metrics.ts`

Update both extraction functions to work with infosnow.ch data:

```typescript
import type { WeatherMetrics } from './types'
import type { InfosnowWeatherResponse } from './infosnow/types'

/**
 * Extract 5-day aggregate weather metrics from infosnow.ch data
 * Used for overall scoring across the entire forecast period
 */
export function extractWeatherMetrics(data: InfosnowWeatherResponse): WeatherMetrics {
  const { wtDaily, meteoSRF } = data

  // 1. Calculate 48h snowfall
  // Average new snow across 3 locations, multiply by 2 for ~48h estimate
  const avgNewSnow24h = (
    wtDaily.snowHeightNewResort +
    wtDaily.snowHeightNewArenaLow +
    wtDaily.snowHeightNewArenaHigh
  ) / 3
  const snowfall48h = avgNewSnow24h * 2

  // 2. Get current snow depth
  // Average across 3 locations (resort, low arena, high arena)
  const snowDepth = (
    wtDaily.snowHeightResort +
    wtDaily.snowHeightArenaLow +
    wtDaily.snowHeightArenaHigh
  ) / 3

  // 3. Calculate average temperature for next 24h (day 0)
  const day0Forecast = meteoSRF.forecasts[0]
  const temperatureAvg = day0Forecast
    ? (day0Forecast.minTemp + day0Forecast.maxTemp) / 2
    : 0

  // 4. Calculate average wind speed (convert km/h to m/s)
  const windSpeedAvg = day0Forecast
    ? day0Forecast.windForce / 3.6
    : 0

  // 5. Calculate total sunshine hours for next 5 days
  const sunshineHours5d = meteoSRF.forecasts
    .slice(0, 5)
    .reduce((sum, f) => sum + f.sunshineHours, 0)

  // 6. Freezing level height (approximate from temperature)
  const freezingLevelHeight = temperatureAvg

  return {
    snowfall48h: Math.max(0, snowfall48h),
    snowDepth: Math.max(0, snowDepth),
    temperatureAvg,
    windSpeedAvg: Math.max(0, windSpeedAvg),
    sunshineHours5d: Math.max(0, sunshineHours5d),
    freezingLevelHeight,
  }
}

/**
 * Extract weather metrics for a specific day (0-6)
 * Days 0-2: Use WTDaily + METEOSRF (live + forecast)
 * Days 3-6: Use METEOSRF only (forecast)
 */
export function extractDayMetrics(
  data: InfosnowWeatherResponse,
  dayIndex: number
): WeatherMetrics {
  const { wtDaily, meteoSRF } = data

  // Validate day index
  if (dayIndex < 0 || dayIndex >= meteoSRF.forecasts.length) {
    console.warn(`[Metrics] Day ${dayIndex} out of range, returning defaults`)
    return getDefaultMetrics()
  }

  const dayForecast = meteoSRF.forecasts[dayIndex]

  // Snow depth: Use live data for day 0, extrapolate for future days
  let snowDepth: number
  if (dayIndex === 0) {
    // Day 0: Use live WTDaily measurements
    snowDepth = (
      wtDaily.snowHeightResort +
      wtDaily.snowHeightArenaLow +
      wtDaily.snowHeightArenaHigh
    ) / 3
  } else {
    // Future days: Use current depth as baseline
    // (Could be enhanced to add forecast snowfall, but METEOSRF provides rainfall not snowfall)
    snowDepth = (
      wtDaily.snowHeightResort +
      wtDaily.snowHeightArenaLow +
      wtDaily.snowHeightArenaHigh
    ) / 3
  }

  // 48h snowfall: Use 24h new snow from WTDaily × 2 for day 0, or forecast rainfall for future
  const snowfall48h = dayIndex === 0
    ? ((wtDaily.snowHeightNewResort + wtDaily.snowHeightNewArenaLow + wtDaily.snowHeightNewArenaHigh) / 3) * 2
    : dayForecast.rainfallAmount // Approximate (rainfall may not all be snow)

  // Temperature: Average of min/max for the day
  const temperatureAvg = (dayForecast.minTemp + dayForecast.maxTemp) / 2

  // Wind speed: Convert km/h to m/s
  const windSpeedAvg = dayForecast.windForce / 3.6

  // Sunshine: Direct from forecast (per day)
  const sunshineHours5d = dayForecast.sunshineHours

  return {
    snowfall48h: Math.max(0, snowfall48h),
    snowDepth: Math.max(0, snowDepth),
    temperatureAvg,
    windSpeedAvg: Math.max(0, windSpeedAvg),
    sunshineHours5d: Math.max(0, sunshineHours5d),
    freezingLevelHeight: temperatureAvg,
  }
}

/**
 * Default metrics for error cases
 */
function getDefaultMetrics(): WeatherMetrics {
  return {
    snowfall48h: 0,
    snowDepth: 0,
    temperatureAvg: 0,
    windSpeedAvg: 0,
    sunshineHours5d: 0,
    freezingLevelHeight: 0,
  }
}
```

---

## Step 6: Update Weather Client

**File**: `lib/weather/client.ts`

Replace Open-Meteo client with infosnow.ch client:

```typescript
'use cache'

import { cacheLife } from 'next/dist/server/use-cache/cache-life'
import { fetchInfosnowWeatherForResorts } from './infosnow/client'
import type { Resort } from '@/lib/resorts/types'
import type { InfosnowWeatherResponse } from './infosnow/types'

/**
 * Fetch weather data for all resorts
 * Uses infosnow.ch API (WTDaily + METEOSRF endpoints)
 */
export async function fetchWeatherForResorts(
  resorts: Resort[]
): Promise<(InfosnowWeatherResponse | null)[]> {
  cacheLife('hours')

  console.log(`[Weather] Fetching data for ${resorts.length} resorts from infosnow.ch`)

  return fetchInfosnowWeatherForResorts(resorts)
}
```

---

## Step 7: Add Live Piste Data Integration

### 7.1 Add SKIPISTE Fetching

**File**: `lib/weather/infosnow/client.ts`

Add function to fetch live piste data:

```typescript
/**
 * Fetch SKIPISTE data (piste openings) for a resort
 */
async function fetchSKIPISTE(resortId: number): Promise<{ total: number; open: number }> {
  await enforceRateLimit()

  const url = `${API_BASE_URL}/export?resortId=${resortId}&token=${API_TOKEN}&type=SKIPISTE`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`SKIPISTE API error: ${response.status}`)
    }

    const xmlText = await response.text()
    const parsed = parser.parse(xmlText)

    // Count pistes by status
    const pistes = Array.isArray(parsed.pistes?.piste)
      ? parsed.pistes.piste
      : [parsed.pistes?.piste].filter(Boolean)

    const total = pistes.length
    const open = pistes.filter((p: any) => p.status === 'open' || p.status === '1').length

    return { total, open }
  } catch (error) {
    console.error(`[Infosnow] Failed to fetch SKIPISTE for resort ${resortId}:`, error)
    throw error
  }
}

/**
 * Enrich resorts with live piste opening data
 */
export async function enrichResortsWithLivePisteData(resorts: Resort[]): Promise<Resort[]> {
  const results = await Promise.all(
    resorts.map(async (resort) => {
      const infosnowId = getInfosnowResortId(resort.id)

      if (!infosnowId) {
        console.warn(`[Infosnow] No mapping for resort: ${resort.name}`)
        return resort
      }

      try {
        const pisteData = await fetchSKIPISTE(infosnowId)

        return {
          ...resort,
          pisteInfo: {
            ...resort.pisteInfo,
            open: pisteData.open,
            total: pisteData.total || resort.pisteInfo.total,
          },
        }
      } catch (error) {
        console.error(`[Infosnow] Failed to get piste data for ${resort.name}:`, error)
        return resort // Fallback to static data
      }
    })
  )

  return results
}
```

### 7.2 Update Main Page

**File**: `app/page.tsx`

Add live piste data enrichment:

```typescript
import { enrichResortsWithLivePisteData } from '@/lib/weather/infosnow/client'

export default async function HomePage() {
  // Get resorts
  const resortsStatic = await getResorts()

  // Enrich with live piste data
  const resorts = await enrichResortsWithLivePisteData(resortsStatic)

  // Fetch weather data
  const weatherData = await fetchWeatherForResorts(resorts)

  // ... rest of existing logic
}
```

---

## Step 8: Update Type Definitions

**File**: `lib/resorts/types.ts`

Update `ScoredResort` to use new weather data type:

```typescript
import type { InfosnowWeatherResponse } from '@/lib/weather/infosnow/types'

export interface ScoredResort extends Resort {
  score: number
  rank: number
  weather: InfosnowWeatherResponse | null // Updated type
  breakdown: ScoreBreakdown
}
```

---

## Step 9: Testing

### 9.1 Unit Tests

Create test files:

**File**: `lib/weather/infosnow/__tests__/parser.test.ts`

```typescript
import { parseWTDailyXML, parseMeteoSRFXML } from '../parser'

describe('XML Parser', () => {
  it('should parse WTDaily XML correctly', () => {
    const xmlSample = `<?xml version="1.0"?>
      <resort>
        <snowHeightResort>120</snowHeightResort>
        <snowHeightNewResort>15</snowHeightNewResort>
        ...
      </resort>`

    const result = parseWTDailyXML(xmlSample, 301)

    expect(result.resortId).toBe(301)
    expect(result.snowHeightResort).toBe(120)
    expect(result.snowHeightNewResort).toBe(15)
  })

  it('should handle malformed XML gracefully', () => {
    const badXML = '<invalid>'

    expect(() => parseWTDailyXML(badXML, 301)).toThrow()
  })
})
```

**File**: `lib/weather/__tests__/metrics.test.ts`

```typescript
import { extractWeatherMetrics, extractDayMetrics } from '../metrics'

describe('Weather Metrics Extraction', () => {
  const mockData: InfosnowWeatherResponse = {
    resortId: 301,
    wtDaily: {
      resortId: 301,
      snowHeightResort: 100,
      snowHeightArenaLow: 80,
      snowHeightArenaHigh: 120,
      snowHeightNewResort: 10,
      snowHeightNewArenaLow: 8,
      snowHeightNewArenaHigh: 12,
      // ... other fields
    },
    meteoSRF: {
      resortId: 301,
      forecasts: [
        {
          date: '2025-12-09',
          minTemp: -8,
          maxTemp: -2,
          windForce: 18, // km/h
          sunshineHours: 6,
          // ... other fields
        },
        // ... 6 more days
      ],
    },
  }

  it('should calculate correct snow depth average', () => {
    const metrics = extractWeatherMetrics(mockData)

    expect(metrics.snowDepth).toBe(100) // (100 + 80 + 120) / 3
  })

  it('should convert wind speed from km/h to m/s', () => {
    const metrics = extractWeatherMetrics(mockData)

    expect(metrics.windSpeedAvg).toBeCloseTo(18 / 3.6, 1) // 5 m/s
  })

  it('should extract day-specific metrics', () => {
    const dayMetrics = extractDayMetrics(mockData, 0)

    expect(dayMetrics.temperatureAvg).toBe(-5) // (-8 + -2) / 2
    expect(dayMetrics.sunshineHours5d).toBe(6)
  })
})
```

Run tests:
```bash
npm test
```

### 9.2 Integration Testing

Create comparison script `scripts/compare-apis.ts`:

```typescript
import { getResorts } from '@/lib/resorts/data'
import { fetchWeatherForResorts } from '@/lib/weather/client'
import { extractWeatherMetrics } from '@/lib/weather/metrics'
import { calculateResortScore } from '@/lib/scoring/engine'

async function compareAPIs() {
  // Get Zermatt (or any test resort)
  const resorts = await getResorts()
  const zermatt = resorts.find(r => r.id === 'zermatt')

  if (!zermatt) {
    console.error('Zermatt not found')
    return
  }

  // Fetch infosnow.ch data
  const infosnowData = await fetchWeatherForResorts([zermatt])

  if (!infosnowData[0]) {
    console.error('Failed to fetch infosnow.ch data')
    return
  }

  // Extract metrics and calculate score
  const metrics = extractWeatherMetrics(infosnowData[0])
  const score = calculateResortScore(zermatt, infosnowData[0])

  console.log('\n--- Zermatt Data Comparison ---')
  console.log('\nInfosnow.ch Metrics:')
  console.log('  Snow depth:', metrics.snowDepth, 'cm')
  console.log('  48h snowfall:', metrics.snowfall48h, 'cm')
  console.log('  Temperature:', metrics.temperatureAvg, '°C')
  console.log('  Wind speed:', metrics.windSpeedAvg, 'm/s')
  console.log('  Sunshine (5d):', metrics.sunshineHours5d, 'hours')
  console.log('\nScore:', score.score)
  console.log('Breakdown:', JSON.stringify(score.breakdown, null, 2))
}

compareAPIs()
```

Run comparison:
```bash
npx tsx scripts/compare-apis.ts
```

### 9.3 Manual Testing Checklist

Test the application thoroughly:

- [ ] **Homepage loads successfully**
  - Top 3 resorts displayed with scores
  - Score breakdowns shown for each resort
  - No console errors

- [ ] **Day selector works**
  - Can switch between days 0-4
  - Rankings update for each day
  - Scores recalculate correctly

- [ ] **All 32 resorts have data**
  - Check that no resorts are missing
  - Verify all have reasonable scores
  - Confirm live piste data updates

- [ ] **Data accuracy**
  - Snow depths seem realistic (100-300cm typical)
  - Temperatures reasonable for Alps (-10°C to 5°C)
  - Sunshine hours realistic (0-12h per day)

- [ ] **Performance**
  - Initial load time <5 seconds
  - Subsequent loads use cache (<1 second)
  - No excessive API calls in logs

- [ ] **Error handling**
  - If 1-2 resorts fail, app still works
  - Graceful fallback to static data
  - Error messages logged but not shown to user

- [ ] **Build succeeds**
  ```bash
  npm run build
  ```

- [ ] **Production mode works**
  ```bash
  npm run start
  ```

---

## Step 10: Update Documentation

**File**: `CLAUDE.md`

Replace the "Why Open-Meteo?" section with:

```markdown
### Why infosnow.ch?
- **Industry Standard**: Official data source used by MySwitzerland and major Swiss ski websites
- **Live Piste Data**: Real-time piste opening status (vs static JSON)
- **Resort-Reported Snow**: Accurate measurements reported by resorts (vs weather model estimates)
- **Multiple Measurement Points**: Average of 3 locations per resort (resort base, lower arena, upper arena)
- **Comprehensive Data**: Weather forecasts, snow conditions, and facility status in one API
- **API Type 1 (T1)**: Simple XML-based read-only API with 7-day forecasts
```

Update the "Weather API" section:

```markdown
### Weather API

- **Provider**: infosnow.ch (APG|SGA)
- **Endpoints**:
  - WTDaily: Snow depth, 24h snowfall, 3-day weather forecasts
  - METEOSRF: 7-day temperature, wind, sunshine forecasts
  - SKIPISTE: Live piste opening counts and status
- **Format**: XML (parsed with fast-xml-parser)
- **Batching**: 10 concurrent requests with 500ms rate limiting
- **Rate Limiting**: Minimum 500ms between requests, 10-second interval for identical requests
- **Authentication**: Token-based (stored in INFOSNOW_API_TOKEN environment variable)
- **Response Handling**: All responses validated with Zod schemas
- **Caching**: Next.js 16 'use cache' with 1h stale time, 15min revalidate
```

Add environment setup section:

```markdown
### Environment Setup

Required environment variables in `.env.local`:

```bash
# Infosnow.ch API Token (obtain from https://infosnow.ch/api/?p=244)
INFOSNOW_API_TOKEN=your_token_here

# API Base URL (default: https://infosnow.ch/api/v1)
INFOSNOW_API_BASE_URL=https://infosnow.ch/api/v1
```

**Security**: Never commit `.env.local` to version control!
```

---

## Step 11: Deployment

### 11.1 Pre-Deployment Checklist

Before deploying to production:

- [ ] All unit tests passing: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual testing complete (see Step 9.3)
- [ ] Environment variables configured in production hosting
- [ ] Resort mapping JSON validated (all 32 resorts mapped)
- [ ] `.env.local` excluded from git (verify with `git status`)
- [ ] Documentation updated (CLAUDE.md)
- [ ] Rollback plan documented

### 11.2 Deploy to Staging

1. **Build locally**:
   ```bash
   npm run build
   npm run start
   ```

2. **Test on localhost:50123**:
   - Visit homepage
   - Test day selector
   - Check all resorts load
   - Monitor console for errors

3. **Verify API calls**:
   - Check Network tab in DevTools
   - Confirm requests go to infosnow.ch
   - Verify caching works (subsequent loads cached)

### 11.3 Deploy to Production

1. **Set environment variables** in hosting platform:
   - Vercel: Settings → Environment Variables
   - Railway: Variables tab
   - Add `INFOSNOW_API_TOKEN`
   - Add `INFOSNOW_API_BASE_URL` (optional, defaults to production URL)

2. **Deploy**:
   ```bash
   git add .
   git commit -m "feat: migrate from Open-Meteo to infosnow.ch API"
   git push origin main
   ```

3. **Monitor deployment**:
   - Watch build logs
   - Check for errors during build
   - Verify deployment succeeds

### 11.4 Post-Deployment Verification

1. **Test production site**:
   - Visit production URL
   - Test all 32 resorts load
   - Verify day selector works
   - Check scores are reasonable

2. **Monitor logs**:
   - Check application logs for errors
   - Look for API failures
   - Verify cache hit rate

3. **Performance check**:
   - Measure page load time
   - Verify <5 second initial load
   - Confirm subsequent loads <1 second (cached)

4. **Data validation**:
   - Compare with other ski websites (MySwitzerland, bergfex)
   - Verify snow depths match resort reports
   - Check piste openings are current

---

## Step 12: Rollback Plan

If critical issues are discovered:

### Option 1: Feature Flag Rollback

If you implemented feature flag in Step 6:

1. **Set environment variable**:
   ```
   USE_INFOSNOW_API=false
   ```

2. **Redeploy** (environment variable change triggers rebuild)

3. **Verify** Open-Meteo is working

### Option 2: Git Revert

If no feature flag:

1. **Identify commit** before migration:
   ```bash
   git log --oneline
   ```

2. **Revert migration commit**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Redeploy automatically**

### Option 3: Hotfix

If only specific issues:

1. **Identify failing resorts** from logs
2. **Temporarily remove** from resorts.json or mapping
3. **Quick fix** and redeploy
4. **Add resorts back** once fixed

---

## Success Metrics

After successful migration, you should see:

### Data Quality
- ✅ Live piste opening percentages (vs static data)
- ✅ Resort-reported snow measurements (more accurate)
- ✅ Multiple measurement points per resort (averaged)
- ✅ Industry-standard data source

### Performance
- ✅ Page load time: <5 seconds (initial)
- ✅ Cached loads: <1 second
- ✅ API calls: ~64 per hour (with caching)
- ✅ Cache hit rate: >80% after first load

### Reliability
- ✅ All 32 resorts have data
- ✅ Graceful error handling (fallbacks)
- ✅ No breaking errors in production
- ✅ Consistent scores across days

---

## Troubleshooting

### Issue: "No mapping found for resort X"

**Cause**: Resort not in `infosnow-resort-mapping.json`

**Fix**:
1. Find infosnow.ch ID for resort X
2. Add to mapping JSON
3. Redeploy

### Issue: XML parsing errors

**Cause**: Unexpected XML structure from API

**Fix**:
1. Log raw XML response: `console.log(xmlText)`
2. Inspect actual structure
3. Update parser to match structure
4. Add more defensive parsing

### Issue: Slow page loads

**Cause**: Too many sequential API calls

**Fix**:
1. Increase `BATCH_SIZE` (currently 10)
2. Verify caching is working (check cache headers)
3. Consider build-time data fetching

### Issue: Missing data for some resorts

**Cause**: Resort not available in infosnow.ch or wrong ID

**Fix**:
1. Verify resort ID is correct
2. Test API call manually: `curl https://infosnow.ch/api/v1/export?resortId=X&token=Y&type=WTDaily`
3. If resort not available, remove from mapping or use fallback data

### Issue: Invalid scores

**Cause**: Unit conversion error or data mismatch

**Fix**:
1. Run comparison script: `npx tsx scripts/compare-apis.ts`
2. Check metric extraction logic
3. Verify unit conversions (km/h → m/s, etc.)
4. Compare with other ski websites

---

## Timeline

**Estimated time to completion: 9-14 days**

### Week 1: Setup & Core Implementation (Days 1-7)
- Days 1-2: Obtain API access, create resort mapping
- Days 3-4: Implement infosnow client, parser, schemas
- Days 5-6: Update metrics extraction, weather client
- Day 7: Add live piste data integration

### Week 2: Testing & Deployment (Days 8-14)
- Days 8-9: Unit tests, integration tests
- Days 10-11: Manual testing, comparison validation
- Day 12: Fix issues, polish
- Day 13: Deploy to staging, final testing
- Day 14: Deploy to production, monitor

---

## Data Mapping Reference

Quick reference for metric conversions:

| Metric | Open-Meteo | Infosnow.ch | Conversion |
|--------|------------|-------------|------------|
| Snow depth | `hourly.snow_depth` | `(snowHeightResort + ArenaLow + ArenaHigh) / 3` | Average 3 locations |
| 48h snowfall | `hourly.snowfall` sum (48h) | `(snowHeightNew × 3 locations / 3) × 2` | Average × 2 |
| Temperature | `hourly.temperature_2m` avg | `(minTemp + maxTemp) / 2` | Daily avg |
| Wind speed | `hourly.windspeed_10m` avg (m/s) | `windForce / 3.6` (km/h → m/s) | Unit conversion |
| Sunshine | `daily.sunshine_duration` sum (seconds) | `sunshineHours` sum (hours) | Direct |
| Piste open % | Static `pisteInfo.open / total` | `SKIPISTE open / total` | Live counts |

---

## API Endpoint Reference

### WTDaily (Snow & Weather)
```
GET https://infosnow.ch/api/v1/export?resortId={id}&token={token}&type=WTDaily
```

**Returns**: XML with snow depth, 24h snowfall, 3-day forecasts

### METEOSRF (7-Day Forecasts)
```
GET https://infosnow.ch/api/v1/export?resortId={id}&token={token}&type=METEOSRF
```

**Returns**: XML with 7-day temperature, wind, sunshine forecasts

### SKIPISTE (Piste Status)
```
GET https://infosnow.ch/api/v1/export?resortId={id}&token={token}&type=SKIPISTE
```

**Returns**: XML with piste counts and open/closed status

---

## Additional Resources

- **Infosnow.ch Documentation**: https://infosnow.ch/doc/
- **API Access Token Generator**: https://infosnow.ch/api/?p=244
- **API Type 1 Overview**: https://infosnow.ch/doc/?p=164
- **WTDaily Documentation**: https://infosnow.ch/doc/?p=140
- **SKIPISTE Documentation**: https://infosnow.ch/doc/?p=149
- **fast-xml-parser**: https://github.com/NaturalIntelligence/fast-xml-parser

---

## Next Steps

1. **Send API access request email** (use template in Step 1.1)
2. **Start resort ID mapping** while waiting for API access
3. **Set up development environment** (install dependencies, create file structure)
4. **Begin implementation** once API token received

Good luck with the migration! 🎿
