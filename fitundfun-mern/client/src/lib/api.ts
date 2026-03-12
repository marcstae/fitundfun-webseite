const API_BASE = import.meta.env.VITE_API_URL || ''

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const error: Error & { status?: number; data?: unknown } = new Error(
      errorData.message || res.statusText
    )
    error.status = res.status
    error.data = errorData
    throw error
  }

  return res.json()
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const error: Error & { status?: number; data?: unknown } = new Error(
      errorData.message || res.statusText
    )
    error.status = res.status
    error.data = errorData
    throw error
  }

  return res.json()
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE}/uploads/images/${path}`
}

export function getPdfUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE}/uploads/pdfs/${path}`
}
