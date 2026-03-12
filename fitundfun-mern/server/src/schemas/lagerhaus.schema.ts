import { z } from 'zod'

export const LagerhausSchema = z.object({
  titel: z.string().max(200, 'Titel zu lang').optional().nullable(),
  beschreibung: z.string().max(10000).optional().nullable(),
})
