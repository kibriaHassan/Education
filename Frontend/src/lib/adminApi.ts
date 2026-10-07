const TOKEN_KEY = 'ankashala-admin-token'

export class AdminError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code = '') {
    super(message)
    this.status = status
    this.code = code
  }
}

export function readAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY) ?? ''
}

export function saveAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function adminLogin(email: string, password: string) {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = (await response.json().catch(() => ({}))) as { message?: string; token?: string; code?: string }
  if (!response.ok || !data.token) throw new AdminError(data.message || 'ঢোকা যায়নি।', response.status, data.code)
  return data.token
}

export async function adminRequest<T>(path: string, token: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, { ...init, headers })
  const data = (await response.json().catch(() => ({}))) as T & { message?: string; code?: string }
  if (!response.ok) throw new AdminError(data.message || 'কাজ হয়নি।', response.status, data.code)
  return data
}
