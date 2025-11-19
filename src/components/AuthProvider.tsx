'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { useAppStore } from '@/lib/store'

interface AuthContextType {
  user: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const setUser = useAppStore((state) => state.setUser)

  useEffect(() => {
    // Sync auth state with global store
    if (auth.user) {
      setUser(auth.user)
    } else {
      setUser(null)
    }
  }, [auth.user, setUser])

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}