export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('de-CH')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
