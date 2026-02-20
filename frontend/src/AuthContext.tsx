import { createContext, useContext, useEffect, useState } from 'react'
import * as auth from './authClient'

type AuthCtx = {
  accessToken: string | null
  user: any | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('token')
  })

  const [user, setUser] = useState<any | null>(() => {
    const savedUser = localStorage.getItem('mealmajor_user')
    try {
      return savedUser ? JSON.parse(savedUser) : null
    } catch (e) {
      return null
    }
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth
      .refresh()
      .then((data: any) => {
        const token = typeof data === 'string' ? data : data.accessToken;
        setAccessToken(token);

        if (data.user) {
          setUser(data.user);
          localStorage.setItem('mealmajor_user', JSON.stringify(data.user));
        }
        if (token) {
          localStorage.setItem('token', token);
        }
      })
      .catch(() => {
        
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('mealmajor_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await auth.login(email, password) as any;
    const token = typeof data === 'string' ? data : data.accessToken;
    setAccessToken(token);
    const userToSave = data.user ? data.user : { email: email, name: data.name || 'User' }; 

    setUser(userToSave); 
    localStorage.setItem('mealmajor_user', JSON.stringify(userToSave));
    
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  const register = async (email: string, password: string, name: string) => {
    await auth.register(email, password, name)
  }

  const logout = async () => {
    await auth.logout()
    setAccessToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('mealmajor_user')
  }

  return (
    <AuthContext.Provider value={{ accessToken, user, loading, login, register, logout }}>
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