import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Tables } from '../../types/database.types'

export type Profile = Tables<'profiles'>

export interface AuthState {
  session: Session | null
  profile: Profile | null
  /** true enquanto a sessão ou o perfil ainda estão sendo carregados */
  loading: boolean
  /** true se a sessão existe mas o perfil não pôde ser lido */
  profileError: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
