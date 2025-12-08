import resortsData from '@/data/resorts.json'
import { ResortsArraySchema, type Resort } from './schemas'

// Load and validate all resorts
const validationResult = ResortsArraySchema.safeParse(resortsData)

if (!validationResult.success) {
  console.error('Invalid resorts data:', validationResult.error)
  throw new Error('Failed to load resorts data')
}

const resorts = validationResult.data

/**
 * Get all resorts
 */
export async function getResorts(): Promise<Resort[]> {
  return resorts
}

/**
 * Get a single resort by ID
 */
export async function getResortById(id: string): Promise<Resort | null> {
  return resorts.find((resort) => resort.id === id) || null
}

/**
 * Get resorts by region
 */
export async function getResortsByRegion(
  region: 'Valais' | 'Vaud' | 'Bern'
): Promise<Resort[]> {
  return resorts.filter((resort) => resort.region === region)
}

/**
 * Calculate piste opening percentage
 */
export function getOpenPistePercentage(resort: Resort): number {
  if (resort.pisteInfo.total === 0) return 0
  return Math.round((resort.pisteInfo.open / resort.pisteInfo.total) * 100)
}
