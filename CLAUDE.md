# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Où Skier! is a Next.js 16 web application that ranks the top 3 Swiss ski resorts for the next 5 days based on weather conditions, snowfall forecasts, sunshine, and piste openings. The app uses official MeteoSwiss data via the Open-Meteo API.

## Common Development Commands

```bash
# Development server (runs on port 50123)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### Data Flow

1. **Data Fetching**: `app/page.tsx` orchestrates the entire data pipeline
   - Fetches all resorts from `lib/resorts/data.ts` (loads from `data/resorts.json`)
   - Batches weather API calls for all resorts in a single request to `lib/weather/client.ts`
   - Pre-calculates scores for all 5 days for all resorts using `lib/scoring/engine.ts`

2. **Scoring System**: Two-phase scoring approach
   - `calculateResortScoresForAllDays()`: Pre-computes scores for days 0-4 for each resort
   - `scoreResortsForDay()`: Filters and re-ranks resorts for selected day
   - This architecture enables instant day switching without re-computation

3. **Metrics Extraction**: `lib/weather/metrics.ts` has two key functions
   - `extractWeatherMetrics()`: Aggregates 5-day weather data (used for overall scoring)
   - `extractDayMetrics()`: Extracts 24-hour window for specific day (used for daily scoring)

### Scoring Algorithm

The scoring engine (`lib/scoring/engine.ts`) uses weighted factors (total 100%):

| Factor | Weight | Logic |
|--------|--------|-------|
| Recent Snowfall (48h) | 25% | Linear: 0-50cm → 0-100 points |
| Snow Depth | 15% | Linear: 0-300cm → 0-100 points |
| Piste Openings | 20% | Direct percentage of open pistes |
| Wind | 10% | Inverse: 0-20 m/s → 100-0 points |
| Temperature | 5% | Gaussian: optimal -6°C, σ=3°C |
| Sunshine | 25% | Linear: 0-40 hours → 0-100 points |

**Critical**: When modifying weights in `WEIGHTS` constant, ensure they sum to 100%.

### Caching Strategy

Next.js 16's explicit caching is configured in two places:

1. **API Level**: `lib/weather/client.ts` uses `'use cache'` directive with `cacheLife('hours')`
   - 1 hour stale time (serves cached data)
   - 15 minute revalidate (background refresh)
   - In-memory request deduplication to prevent duplicate API calls during build

2. **App Level**: `next.config.ts` defines `cacheLife` profiles
   - `hours`: stale 1h, revalidate 15min, expire 2h

### Weather API

- **Provider**: Open-Meteo MeteoSwiss API
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Batching**: All resort coordinates sent in single request (latitudes + longitudes as comma-separated strings)
- **Rate Limiting**: 500ms delay between requests enforced in `lib/weather/client.ts`
- **Response Handling**: API returns array of weather objects or single object depending on location count
- **Validation**: All responses validated with Zod schemas in `lib/weather/schemas.ts`

### TypeScript Patterns

- **Strict Mode**: TypeScript strict mode enabled
- **Path Aliases**: `@/*` maps to project root (e.g., `@/lib/resorts/data`)
- **Validation**: Zod schemas define runtime validation (see `lib/*/schemas.ts` files)
- **Type Flow**:
  - `Resort` → base resort data from JSON
  - `ScoredResort` → Resort + score + rank + weather + breakdown
  - `MultiDayScoredResort` → Resort + array of 5 DayScore objects
  - `DayRankings` → sorted ScoredResort[] for specific day

### Component Structure

- **Server Components**: All components are server components by default (Next.js 16)
- **Client Components**: Only `DaySelector.tsx` uses `'use client'` for interactivity
- **UI Components**: Vanilla CSS in `components/ui/` (no CSS-in-JS library)
- **Styling**: CSS variables defined in `styles/globals.css` for "Alpine Clean" design system

### Resort Data Structure

`data/resorts.json` contains 32 Swiss resorts with:
- Unique `id` (lowercase, hyphenated)
- Geographic `coordinates` (lat/lon for API calls)
- `elevation` in meters
- `pisteInfo` (total and currently open pistes)
- Regions: "Valais", "Vaud", or "Bern"

**Important**: When adding resorts, ensure coordinates are accurate as they directly affect weather data quality.

## Key Technical Decisions

### Why Next.js 16?
- Turbopack for faster builds (5-10x dev, 2-5x prod)
- Server Components reduce client JS
- Explicit caching via `'use cache'` + `cacheLife`

### Why Open-Meteo MeteoSwiss?
- Official MeteoSwiss ICON-CH1/CH2 models
- JSON format (vs complex GRIB2 binary)
- 1-2km resolution optimal for Alpine terrain
- Free tier: 10k calls/day
- Direct MeteoSwiss API not available until Q2 2026

### Why Pre-calculate All Days?
- Enables instant day switching (no loading state)
- All 5 days calculated in single render on server
- Client-side day selection just filters pre-computed scores

## File Organization

```
lib/
├── resorts/          # Resort data layer
│   ├── data.ts       # JSON loader + helpers
│   ├── schemas.ts    # Zod validation
│   └── types.ts      # TypeScript types
├── weather/          # Weather API integration
│   ├── client.ts     # API client with caching
│   ├── metrics.ts    # Data transformation (5-day + daily)
│   ├── schemas.ts    # Zod validation
│   └── types.ts      # TypeScript types
├── scoring/          # Ranking algorithm
│   ├── engine.ts     # Score calculation logic
│   └── types.ts      # TypeScript types
└── utils/
    └── date.ts       # Date formatting utilities
```

## Modifying the Scoring Algorithm

To adjust scoring weights or logic:

1. Update `WEIGHTS` constant in `lib/scoring/engine.ts` (must sum to 100%)
2. Modify individual score functions (e.g., `calculateSnowfallScore`)
3. Test with `npm run dev` and compare rankings on homepage

To add new scoring factors:
1. Add field to `ScoreBreakdown` type in `lib/resorts/types.ts`
2. Add weight to `WEIGHTS` in `lib/scoring/engine.ts`
3. Extract new metric in `lib/weather/metrics.ts`
4. Create score calculation function in `lib/scoring/engine.ts`
5. Update `calculateScoreFromMetrics()` to include new factor
