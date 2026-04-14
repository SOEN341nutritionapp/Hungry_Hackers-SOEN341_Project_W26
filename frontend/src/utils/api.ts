const API_URL =
  import.meta.env?.VITE_API_URL ??
  (import.meta as any).env?.REACT_APP_API_URL ??
  'http://localhost:3000'

// Single helper function
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Request failed')
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

// Exported functions become one-liners
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>('GET', path, token)
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  return apiRequest<T>('POST', path, token, body)
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  return apiRequest<T>('PATCH', path, token, body)
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>('DELETE', path, token)
}