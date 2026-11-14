import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthCard } from '../components/ui/AuthCard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/useAuth'
import type { Role } from '../lib/roles'

function FullScreenMessage({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-grafite-950 text-slate-400">
      <p role="status">{text}</p>
    </main>
  )
}

/** Exige usuário logado. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenMessage text="Carregando…" />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Exige usuário logado E com conta ativada por um administrador. */
export function RequireActive() {
  const { profile, profileError, signOut } = useAuth()
  if (profileError || !profile) {
    return (
      <AuthCard title="Não foi possível carregar seu perfil" subtitle="Tente entrar novamente. Se continuar, avise um administrador.">
        <Button onClick={() => void signOut()} className="w-full">
          Sair
        </Button>
      </AuthCard>
    )
  }
  if (!profile.active) return <Navigate to="/aguardando-ativacao" replace />
  return <Outlet />
}

/** Restringe uma área a certos perfis. Usar dentro de RequireActive. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { profile } = useAuth()
  if (!profile || !roles.includes(profile.role)) return <Navigate to="/" replace />
  return <Outlet />
}
