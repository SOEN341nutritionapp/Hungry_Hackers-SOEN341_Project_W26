import { createContext, useContext, useEffect, useState } from 'react'
import * as auth from './authClient'

type AuthCtx = {
  accessToken: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth
      .refresh()
      .then(setAccessToken)
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const token = await auth.login(email, password)
    setAccessToken(token)
  }

  const register = async (email: string, password: string, name: string) => {
    await auth.register(email, password, name)
  }

  const logout = async () => {
    await auth.logout()
    setAccessToken(null)
  }

  return (
    <AuthContext.Provider value={{ accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
