import { z } from 'zod'

// Resort data schema
export const ResortSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.enum(['Valais', 'Vaud', 'Bern']),
  coordinates: z.object({
    lat: z.number().min(45).max(48),
    lon: z.number().min(5).max(11),
  }),
  elevation: z.number().positive(),
  pisteInfo: z.object({
    total: z.number().positive(),
    open: z.number().nonnegative(),
  }),
})

export type Resort = z.infer<typeof ResortSchema>

// Array of resorts
export const ResortsArraySchema = z.array(ResortSchema)

export type ResortsArray = z.infer<typeof ResortsArraySchema>
