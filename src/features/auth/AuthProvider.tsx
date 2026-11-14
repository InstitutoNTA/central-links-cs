import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { AuthContext, type AuthState } from './auth-context'
import { friendlyAuthError } from './messages'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setInitializing(false)
    })
    // Dentro do callback não se chama o Supabase (evita deadlock); só atualiza o estado.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as string)
        .single()
      if (error) throw error
      return data
    },
  })

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return { error: error ? friendlyAuthError(error) : null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }, [queryClient])

  const refetchProfile = profileQuery.refetch
  const refreshProfile = useCallback(async () => {
    await refetchProfile()
  }, [refetchProfile])

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile: profileQuery.data ?? null,
      loading: initializing || (!!userId && profileQuery.isPending),
      profileError: !!userId && profileQuery.isError,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profileQuery.data, profileQuery.isPending, profileQuery.isError, initializing, userId, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
