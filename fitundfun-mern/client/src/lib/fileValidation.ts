export interface FileValidationResult {
  valid: boolean
  error?: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_PDF_TYPES = ['application/pdf']
const ALLOWED_PDF_EXTENSIONS = ['.pdf']
const MAX_PDF_SIZE = 10 * 1024 * 1024

export function validateImageFile(file: File): FileValidationResult {
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Bild zu gross (max. ${MAX_IMAGE_SIZE / 1024 / 1024}MB)` }
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Ungueltiger Dateityp. Erlaubt: JPG, PNG, GIF, WebP' }
  }
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Ungueltige Dateiendung' }
  }
  return { valid: true }
}

export function validatePdfFile(file: File): FileValidationResult {
  if (file.size > MAX_PDF_SIZE) {
    return { valid: false, error: `PDF zu gross (max. ${MAX_PDF_SIZE / 1024 / 1024}MB)` }
  }
  if (!ALLOWED_PDF_TYPES.includes(file.type)) {
    return { valid: false, error: 'Ungueltiger Dateityp. Nur PDF erlaubt.' }
  }
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!ext || !ALLOWED_PDF_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Ungueltige Dateiendung. Nur .pdf erlaubt.' }
  }
  return { valid: true }
}
