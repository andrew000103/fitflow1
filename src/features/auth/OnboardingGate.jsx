import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import BrandLoader from '../../components/BrandLoader.jsx'
import { supabase } from '../../lib/supabase'

export default function OnboardingGate({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let mounted = true

    const check = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          if (mounted) setStatus('unauthenticated')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          if (mounted) setStatus('needs_onboarding')
          return
        }

        if (!data || data.onboarding_completed !== true) {
          if (mounted) setStatus('needs_onboarding')
          return
        }

        if (mounted) setStatus('ready')
      } catch {
        if (mounted) setStatus('needs_onboarding')
      }
    }

    check()

    return () => {
      mounted = false
    }
  }, [])

  if (status === 'loading') {
    return <BrandLoader />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/auth" replace />
  }

  if (status === 'needs_onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
