/**
 * Server-side validation utilities using Zod
 * 
 * Security: All user inputs should be validated before processing
 */
import { z } from 'zod'
import { H3Event, createError } from 'h3'

// =====================
// Validation Schemas
// =====================

/**
 * Login credentials schema
 */
export const LoginSchema = z.object({
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang'),
  password: z.string()
    .min(1, 'Passwort erforderlich')
    .max(128, 'Passwort zu lang')
})

/**
 * Contact form message schema
 */
export const ContactMessageSchema = z.object({
  name: z.string()
    .min(1, 'Name erforderlich')
    .max(100, 'Name zu lang')
    .regex(/^[a-zA-ZäöüÄÖÜß\s\-']+$/, 'Name enthält ungültige Zeichen'),
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang'),
  nachricht: z.string()
    .min(10, 'Nachricht muss mindestens 10 Zeichen haben')
    .max(5000, 'Nachricht zu lang (max. 5000 Zeichen)')
})

/**
 * Settings update schema (admin only)
 */
export const SettingsSchema = z.object({
  site_title: z.string()
    .max(200, 'Titel zu lang')
    .optional()
    .nullable(),
  contact_email: z.string()
    .email('Ungültige E-Mail')
    .max(255)
    .optional()
    .nullable(),
  hero_image_url: z.string()
    .max(500)
    .optional()
    .nullable()
})

/**
 * Sponsor schema
 */
export const SponsorSchema = z.object({
  name: z.string()
    .min(1, 'Name erforderlich')
    .max(100, 'Name zu lang'),
  website_url: z.string()
    .url('Ungültige URL')
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('')),
  logo_url: z.string()
    .max(500)
    .optional()
    .nullable(),
  reihenfolge: z.number()
    .int()
    .min(0)
    .optional()
})

/**
 * Lager (camp) schema
 */
/** Basis-Schema für Lager (Create — alle Pflichtfelder required) */
export const LagerSchema = z.object({
  jahr: z.number()
    .int()
    .min(2000)
    .max(2100),
  titel: z.string()
    .min(1, 'Titel erforderlich')
    .max(200, 'Titel zu lang'),
  datum_von: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  datum_bis: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  beschreibung: z.string()
    .max(10000)
    .optional()
    .nullable()
    .or(z.literal('')),
  preis: z.string()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal('')),
  immich_album_url: z.string()
    .url()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('')),
  ist_aktuell: z.boolean()
    .optional()
})

/** Update-Schema: Alle Felder optional, leere Strings erlaubt */
export const LagerUpdateSchema = z.object({
  jahr: z.number().int().min(2000).max(2100).optional(),
  titel: z.string().max(200, 'Titel zu lang').optional().or(z.literal('')),
  datum_von: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  datum_bis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  beschreibung: z.string().max(10000).optional().nullable().or(z.literal('')),
  preis: z.string().max(100).optional().nullable().or(z.literal('')),
  immich_album_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  ist_aktuell: z.boolean().optional(),
})

// =====================
// Validation Helpers
// =====================

/**
 * Validate request body against a Zod schema
 * Throws a 400 error with details if validation fails
 */
export async function validateBody<T extends z.ZodSchema>(
  event: H3Event,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown
  try {
    body = await readBody(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiger Request-Body',
    })
  }

  if (body === null || body === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request-Body fehlt',
    })
  }

  const result = schema.safeParse(body)

  if (!result.success) {
    const issues = result.error?.issues ?? []
    const errors = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    // Debug-Log: Was genau schlägt fehl?
    console.error('[validateBody] Validation failed:', JSON.stringify({ body, errors }, null, 2))

    throw createError({
      statusCode: 400,
      statusMessage: 'Validierungsfehler',
      data: { errors },
    })
  }

  return result.data
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodSchema>(
  event: H3Event,
  schema: T
): z.infer<T> {
  const query = getQuery(event)
  
  const result = schema.safeParse(query)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültige Parameter'
    })
  }
  
  return result.data
}

// =====================
// File Upload Validation
// =====================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

/**
 * Validate uploaded file
 */
export function validateFile(
  file: { name: string; type: string; size: number },
  options: FileValidationOptions = {}
): void {
  const {
    maxSize = MAX_IMAGE_SIZE,
    allowedTypes = ALLOWED_IMAGE_TYPES,
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options
  
  // Size check
  if (file.size > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: `Datei zu gross (max. ${Math.round(maxSize / 1024 / 1024)}MB)`
    })
  }
  
  // MIME type check
  if (!allowedTypes.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiger Dateityp'
    })
  }
  
  // Extension check
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültige Dateiendung'
    })
  }
}

/**
 * Validate image file specifically
 */
export function validateImageFile(file: { name: string; type: string; size: number }): void {
  validateFile(file, {
    maxSize: MAX_IMAGE_SIZE,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  })
}

/**
 * Validate PDF file specifically
 */
export function validatePdfFile(file: { name: string; type: string; size: number }): void {
  validateFile(file, {
    maxSize: MAX_DOCUMENT_SIZE,
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    allowedExtensions: ['.pdf']
  })
}

// =====================
// Sanitization Helpers
// =====================

/**
 * Sanitize a filename for storage
 * Removes special characters and prevents directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only alphanumeric, dots, underscores, hyphens
    .replace(/\.{2,}/g, '.') // No double dots (path traversal)
    .replace(/^\./, '_') // No leading dots (hidden files)
    .slice(0, 255) // Max filename length
}

/**
 * Sanitize text input (basic XSS prevention)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}
