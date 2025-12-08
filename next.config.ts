import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable explicit caching with Cache Components
  cacheComponents: true,

  // Custom cache profiles for weather data
  cacheLife: {
    hours: {
      stale: 3600,      // 1 hour - serve cached data
      revalidate: 900,  // 15 min - background refresh trigger
      expire: 7200,     // 2 hours - hard expiration
    },
  },

  // Turbopack is now default (no config needed)
  // Optional: Enable React Compiler for auto-memoization (adds build time)
  // reactCompiler: true,
}

export default nextConfig
