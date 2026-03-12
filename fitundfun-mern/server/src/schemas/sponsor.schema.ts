import { z } from 'zod'

export const SponsorSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(100, 'Name zu lang'),
  websiteUrl: z.string().url('Ungültige URL').max(500).optional().nullable().or(z.literal('')),
  logoUrl: z.string().max(500).optional().nullable(),
  reihenfolge: z.number().int().min(0).optional(),
})
