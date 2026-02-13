export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
