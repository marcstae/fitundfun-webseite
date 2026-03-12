import { z } from 'zod'

export const LagerSchema = z.object({
  jahr: z.number().int().min(2000).max(2100),
  titel: z.string().min(1, 'Titel erforderlich').max(200, 'Titel zu lang'),
  datumVon: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  datumBis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  beschreibung: z.string().max(10000).optional().nullable().or(z.literal('')),
  preis: z.string().max(100).optional().nullable().or(z.literal('')),
  immichAlbumUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  istAktuell: z.boolean().optional(),
})

export const LagerUpdateSchema = z.object({
  jahr: z.number().int().min(2000).max(2100).optional(),
  titel: z.string().max(200, 'Titel zu lang').optional().or(z.literal('')),
  datumVon: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  datumBis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  beschreibung: z.string().max(10000).optional().nullable().or(z.literal('')),
  preis: z.string().max(100).optional().nullable().or(z.literal('')),
  immichAlbumUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  istAktuell: z.boolean().optional(),
})
