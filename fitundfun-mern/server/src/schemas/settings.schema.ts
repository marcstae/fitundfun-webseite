import { z } from 'zod'

export const SettingsSchema = z.object({
  siteTitle: z.string().max(200, 'Titel zu lang').optional().nullable(),
  contactEmail: z.string().email('Ungültige E-Mail').max(255).optional().nullable(),
  heroImageUrl: z.string().max(500).optional().nullable(),
})
