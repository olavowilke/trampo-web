import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { clearAuth, getAuth, saveAuth } from '../lib/api'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  setAuthData: (data: {
    accessToken: string
    refreshToken: string
    tenantId: string
    name: string
    businessName: string
  }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function buildUser(): AuthUser | null {
  const auth = getAuth()
  if (!auth) return null
  return { tenantId: auth.tenantId, name: auth.name, businessName: auth.businessName }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(buildUser)

  const setAuthData = useCallback(
    (data: {
      accessToken: string
      refreshToken: string
      tenantId: string
      name: string
      businessName: string
    }) => {
      saveAuth(data)
      setUser({ tenantId: data.tenantId, name: data.name, businessName: data.businessName })
    },
    [],
  )

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, setAuthData, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
