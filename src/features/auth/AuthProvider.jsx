import { createContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

export const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initialize() {
      const authSearchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const authCode = authSearchParams?.get('code')

      if (authCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)

        if (exchangeError) {
          console.error('exchangeCodeForSession error:', exchangeError.message)
        } else if (typeof window !== 'undefined') {
          const nextUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`
          window.history.replaceState({}, document.title, nextUrl)
        }
      }

      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('getSession error:', error.message)
      }

      setSession(data?.session ?? null)
      setUser(data?.session?.user ?? null)
      setLoading(false)
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    return {
      session,
      user,
      loading,
      isLoggedIn: !!user,
      isAnonymous: user?.is_anonymous ?? false,
    }
  }, [session, user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
