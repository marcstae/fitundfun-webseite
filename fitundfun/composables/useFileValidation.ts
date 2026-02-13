/**
 * Client-side file validation utilities
 * 
 * Security: Validates files before uploading to prevent malicious uploads
 */

export interface FileValidationResult {
  valid: boolean
  error?: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_PDF_TYPES = ['application/pdf']
const ALLOWED_PDF_EXTENSIONS = ['.pdf']
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Validate an image file
 */
export function validateImageFile(file: File): FileValidationResult {
  // Size check
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Bild zu gross (max. ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`
    }
  }
  
  // MIME type check
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, GIF, WebP'
    }
  }
  
  // Extension check
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Ungültige Dateiendung'
    }
  }
  
  return { valid: true }
}

/**
 * Validate a PDF file
 */
export function validatePdfFile(file: File): FileValidationResult {
  // Size check
  if (file.size > MAX_PDF_SIZE) {
    return {
      valid: false,
      error: `PDF zu gross (max. ${MAX_PDF_SIZE / 1024 / 1024}MB)`
    }
  }
  
  // MIME type check
  if (!ALLOWED_PDF_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Ungültiger Dateityp. Nur PDF erlaubt.'
    }
  }
  
  // Extension check
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !ALLOWED_PDF_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Ungültige Dateiendung. Nur .pdf erlaubt.'
    }
  }
  
  return { valid: true }
}

/**
 * Sanitize filename for storage
 * Removes special characters and prevents directory traversal
 */
export function sanitizeFilename(filename: string): string {
  // Get extension
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
  
  // Get name without extension
  let name = filename.slice(0, -ext.length || undefined)
  
  // Sanitize: only alphanumeric, underscores, hyphens
  name = name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50) // Limit length
  
  // Ensure we have a valid name
  if (!name) {
    name = 'file'
  }
  
  return `${name}${ext}`
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName)
  const timestamp = Date.now()
  const ext = sanitized.match(/\.[^.]+$/)?.[0] || ''
  const name = sanitized.slice(0, -ext.length || undefined)
  
  return `${name}-${timestamp}${ext}`
}
