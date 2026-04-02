import axios from 'axios'

const AUTH_KEY = 'trampo_auth'

export function saveAuth(data: {
  accessToken: string
  refreshToken: string
  tenantId: string
  name: string
  businessName: string
}) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

export function getAuth() {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      accessToken: string
      refreshToken: string
      tenantId: string
      name: string
      businessName: string
    }
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
}

export function getAccessToken(): string | null {
  return getAuth()?.accessToken ?? null
}

// ── Axios instance ─────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
})

// Interceptor de request: injeta Bearer token
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de response: 401 → desloga e redireciona
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
