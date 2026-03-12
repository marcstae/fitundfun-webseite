export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
  }

  return mimeTypes[ext || ''] || 'application/octet-stream'
}
