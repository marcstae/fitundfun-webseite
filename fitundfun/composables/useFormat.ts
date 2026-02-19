export const useFormat = () => {
  /** Langes Datum: "31. Januar 2026" */
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-CH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  /** Kurzes Datum: "31.01.2026" */
  const formatDateShort = (date: string | Date | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-CH')
  }

  /** Datum + Uhrzeit: "31.01.2026, 14:30" */
  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return { formatDate, formatDateShort, formatDateTime }
}
